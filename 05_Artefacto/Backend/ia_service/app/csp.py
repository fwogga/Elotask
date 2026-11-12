"""Motor genérico de Problemas de Satisfação de Restrições (CSP).

Um CSP é formado por:
  - variáveis;
  - um domínio (lista de valores possíveis) para cada variável;
  - restrições entre variáveis.

Este motor não sabe nada de reuniões ou turnos: recebe variáveis, domínios e restrições
e procura atribuições que as satisfaçam todas. É reutilizável por qualquer módulo.

Técnicas usadas:
  1. Consistência de nó: as restrições unárias reduzem os domínios antes de começar.
  2. AC-3 (consistência de arco): remove valores sem suporte nos vizinhos.
  3. Backtracking com:
       - MRV (Minimum Remaining Values): escolhe a variável com menos valores possíveis;
       - grau como desempate: a que mais restringe as restantes;
       - Forward Checking: ao atribuir, filtra já os domínios dos vizinhos e recua se algum ficar vazio;
       - ordenação opcional dos valores por custo (preferências, ex.: horários mais cedo primeiro).
  4. Limite de nós visitados, para um pedido difícil não bloquear o servidor.
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from typing import Any, Callable, Hashable

Variavel = Hashable
Valor = Any


@dataclass
class Resultado:
    solucoes: list[dict] = field(default_factory=list)
    nos_visitados: int = 0
    motivo: str | None = None  # preenchido quando não há solução
    incompleto: bool = False   # True se a pesquisa parou por exceder o limite de nós

    @property
    def solucao(self) -> dict | None:
        return self.solucoes[0] if self.solucoes else None


class CSP:
    def __init__(self, dominios: dict[Variavel, list[Valor]]):
        self.dominios: dict[Variavel, list[Valor]] = {v: list(d) for v, d in dominios.items()}
        self._unarias: dict[Variavel, list[Callable[[Valor], bool]]] = {v: [] for v in self.dominios}
        self._binarias: dict[tuple[Variavel, Variavel], list[Callable[[Valor, Valor], bool]]] = {}
        self._vizinhos: dict[Variavel, set[Variavel]] = {v: set() for v in self.dominios}

    # -- definição do problema -------------------------------------------------
    def adicionar_restricao_unaria(self, variavel: Variavel, condicao: Callable[[Valor], bool]) -> None:
        """A condição recebe o valor da variável e devolve True se for admissível."""
        self._exigir(variavel)
        self._unarias[variavel].append(condicao)

    def adicionar_restricao_binaria(self, a: Variavel, b: Variavel,
                                    condicao: Callable[[Valor, Valor], bool]) -> None:
        """A condição recebe (valor_de_a, valor_de_b) e devolve True se forem compatíveis."""
        self._exigir(a)
        self._exigir(b)
        if a == b:
            raise ValueError("Uma restrição binária precisa de duas variáveis diferentes.")
        self._binarias.setdefault((a, b), []).append(condicao)
        self._binarias.setdefault((b, a), []).append(lambda vb, va, c=condicao: c(va, vb))
        self._vizinhos[a].add(b)
        self._vizinhos[b].add(a)

    def _exigir(self, variavel: Variavel) -> None:
        if variavel not in self.dominios:
            raise KeyError(f"Variável desconhecida: {variavel!r}")

    # -- verificação -----------------------------------------------------------
    def _compativel(self, a: Variavel, va: Valor, b: Variavel, vb: Valor) -> bool:
        return all(c(va, vb) for c in self._binarias.get((a, b), ()))

    def verificar(self, atribuicao: dict) -> bool:
        """True se a atribuição completa respeita todas as restrições (útil para validar uma proposta)."""
        if set(atribuicao) != set(self.dominios):
            return False
        for v, valor in atribuicao.items():
            if valor not in self.dominios[v] or not all(c(valor) for c in self._unarias[v]):
                return False
        return all(self._compativel(a, atribuicao[a], b, atribuicao[b])
                   for (a, b) in self._binarias if a in atribuicao and b in atribuicao)

    # -- pré-processamento -----------------------------------------------------
    def _consistencia_de_no(self, dominios: dict) -> str | None:
        for v in dominios:
            dominios[v] = [x for x in dominios[v] if all(c(x) for c in self._unarias[v])]
            if not dominios[v]:
                return f"A variável {v!r} ficou sem valores possíveis (restrições unárias)."
        return None

    def _ac3(self, dominios: dict) -> str | None:
        fila = deque(self._binarias.keys())
        while fila:
            a, b = fila.popleft()
            if self._rever(a, b, dominios):
                if not dominios[a]:
                    return f"A variável {a!r} ficou sem valores possíveis (consistência de arco com {b!r})."
                for c in self._vizinhos[a]:
                    if c != b:
                        fila.append((c, a))
        return None

    def _rever(self, a: Variavel, b: Variavel, dominios: dict) -> bool:
        """Remove de D[a] os valores sem nenhum valor compatível em D[b]."""
        mantidos = [va for va in dominios[a] if any(self._compativel(a, va, b, vb) for vb in dominios[b])]
        removeu = len(mantidos) != len(dominios[a])
        dominios[a] = mantidos
        return removeu

    # -- pesquisa --------------------------------------------------------------
    def resolver(self, limite: int = 1, custo: Callable[[Variavel, Valor], float] | None = None,
                 max_nos: int | None = 200_000) -> Resultado:
        """Procura até `limite` soluções.

        custo(variavel, valor): quanto menor, mais preferido (os valores são tentados por esta ordem).
        max_nos: máximo de atribuições tentadas; ao excedê-lo a pesquisa pára e `incompleto` fica True.
        """
        resultado = Resultado()
        dominios = {v: list(d) for v, d in self.dominios.items()}

        motivo = self._consistencia_de_no(dominios) or self._ac3(dominios)
        if motivo:
            resultado.motivo = motivo
            return resultado

        self._limite, self._custo, self._max_nos, self._resultado = limite, custo, max_nos, resultado
        self._pesquisar({}, dominios)

        if not resultado.solucoes and not resultado.incompleto:
            resultado.motivo = "Não existe nenhuma atribuição que respeite todas as restrições em simultâneo."
        elif not resultado.solucoes and resultado.incompleto:
            resultado.motivo = "A pesquisa foi interrompida por exceder o limite de tentativas."
        return resultado

    def _escolher_variavel(self, atribuicao: dict, dominios: dict) -> Variavel:
        livres = [v for v in dominios if v not in atribuicao]
        # MRV; em caso de empate, a que tem mais vizinhos por atribuir (grau)
        return min(livres, key=lambda v: (len(dominios[v]),
                                          -sum(1 for n in self._vizinhos[v] if n not in atribuicao)))

    def _pesquisar(self, atribuicao: dict, dominios: dict) -> bool:
        """Devolve True quando é para parar toda a pesquisa (limite atingido)."""
        r = self._resultado
        if len(atribuicao) == len(self.dominios):
            r.solucoes.append(dict(atribuicao))
            return len(r.solucoes) >= self._limite

        variavel = self._escolher_variavel(atribuicao, dominios)
        valores = dominios[variavel]
        if self._custo:
            valores = sorted(valores, key=lambda x: self._custo(variavel, x))

        for valor in valores:
            if self._max_nos is not None and r.nos_visitados >= self._max_nos:
                r.incompleto = True
                return True
            r.nos_visitados += 1
            novos = self._forward_checking(variavel, valor, atribuicao, dominios)
            if novos is None:
                continue
            atribuicao[variavel] = valor
            parar = self._pesquisar(atribuicao, novos)
            del atribuicao[variavel]
            if parar:
                return True
        return False

    def _forward_checking(self, variavel: Variavel, valor: Valor, atribuicao: dict, dominios: dict):
        """Fixa variavel=valor e filtra os vizinhos por atribuir. Devolve None se algum ficar sem valores."""
        novos = dict(dominios)
        novos[variavel] = [valor]
        for n in self._vizinhos[variavel]:
            if n in atribuicao:
                continue
            filtrado = [vn for vn in dominios[n] if self._compativel(variavel, valor, n, vn)]
            if not filtrado:
                return None
            novos[n] = filtrado
        return novos