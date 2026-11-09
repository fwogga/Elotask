from fastapi import FastAPI, HTTPException
from typing import Any, Dict

from csp import resolver_escala


# Criar a aplicação FastAPI
app = FastAPI(
    title="EloTask - Serviço de Inteligência Artificial",
    description="API responsável pela geração automática de escalas.",
    version="1.0.0"
)


# Normalizar as datas recebidas
def normalizar_data(data):
    """
    Converte uma data para o formato YYYY-MM-DD.

    Exemplo:
    2026-11-09T00:00:00.000Z
    passa a
    2026-11-09
    """
    return str(data)[:10]


# Endpoint para gerar uma escala
@app.post("/gerar-escala")
def gerar_escala(dados: Dict[str, Any]):

    # 1. Receber os dados enviados pelo Node.js
    colaboradores = dados.get("colaboradores", [])
    turnos = dados.get("turnos", [])
    ausencias = dados.get("ausencias", [])
    turnos_atribuidos = dados.get("turnos_atribuidos", [])

    # 2. Validar os dados recebidos
    if not colaboradores:
        raise HTTPException(
            status_code=400,
            detail="Não foram enviados colaboradores."
        )

    if not turnos:
        raise HTTPException(
            status_code=400,
            detail="Não foram enviados turnos."
        )

    # 3. Normalizar as datas dos turnos
    for turno in turnos:
        turno["data_turno"] = normalizar_data(
            turno["data_turno"]
        )

    # 4. Normalizar as datas das ausências
    for ausencia in ausencias:
        ausencia["data_inicio"] = normalizar_data(
            ausencia["data_inicio"]
        )

        ausencia["data_fim"] = normalizar_data(
            ausencia["data_fim"]
        )

    # 5. Executar o nosso algoritmo CSP
    solucao, turnos_por_variavel = resolver_escala(
        colaboradores,
        turnos,
        ausencias,
        turnos_atribuidos
    )

    # 6. Verificar se foi encontrada uma solução
    if solucao is None:
        return {
            "sucesso": False,
            "mensagem": (
                "Não foi possível gerar a escala. "
                "Verifica a disponibilidade dos colaboradores "
                "e as restrições dos turnos."
            ),
            "atribuicoes": []
        }

    # 7. Organizar as atribuições para devolver ao Node.js
    atribuicoes = []

    for variavel, id_colaborador in solucao.items():

        turno = turnos_por_variavel[variavel]

        atribuicoes.append({
            "id_turno": turno["id_turno"],
            "id_utilizador": id_colaborador,
            "vaga": variavel
        })

    # 8. Devolver o resultado
    return {
        "sucesso": True,
        "mensagem": "Escala gerada com sucesso.",
        "total_atribuicoes": len(atribuicoes),
        "atribuicoes": atribuicoes
    }


# Endpoint simples para verificar se a API está disponível
@app.get("/")
def inicio():
    return {
        "mensagem": "Serviço de IA do EloTask ativo."
    }
