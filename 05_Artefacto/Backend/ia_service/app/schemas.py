"""Contrato da API de IA: o que o backend Node envia e o que o Python devolve.

Os valores permitidos coincidem com os enums da base de dados (prioridades,
estados, tipos de sugestão), para o backend poder guardar o resultado sem conversões.
Só circulam nomes e textos necessários: nunca emails, telefones ou passwords.
"""
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Prioridade = Literal["baixa", "media", "alta", "urgente"]
EstadoTarefa = Literal["pendente", "em_curso", "concluida", "cancelada"]
TipoSugestao = Literal["melhoria", "ajuste", "organizacao", "prioridade"]


class Pedido(BaseModel):
    """Base dos pedidos: campos desconhecidos são recusados (evita contratos que divergem sem aviso)."""
    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# Contexto partilhado
# ---------------------------------------------------------------------------
class ProjetoContexto(Pedido):
    nome: str = Field(max_length=150)
    descricao: str | None = Field(default=None, max_length=2000)


class TarefaContexto(Pedido):
    id_tarefa: int
    titulo: str = Field(max_length=200)
    descricao: str | None = Field(default=None, max_length=2000)
    prioridade: Prioridade
    estado: EstadoTarefa
    prazo: date | None = None
    responsaveis: list[str] = Field(default_factory=list, max_length=20)  # só nomes


class ReuniaoContexto(Pedido):
    titulo: str = Field(max_length=150)
    resumo: str | None = Field(default=None, max_length=5000)
    decisoes: list[str] = Field(default_factory=list, max_length=30)


class ContextoChat(Pedido):
    projeto: ProjetoContexto | None = None
    tarefas: list[TarefaContexto] = Field(default_factory=list, max_length=100)
    reunioes: list[ReuniaoContexto] = Field(default_factory=list, max_length=10)


# ---------------------------------------------------------------------------
# POST /chat  (esclarecer dúvidas)
# ---------------------------------------------------------------------------
class MensagemHistorico(Pedido):
    tipo: Literal["pergunta", "resposta"]
    conteudo: str = Field(max_length=8000)


class PedidoChat(Pedido):
    pergunta: str = Field(min_length=1, max_length=4000)
    historico: list[MensagemHistorico] = Field(default_factory=list, max_length=20)
    contexto: ContextoChat = Field(default_factory=ContextoChat)


class RespostaChat(BaseModel):
    resposta: str
    modelo: str


# ---------------------------------------------------------------------------
# POST /resumir-reuniao  (resumo + decisões)
# ---------------------------------------------------------------------------
class ReuniaoDados(Pedido):
    titulo: str = Field(max_length=150)
    descricao: str | None = Field(default=None, max_length=2000)
    data_inicio: datetime | None = None
    participantes: list[str] = Field(default_factory=list, max_length=50)  # só nomes


class PedidoResumo(Pedido):
    reuniao: ReuniaoDados
    texto: str = Field(min_length=20, max_length=50000)  # notas ou transcrição


class DecisaoProposta(BaseModel):
    descricao: str
    responsavel_sugerido: str | None = None  # nome; o backend procura o utilizador entre os participantes


class RespostaResumo(BaseModel):
    resumo: str
    decisoes: list[DecisaoProposta]
    modelo: str


# ---------------------------------------------------------------------------
# POST /sugestoes  (ajustes/melhorias + organização e prioridade das tarefas)
# ---------------------------------------------------------------------------
class PedidoSugestoes(Pedido):
    projeto: ProjetoContexto
    tarefas: list[TarefaContexto] = Field(max_length=100)


class SugestaoGeral(BaseModel):
    tipo: TipoSugestao
    descricao: str
    justificacao: str | None = None


class SugestaoOrganizacao(BaseModel):
    id_tarefa: int
    prioridade_sugerida: Prioridade | None = None
    prazo_sugerido: date | None = None
    justificacao: str | None = None


class RespostaSugestoes(BaseModel):
    sugestoes: list[SugestaoGeral]
    organizacao: list[SugestaoOrganizacao]
    modelo: str