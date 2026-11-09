variaveis = ["Turno A", "Turno B"]

dominios = {
    "Turno A": ["Ana", "Joao"],
    "Turno B": ["Ana", "Maria"]
}

atribuicao = {}

atribuicao["Turno A"] = "Ana"

def verificar_restricao(turno, colaborador, atribuicao):

    for outro_turno in atribuicao:

        if atribuicao[outro_turno] == colaborador:
            return False

    return True

def backtracking(atribuicao):

    # Verificar se todos os turnos foram preenchidos
    if len(atribuicao) == len(variaveis):
        return atribuicao

    # Escolher o primeiro turno ainda não preenchido
    turno = None

    for t in variaveis:

        if t not in atribuicao:
            turno = t
            break

    # Experimentar os colaboradores disponíveis
    for colaborador in dominios[turno]:

        if verificar_restricao(turno, colaborador, atribuicao):

            # Fazer a atribuição
            atribuicao[turno] = colaborador

            # Continuar a pesquisa
            resultado = backtracking(atribuicao)

            if resultado is not None:
                return resultado

            # Se não existir solução, voltar atrás
            del atribuicao[turno]

    return None

solucao = backtracking(atribuicao)

if solucao is not None:

    print("Escala encontrada:")

    for turno in solucao:
        print(turno, ":", solucao[turno])

else:
    print("Não existe solução.")