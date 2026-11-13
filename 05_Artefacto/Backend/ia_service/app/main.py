import os
import secrets
from typing import Any, Dict

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException

from .csp_reunioes import PedidoHorarios, RespostaHorarios, sugerir_horarios
from .csp_turnos import resolver_escala
from .provedor import Provedor, obter_provedor
from .schemas import (
    PedidoChat,
    PedidoResumo,
    PedidoSugestoes,
    RespostaChat,
    RespostaResumo,
    RespostaSugestoes,
)

load_dotenv()

API_KEY = os.getenv("IA_API_KEY", "")

app = FastAPI(title="EloTask IA", version="0.3.0")


def exigir_chave(x_api_key: str = Header(default="")):
    """Todos os pedidos do backend Node trazem o cabeçalho X-API-Key."""
    if not API_KEY:
        # Falha fechada: sem chave configurada, nada é aceite
        raise HTTPException(status_code=503, detail="Serviço de IA sem chave configurada.")
    if not secrets.compare_digest(x_api_key, API_KEY):
        raise HTTPException(status_code=401, detail="Chave inválida.")


def executar(operacao, pedido):
    """Chama o provedor; se falhar, devolve 502 sem expor detalhes internos ao cliente."""
    try:
        return operacao(pedido)
    except Exception as erro:  # noqa: BLE001 - qualquer falha do provedor vira 502
        print(f"[erro] provedor de IA falhou: {erro!r}")
        raise HTTPException(status_code=502, detail="O provedor de IA falhou.") from erro


@app.get("/health")
def health():
    """Sem chave: serve para verificar se o serviço está de pé."""
    return {"estado": "ok"}


@app.get("/verificar", dependencies=[Depends(exigir_chave)])
def verificar():
    """Com chave: serve para testar a ligação entre o Node e o Python."""
    return {"estado": "autenticado"}


@app.post("/chat", response_model=RespostaChat, dependencies=[Depends(exigir_chave)])
def chat(pedido: PedidoChat, provedor: Provedor = Depends(obter_provedor)):
    """Esclarecer dúvidas sobre o projeto e as reuniões."""
    return executar(provedor.chat, pedido)


@app.post("/resumir-reuniao", response_model=RespostaResumo, dependencies=[Depends(exigir_chave)])
def resumir_reuniao(pedido: PedidoResumo, provedor: Provedor = Depends(obter_provedor)):
    """Resumir uma reunião e propor as decisões tomadas."""
    return executar(provedor.resumir, pedido)


@app.post("/sugestoes", response_model=RespostaSugestoes, dependencies=[Depends(exigir_chave)])
def sugestoes(pedido: PedidoSugestoes, provedor: Provedor = Depends(obter_provedor)):
    """Sugerir melhorias e a organização/prioridade das tarefas."""
    return executar(provedor.sugerir, pedido)


@app.post("/sugerir-horarios", response_model=RespostaHorarios, dependencies=[Depends(exigir_chave)])
def sugerir_horarios_endpoint(pedido: PedidoHorarios):
    """Sugerir horários de reunião em que todos os participantes estão livres (CSP)."""
    return sugerir_horarios(pedido)


@app.post("/gerar-escala", dependencies=[Depends(exigir_chave)])
def gerar_escala(dados: Dict[str, Any]):
    """Distribuir os colaboradores pelos turnos ainda vazios (CSP com backtracking)."""
    colaboradores = dados.get("colaboradores", [])
    turnos = dados.get("turnos", [])
    ausencias = dados.get("ausencias", [])
    turnos_atribuidos = dados.get("turnos_atribuidos", [])

    if not colaboradores:
        raise HTTPException(status_code=400, detail="Não foram enviados colaboradores.")
    if not turnos:
        raise HTTPException(status_code=400, detail="Não foram enviados turnos.")

    # As datas podem chegar como "2026-11-09T00:00:00.000Z"; o CSP só quer "2026-11-09"
    for turno in turnos:
        turno["data_turno"] = str(turno["data_turno"])[:10]
    for ausencia in ausencias:
        ausencia["data_inicio"] = str(ausencia["data_inicio"])[:10]
        ausencia["data_fim"] = str(ausencia["data_fim"])[:10]

    solucao, turnos_por_variavel = resolver_escala(colaboradores, turnos, ausencias, turnos_atribuidos)

    if solucao is None:
        return {
            "sucesso": False,
            "mensagem": "Não foi possível gerar a escala. Verifica a disponibilidade dos colaboradores e as restrições dos turnos.",
            "atribuicoes": [],
        }

    atribuicoes = [
        {"id_turno": turnos_por_variavel[variavel]["id_turno"], "id_utilizador": id_colaborador, "vaga": variavel}
        for variavel, id_colaborador in solucao.items()
    ]
    return {
        "sucesso": True,
        "mensagem": "Escala gerada com sucesso.",
        "total_atribuicoes": len(atribuicoes),
        "atribuicoes": atribuicoes,
    }
