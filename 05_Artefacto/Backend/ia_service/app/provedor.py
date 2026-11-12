"""O "cérebro" da IA, isolado numa camada que se pode trocar.

O resto do serviço só fala com a interface `Provedor`. Hoje existe o provedor SIMULADO
(regras simples, sem modelo de linguagem), que serve para testar toda a ligação
Node <-> Python <-> base de dados. Mais tarde, um provedor real (API do Claude, modelo local)
implementa os mesmos três métodos, sem alterar mais nada.

Escolha através da variável IA_PROVEDOR no .env (por omissão: simulado).
"""
import os
import re
from abc import ABC, abstractmethod
from datetime import date
from functools import lru_cache

from .schemas import (
    DecisaoProposta,
    PedidoChat,
    PedidoResumo,
    PedidoSugestoes,
    RespostaChat,
    RespostaResumo,
    RespostaSugestoes,
    SugestaoGeral,
    SugestaoOrganizacao,
)


class Provedor(ABC):
    nome: str

    @abstractmethod
    def chat(self, pedido: PedidoChat) -> RespostaChat: ...

    @abstractmethod
    def resumir(self, pedido: PedidoResumo) -> RespostaResumo: ...

    @abstractmethod
    def sugerir(self, pedido: PedidoSugestoes) -> RespostaSugestoes: ...


ESCALA = ["baixa", "media", "alta", "urgente"]
ABERTAS = ("pendente", "em_curso")
PALAVRAS_DECISAO = re.compile(
    r"\b(decidiu|decidimos|decidiram|ficou decidido|decis[aã]o|acordou|acord[aá]mos|acordaram|aprovou|aprov[aá]mos|aprovado)\b",
    re.IGNORECASE,
)


def _frases(texto: str) -> list[str]:
    partes = re.split(r"(?<=[.!?])\s+|\n+", texto)
    return [p.strip() for p in partes if len(p.strip()) >= 15]


def _abertas(tarefas):
    return [t for t in tarefas if t.estado in ABERTAS]


