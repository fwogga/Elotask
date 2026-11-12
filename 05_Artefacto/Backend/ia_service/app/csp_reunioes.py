"""CSP aplicado ao agendamento de reuniões.

O backend Node recolhe os dados (convidados, ocupações) e envia-os; este módulo modela o problema como
CSP, resolve-o com o motor de app/csp.py e devolve horários possíveis. Não acede à base de dados.

Modelação:
  - Variável: cada reunião a agendar.
  - Domínio: horas de início possíveis (de `passo_min` em `passo_min` minutos, dentro da janela
    pedida, do horário de trabalho e, se pedido, só em dias úteis).
  - Restrição unária (disponibilidade): nenhum participante pode ter uma ocupação (outra reunião,
    ausência aprovada, turno, evento) que se sobreponha ao horário.
  - Restrição binária: duas reuniões com algum participante em comum não se podem sobrepor.
  - Preferência: horários mais cedo primeiro.
"""
from __future__ import annotations

import math
from bisect import bisect_right
from collections import Counter, defaultdict
from datetime import datetime, time, timedelta
from itertools import combinations
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from .csp import CSP
from .schemas import Pedido

MAX_JANELA_DIAS = 31
METODO = "CSP: AC-3, backtracking com MRV e forward checking"


# ---------------------------------------------------------------------------
# Contrato do pedido
# ---------------------------------------------------------------------------
def _sem_fuso(v: datetime) -> datetime:
    if v.tzinfo is not None:
        raise ValueError("Use datas sem fuso horário (hora local), por exemplo 2026-10-26 09:00:00.")
    return v


class ReuniaoPorAgendar(Pedido):
    id_reuniao: int
    duracao_min: int = Field(ge=15, le=480)
    participantes: list[int] = Field(min_length=1, max_length=50)  # ids; sem nomes nem emails
    janela_inicio: datetime
    janela_fim: datetime

    _fuso = field_validator("janela_inicio", "janela_fim")(_sem_fuso)

    @model_validator(mode="after")
    def _validar(self):
        if self.janela_fim <= self.janela_inicio:
            raise ValueError("janela_fim tem de ser posterior a janela_inicio.")
        if self.janela_fim - self.janela_inicio > timedelta(days=MAX_JANELA_DIAS):
            raise ValueError(f"A janela não pode exceder {MAX_JANELA_DIAS} dias.")
        self.participantes = list(dict.fromkeys(self.participantes))
        return self


class Ocupacao(Pedido):
    id_utilizador: int
    inicio: datetime
    fim: datetime
    motivo: Literal["reuniao", "ausencia", "turno", "evento", "outro"] = "outro"

    _fuso = field_validator("inicio", "fim")(_sem_fuso)

    @model_validator(mode="after")
    def _validar(self):
        if self.fim <= self.inicio:
            raise ValueError("fim tem de ser posterior a inicio.")
        return self


class HorarioTrabalho(Pedido):
    inicio: time = time(9, 0)
    fim: time = time(18, 0)

    @model_validator(mode="after")
    def _validar(self):
        if self.fim <= self.inicio:
            raise ValueError("O fim do horário de trabalho tem de ser posterior ao início.")
        return self


class PedidoHorarios(Pedido):
    reunioes: list[ReuniaoPorAgendar] = Field(min_length=1, max_length=10)
    ocupacoes: list[Ocupacao] = Field(default_factory=list, max_length=2000)
    horario_trabalho: HorarioTrabalho = Field(default_factory=HorarioTrabalho)
    dias_uteis: bool = True
    passo_min: Literal[15, 30, 60] = 30
    max_alternativas: int = Field(default=3, ge=1, le=10)

    @model_validator(mode="after")
    def _validar(self):
        ids = [r.id_reuniao for r in self.reunioes]
        if len(ids) != len(set(ids)):
            raise ValueError("Os id_reuniao têm de ser todos diferentes.")
        return self


# ---------------------------------------------------------------------------
# Contrato da resposta
# ---------------------------------------------------------------------------
class HorarioProposto(BaseModel):
    id_reuniao: int
    inicio: datetime
    fim: datetime


class Alternativa(BaseModel):
    horarios: list[HorarioProposto]


class ParticipanteOcupado(BaseModel):
    id_utilizador: int
    horarios_bloqueados: int


class DiagnosticoReuniao(BaseModel):
    id_reuniao: int
    horarios_candidatos: int          # dentro da janela e do horário de trabalho
    horarios_livres: int              # candidatos em que todos os participantes estão livres
    participantes_mais_ocupados: list[ParticipanteOcupado]


class RespostaHorarios(BaseModel):
    encontrou_solucao: bool
    alternativas: list[Alternativa]
    motivo: str | None = None
    diagnostico: list[DiagnosticoReuniao]
    incompleto: bool = False
    nos_visitados: int = 0
    metodo: str = METODO


# ---------------------------------------------------------------------------
# Agenda de cada participante (intervalos ocupados, fundidos e ordenados)
# ---------------------------------------------------------------------------
class _Agenda:
    def __init__(self, intervalos: list[tuple[datetime, datetime]]):
        fundidos: list[list[datetime]] = []
        for ini, fim in sorted(intervalos):
            if fundidos and ini <= fundidos[-1][1]:
                fundidos[-1][1] = max(fundidos[-1][1], fim)
            else:
                fundidos.append([ini, fim])
        self._inicios = [i for i, _ in fundidos]
        self._fins = [f for _, f in fundidos]

    def ocupada(self, inicio: datetime, fim: datetime) -> bool:
        """True se algum intervalo ocupado se sobrepõe a [inicio, fim). Encostar não conta."""
        k = bisect_right(self._fins, inicio)  # primeiro intervalo que termina depois de `inicio`
        return k < len(self._inicios) and self._inicios[k] < fim


