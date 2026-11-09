variaveis = ["A", "B", "C"]

dominios = {
    "A": ["Ana", "Joao", "Maria"],
    "B": ["Ana", "Joao"],
    "C": ["Joao", "Maria"]
}


# 1. Verificar se o colaborador pode ocupar o turno
def verificar_restricao(turno, colaborador, atribuicao):

    for outro_turno in atribuicao:

        if atribuicao[outro_turno] == colaborador:
            return False

    return True


# 2. Aplicar Forward Checking
def forward_checking(turno, colaborador, atribuicao, dominios_atuais):

    novos_dominios = {}

    for outro_turno in dominios_atuais:
        novos_dominios[outro_turno] = dominios_atuais[outro_turno].copy()

    for outro_turno in novos_dominios:

        if outro_turno == turno:
            continue

        if outro_turno in atribuicao:
            continue

        if colaborador in novos_dominios[outro_turno]:
            novos_dominios[outro_turno].remove(colaborador)

        if len(novos_dominios[outro_turno]) == 0:
            return None

    return novos_dominios


# 3. Escolher o turno com menos possibilidades (MRV)
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


def ordenar_valores_lcv(turno, atribuicao, dominios_atuais):

    impactos = {}

    # Contar o impacto de cada colaborador
    for colaborador in dominios_atuais[turno]:

        quantidade = 0

        for outro_turno in dominios_atuais:

            if outro_turno == turno:
                continue

            if outro_turno in atribuicao:
                continue

            if colaborador in dominios_atuais[outro_turno]:
                quantidade = quantidade + 1

        impactos[colaborador] = quantidade

    # Ordenar os colaboradores pelo menor impacto
    colaboradores_ordenados = []

    while len(impactos) > 0:

        melhor_colaborador = None
        menor_impacto = None

        for colaborador in impactos:

            if menor_impacto is None or impactos[colaborador] < menor_impacto:

                menor_impacto = impactos[colaborador]
                melhor_colaborador = colaborador

        colaboradores_ordenados.append(melhor_colaborador)

        del impactos[melhor_colaborador]

    return colaboradores_ordenados



# 4. Algoritmo Backtracking
def backtracking(atribuicao, dominios_atuais):

    if len(atribuicao) == len(variaveis):
        return atribuicao.copy()

    turno = escolher_variavel(atribuicao, dominios_atuais)

    colaboradores_ordenados = ordenar_valores_lcv(
    turno,
    atribuicao,
    dominios_atuais
    )

    for colaborador in colaboradores_ordenados:

        if verificar_restricao(turno, colaborador, atribuicao):

            atribuicao[turno] = colaborador

            novos_dominios = forward_checking(
                turno,
                colaborador,
                atribuicao,
                dominios_atuais
            )

            if novos_dominios is not None:

                resultado = backtracking(atribuicao, novos_dominios)

                if resultado is not None:
                    return resultado

            del atribuicao[turno]

    return None


# Executar o algoritmo
atribuicao = {}

solucao = backtracking(atribuicao, dominios)

if solucao is not None:

    print("Escala encontrada:")

    for turno in solucao:
        print(turno, ":", solucao[turno])

else:
    print("Não existe solução.")