class ProvedorSimulado(Provedor):
    """Regras simples sobre os dados recebidos. Não usa nenhum modelo de linguagem."""

    nome = "simulado-v1"

    def _hoje(self) -> date:
        return date.today()

    # -- esclarecer dúvidas ------------------------------------------------
    def chat(self, pedido: PedidoChat) -> RespostaChat:
        ctx = pedido.contexto
        pergunta = pedido.pergunta.lower()
        hoje = self._hoje()
        abertas = _abertas(ctx.tarefas)

        if re.search(r"prazo|atras|urgen", pergunta) and abertas:
            com_prazo = sorted((t for t in abertas if t.prazo), key=lambda t: t.prazo)[:5]
            if com_prazo:
                linhas = []
                for t in com_prazo:
                    dias = (t.prazo - hoje).days
                    estado = f"atrasada há {-dias} dia(s)" if dias < 0 else f"termina em {dias} dia(s)"
                    linhas.append(f"- {t.titulo} ({estado})")
                texto = "Tarefas com os prazos mais próximos:\n" + "\n".join(linhas)
            else:
                texto = "Nenhuma das tarefas abertas tem prazo definido."
        elif re.search(r"reuni|decis", pergunta) and ctx.reunioes:
            linhas = [f"- {r.titulo}: " + ("; ".join(r.decisoes) if r.decisoes else "sem decisões registadas")
                      for r in ctx.reunioes[:5]]
            texto = "Decisões das reuniões mais recentes:\n" + "\n".join(linhas)
        elif abertas:
            ordenadas = sorted(abertas, key=lambda t: ESCALA.index(t.prioridade), reverse=True)[:5]
            linhas = [f"- {t.titulo} (prioridade {t.prioridade})" for t in ordenadas]
            projeto = f" do projeto {ctx.projeto.nome}" if ctx.projeto else ""
            texto = f"Tem {len(abertas)} tarefa(s) aberta(s){projeto}. As mais prioritárias:\n" + "\n".join(linhas)
        else:
            texto = "Não tenho dados suficientes para responder. Indique um projeto ou uma reunião."

        return RespostaChat(resposta=texto + "\n\n(Resposta simulada: confirme sempre os dados no sistema.)",
                            modelo=self.nome)

    # -- resumir reuniões e destacar decisões ---------------------------------
    def resumir(self, pedido: PedidoResumo) -> RespostaResumo:
        frases = _frases(pedido.texto)
        resumo = " ".join(frases[:3]) if frases else pedido.texto.strip()[:300]

        decisoes = []
        for frase in frases:
            if len(decisoes) >= 10:
                break
            if PALAVRAS_DECISAO.search(frase):
                decisoes.append(DecisaoProposta(descricao=frase,
                                                responsavel_sugerido=self._responsavel(frase, pedido.reuniao.participantes)))

        return RespostaResumo(
            resumo=f"Resumo (simulado) de «{pedido.reuniao.titulo}»: {resumo}",
            decisoes=decisoes,
            modelo=self.nome,
        )

    @staticmethod
    def _responsavel(frase: str, participantes: list[str]) -> str | None:
        for nome in participantes:
            primeiro = nome.split()[0] if nome.split() else ""
            if primeiro and re.search(rf"\b{re.escape(primeiro)}\b", frase, re.IGNORECASE):
                return nome
        return None

    # -- sugerir melhorias, organização e prioridades -------------------------
    def sugerir(self, pedido: PedidoSugestoes) -> RespostaSugestoes:
        hoje = self._hoje()
        abertas = _abertas(pedido.tarefas)
        sugestoes: list[SugestaoGeral] = []
        organizacao: list[SugestaoOrganizacao] = []
        atrasadas = []

        for t in abertas:
            if t.prazo is None:
                continue
            dias = (t.prazo - hoje).days
            if dias < 0:
                atrasadas.append(t)
                if t.prioridade != "urgente":
                    organizacao.append(SugestaoOrganizacao(
                        id_tarefa=t.id_tarefa, prioridade_sugerida="urgente",
                        justificacao=f"A tarefa está atrasada há {-dias} dia(s)."))
            elif dias <= 3 and t.prioridade in ("baixa", "media"):
                nova = "urgente" if dias <= 1 else "alta"
                organizacao.append(SugestaoOrganizacao(
                    id_tarefa=t.id_tarefa, prioridade_sugerida=nova,
                    justificacao=f"O prazo termina em {dias} dia(s) e a prioridade atual é {t.prioridade}."))

        for t in abertas:
            if t.prazo is None and t.prioridade in ("alta", "urgente"):
                organizacao.append(SugestaoOrganizacao(
                    id_tarefa=t.id_tarefa,
                    justificacao="Tarefa de prioridade elevada sem prazo definido: convém definir um prazo."))

        if atrasadas:
            titulos = ", ".join(t.titulo for t in atrasadas[:3])
            sugestoes.append(SugestaoGeral(
                tipo="prioridade", descricao=f"Resolver primeiro as tarefas atrasadas: {titulos}.",
                justificacao=f"Há {len(atrasadas)} tarefa(s) com o prazo ultrapassado."))

        sem_responsavel = [t for t in abertas if not t.responsaveis]
        if sem_responsavel:
            titulos = ", ".join(t.titulo for t in sem_responsavel[:3])
            sugestoes.append(SugestaoGeral(
                tipo="organizacao", descricao=f"Atribuir responsáveis a: {titulos}.",
                justificacao="Tarefas sem responsável tendem a ficar paradas."))

        em_curso = [t for t in abertas if t.estado == "em_curso"]
        if len(em_curso) > 5:
            sugestoes.append(SugestaoGeral(
                tipo="melhoria", descricao="Limitar o número de tarefas em curso em simultâneo.",
                justificacao=f"Há {len(em_curso)} tarefas em curso ao mesmo tempo."))

        return RespostaSugestoes(sugestoes=sugestoes, organizacao=organizacao, modelo=self.nome)


@lru_cache(maxsize=1)
def obter_provedor() -> Provedor:
    escolhido = os.getenv("IA_PROVEDOR", "simulado").strip().lower()
    if escolhido == "simulado":
        return ProvedorSimulado()
    raise RuntimeError(f'IA_PROVEDOR desconhecido: "{escolhido}". Valores disponíveis: simulado.')