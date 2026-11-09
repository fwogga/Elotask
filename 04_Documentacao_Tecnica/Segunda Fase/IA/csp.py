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

def backtracking(atribuicao, dominios_atuais):

    # Verificar se todos os turnos foram preenchidos
    if len(atribuicao) == len(variaveis):
        return atribuicao

    # Escolher o primeiro turno ainda não preenchido
    turno = escolher_variavel(atribuicao, dominios_atuais)

    # Experimentar os colaboradores disponíveis
    for colaborador in dominios_atuais[turno]:

        if verificar_restricao(turno, colaborador, atribuicao):

            # Fazer a atribuição
            atribuicao[turno] = colaborador

            # Continuar a pesquisa

            novos_dominios = forward_checking(
                turno,
                colaborador,
                atribuicao
                )
            
            if novos_dominios is not None:

                resultado = backtracking(
                atribuicao,
                novos_dominios
                )

            if resultado is not None:
                return resultado

            # Se não existir solução, voltar atrás
            del atribuicao[turno]

    return None

def forward_checking(turno, colaborador, atribuicao):

    # Criar uma cópia dos domínios
    novos_dominios = {}

    for outro_turno in dominios:

        novos_dominios[outro_turno] = dominios[outro_turno].copy()

    # Percorrer os restantes turnos
    for outro_turno in dominios:

        # Ignorar o turno que acabámos de preencher
        if outro_turno == turno:
            continue

        # Ignorar turnos que já foram preenchidos
        if outro_turno in atribuicao:
            continue

        # Remover o colaborador dos domínios
        if colaborador in novos_dominios[outro_turno]:

            novos_dominios[outro_turno].remove(colaborador)

        # Verificar se o domínio ficou vazio
        if len(novos_dominios[outro_turno]) == 0:

            return None

    return novos_dominios

def escolher_variavel(atribuicao, dominios_atuais):

    turno_escolhido = None
    menor_quantidade = None

    for turno in variaveis:

        if turno not in atribuicao:

            quantidade = len(dominios_atuais[turno])

            if menor_quantidade is None or quantidade < menor_quantidade:
                menor_quantidade = quantidade
                turno_escolhido = turno

    return turno_escolhido

solucao = backtracking(atribuicao, dominios)

if solucao is not None:

    print("Escala encontrada:")

    for turno in solucao:
        print(turno, ":", solucao[turno])

else:
    print("Não existe solução.")