# ---------------------------------------------------------------------------
# Construção do domínio
# ---------------------------------------------------------------------------
def _arredondar_para_cima(t: datetime, passo_min: int) -> datetime:
    meia_noite = t.replace(hour=0, minute=0, second=0, microsecond=0)
    passo = passo_min * 60
    n = math.ceil((t - meia_noite).total_seconds() / passo)
    return meia_noite + timedelta(seconds=n * passo)


def _candidatos(r: ReuniaoPorAgendar, pedido: PedidoHorarios) -> list[datetime]:
    duracao = timedelta(minutes=r.duracao_min)
    passo = timedelta(minutes=pedido.passo_min)
    horario = pedido.horario_trabalho
    resultado = []
    t = _arredondar_para_cima(r.janela_inicio, pedido.passo_min)
    while t + duracao <= r.janela_fim:
        fim = t + duracao
        if ((not pedido.dias_uteis or t.weekday() < 5)
                and fim.date() == t.date()
                and horario.inicio <= t.time() and fim.time() <= horario.fim):
            resultado.append(t)
        t += passo
    return resultado


# ---------------------------------------------------------------------------
# Resolução
# ---------------------------------------------------------------------------
def sugerir_horarios(pedido: PedidoHorarios) -> RespostaHorarios:
    agendas: dict[int, _Agenda] = {}
    intervalos = defaultdict(list)
    for o in pedido.ocupacoes:
        intervalos[o.id_utilizador].append((o.inicio, o.fim))
    for u, lista in intervalos.items():
        agendas[u] = _Agenda(lista)
    sem_ocupacoes = _Agenda([])

    dominios: dict[int, list[datetime]] = {}
    bloqueados: dict[tuple[int, datetime], set[int]] = {}
    diagnostico: list[DiagnosticoReuniao] = []

    for r in pedido.reunioes:
        duracao = timedelta(minutes=r.duracao_min)
        candidatos = _candidatos(r, pedido)
        dominios[r.id_reuniao] = candidatos
        contagem: Counter = Counter()
        livres = 0
        for inicio in candidatos:
            fim = inicio + duracao
            bloq = {u for u in r.participantes if agendas.get(u, sem_ocupacoes).ocupada(inicio, fim)}
            bloqueados[(r.id_reuniao, inicio)] = bloq
            livres += not bloq
            contagem.update(bloq)
        diagnostico.append(DiagnosticoReuniao(
            id_reuniao=r.id_reuniao, horarios_candidatos=len(candidatos), horarios_livres=livres,
            participantes_mais_ocupados=[ParticipanteOcupado(id_utilizador=u, horarios_bloqueados=n)
                                         for u, n in contagem.most_common(3)]))

    def sem_solucao(motivo: str, **extra) -> RespostaHorarios:
        return RespostaHorarios(encontrou_solucao=False, alternativas=[], motivo=motivo,
                                diagnostico=diagnostico, **extra)

    # Falhas que se explicam sem pesquisar
    for d in diagnostico:
        if d.horarios_candidatos == 0:
            return sem_solucao(f"A reunião {d.id_reuniao} não tem horários possíveis na janela indicada "
                               "(dentro do horário de trabalho e dos dias permitidos).")
    for d in diagnostico:
        if d.horarios_livres == 0:
            ocupados = ", ".join(f"{p.id_utilizador} ({p.horarios_bloqueados} horários)"
                                 for p in d.participantes_mais_ocupados)
            return sem_solucao(f"Não há nenhum horário em que todos os participantes da reunião "
                               f"{d.id_reuniao} estejam livres. Mais ocupados: {ocupados}.")

    # Modelo CSP
    csp = CSP(dominios)
    for r in pedido.reunioes:
        csp.adicionar_restricao_unaria(
            r.id_reuniao, lambda inicio, rid=r.id_reuniao: not bloqueados[(rid, inicio)])
    for a, b in combinations(pedido.reunioes, 2):
        if set(a.participantes) & set(b.participantes):
            da, db = timedelta(minutes=a.duracao_min), timedelta(minutes=b.duracao_min)
            csp.adicionar_restricao_binaria(
                a.id_reuniao, b.id_reuniao, lambda x, y, da=da, db=db: x + da <= y or y + db <= x)

    inicio_janela = {r.id_reuniao: r.janela_inicio for r in pedido.reunioes}
    custo = lambda var, valor: (valor - inicio_janela[var]).total_seconds()  # noqa: E731 - mais cedo é melhor
    resultado = csp.resolver(limite=pedido.max_alternativas, custo=custo, max_nos=50_000)

    if not resultado.solucoes:
        motivo = ("Não foi possível encontrar horários que satisfaçam todas as reuniões em simultâneo: "
                  "as reuniões com participantes em comum não cabem sem se sobreporem."
                  if not resultado.incompleto else resultado.motivo)
        return sem_solucao(motivo, incompleto=resultado.incompleto, nos_visitados=resultado.nos_visitados)

    duracoes = {r.id_reuniao: timedelta(minutes=r.duracao_min) for r in pedido.reunioes}
    ordenadas = sorted(resultado.solucoes, key=lambda s: sum(custo(v, x) for v, x in s.items()))
    alternativas = [
        Alternativa(horarios=[HorarioProposto(id_reuniao=r.id_reuniao, inicio=s[r.id_reuniao],
                                              fim=s[r.id_reuniao] + duracoes[r.id_reuniao])
                              for r in pedido.reunioes])
        for s in ordenadas
    ]
    return RespostaHorarios(encontrou_solucao=True, alternativas=alternativas, diagnostico=diagnostico,
                            incompleto=resultado.incompleto, nos_visitados=resultado.nos_visitados)