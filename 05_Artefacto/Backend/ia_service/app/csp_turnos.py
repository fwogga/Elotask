from datetime import datetime


# 1. Obter o intervalo de horas de um turno
def obter_intervalo_turno(turno):

    data = turno["data_turno"]
    hora_inicio = str(turno["hora_inicio"])[:5]
    hora_fim = str(turno["hora_fim"])[:5]

    inicio = datetime.strptime(
        data + " " + hora_inicio,
        "%Y-%m-%d %H:%M"
    )

    fim = datetime.strptime(
        data + " " + hora_fim,
        "%Y-%m-%d %H:%M"
    )

    # Se terminar no dia seguinte
    if fim <= inicio:
        from datetime import timedelta
        fim = fim + timedelta(days=1)

    return inicio, fim


# 2. Verificar se dois turnos se sobrepõem
def turnos_sobrepostos(turno1, turno2):

    inicio1, fim1 = obter_intervalo_turno(turno1)
    inicio2, fim2 = obter_intervalo_turno(turno2)

    if inicio1 < fim2 and inicio2 < fim1:
        return True

    return False


# 3. Criar uma variável para cada vaga dos turnos
def construir_variaveis(turnos):

    variaveis = []
    turnos_por_variavel = {}

    for turno in turnos:

        id_turno = turno["id_turno"]
        numero = int(turno.get("numero_colaboradores", 1))

        for vaga in range(1, numero + 1):

            variavel = "Turno_" + str(id_turno) + "_Vaga_" + str(vaga)

            variaveis.append(variavel)
            turnos_por_variavel[variavel] = turno

    return variaveis, turnos_por_variavel


# 4. Verificar se o colaborador está disponível
def verificar_disponibilidade(colaborador, turno):

    dias_semana = [
        "segunda", "terca", "quarta",
        "quinta", "sexta", "sabado", "domingo"
    ]

    data = datetime.strptime(
        turno["data_turno"],
        "%Y-%m-%d"
    )

    dia_turno = dias_semana[data.weekday()]

    hora_inicio = str(turno["hora_inicio"])[:5]
    hora_fim = str(turno["hora_fim"])[:5]

    for disponibilidade in colaborador["disponibilidade"]:

        if disponibilidade["dia_semana"] == dia_turno:

            inicio_disponibilidade = disponibilidade["hora_inicio"][:5]
            fim_disponibilidade = disponibilidade["hora_fim"][:5]

            if (
                hora_inicio >= inicio_disponibilidade
                and hora_fim <= fim_disponibilidade
            ):
                return True

    return False


# 5. Verificar se existe uma ausência aprovada
def verificar_ausencia(colaborador, turno, ausencias):

    id_colaborador = colaborador.get(
        "id_utilizador",
        colaborador.get("id")
    )

    for ausencia in ausencias:

        if ausencia["id_utilizador"] == id_colaborador:

            if ausencia["estado"] == "aprovado":

                if (
                    ausencia["data_inicio"] <= turno["data_turno"]
                    and ausencia["data_fim"] >= turno["data_turno"]
                ):
                    return True

    return False


# Verificar se o colaborador já tem outro turno atribuído
def verificar_turnos_atribuidos(colaborador, turno, turnos_atribuidos):

    id_colaborador = colaborador.get(
        "id_utilizador",
        colaborador.get("id")
    )

    for atribuicao in turnos_atribuidos:

        if atribuicao["id_utilizador"] == id_colaborador:

            turno_existente = atribuicao["turno"]

            if turnos_sobrepostos(turno, turno_existente):
                return True

    return False


# 6. Construir os domínios de cada vaga

def construir_dominios(colaboradores, variaveis,
                       turnos_por_variavel, ausencias,
                       turnos_atribuidos=None):

    if turnos_atribuidos is None:
        turnos_atribuidos = []

    dominios = {}

    for variavel in variaveis:

        turno = turnos_por_variavel[variavel]

        dominios[variavel] = []

        for colaborador in colaboradores:

            disponivel = verificar_disponibilidade(
                colaborador,
                turno
            )

            tem_ausencia = verificar_ausencia(
                colaborador,
                turno,
                ausencias
            )

            tem_conflito = verificar_turnos_atribuidos(
                colaborador,
                turno,
                turnos_atribuidos
            )

            if disponivel and not tem_ausencia and not tem_conflito:

                id_colaborador = colaborador.get(
                    "id_utilizador",
                    colaborador.get("id")
                )

                dominios[variavel].append(id_colaborador)

    return dominios



# 8. Aplicar Forward Checking
def forward_checking(variavel, colaborador,
                     atribuicao, dominios_atuais,
                     turnos_por_variavel):

    novos_dominios = {}

    for outra_variavel in dominios_atuais:

        novos_dominios[outra_variavel] = (
            dominios_atuais[outra_variavel].copy()
        )

    turno_atual = turnos_por_variavel[variavel]

    for outra_variavel in novos_dominios:

        if outra_variavel == variavel:
            continue

        if outra_variavel in atribuicao:
            continue

        outro_turno = turnos_por_variavel[outra_variavel]

        if turnos_sobrepostos(turno_atual, outro_turno):

            if colaborador in novos_dominios[outra_variavel]:

                novos_dominios[outra_variavel].remove(colaborador)

            if len(novos_dominios[outra_variavel]) == 0:
                return None

    return novos_dominios


# 9. Escolher a variável com menos possibilidades (MRV)
def escolher_variavel(variaveis, atribuicao, dominios_atuais):

    variavel_escolhida = None
    menor_quantidade = None

    for variavel in variaveis:

        if variavel not in atribuicao:

            quantidade = len(dominios_atuais[variavel])

            if (
                menor_quantidade is None
                or quantidade < menor_quantidade
            ):

                menor_quantidade = quantidade
                variavel_escolhida = variavel

    return variavel_escolhida


# 10. Ordenar colaboradores pelo menor impacto (LCV)
def ordenar_valores_lcv(variavel, atribuicao,
                        dominios_atuais, turnos_por_variavel):

    impactos = {}

    turno_atual = turnos_por_variavel[variavel]

    for colaborador in dominios_atuais[variavel]:

        quantidade = 0

        for outra_variavel in dominios_atuais:

            if outra_variavel == variavel:
                continue

            if outra_variavel in atribuicao:
                continue

            outro_turno = turnos_por_variavel[outra_variavel]

            if turnos_sobrepostos(turno_atual, outro_turno):

                if colaborador in dominios_atuais[outra_variavel]:
                    quantidade += 1

        impactos[colaborador] = quantidade

    colaboradores_ordenados = []

    while len(impactos) > 0:

        melhor_colaborador = None
        menor_impacto = None

        for colaborador in impactos:

            if (
                menor_impacto is None
                or impactos[colaborador] < menor_impacto
            ):

                menor_impacto = impactos[colaborador]
                melhor_colaborador = colaborador

        colaboradores_ordenados.append(melhor_colaborador)

        del impactos[melhor_colaborador]

    return colaboradores_ordenados


# 11. Algoritmo Backtracking
def backtracking(variaveis, atribuicao, dominios_atuais,
                 turnos_por_variavel):

    if len(atribuicao) == len(variaveis):
        return atribuicao.copy()

    variavel = escolher_variavel(
        variaveis,
        atribuicao,
        dominios_atuais
    )

    colaboradores_ordenados = ordenar_valores_lcv(
        variavel,
        atribuicao,
        dominios_atuais,
        turnos_por_variavel
    )

    for colaborador in colaboradores_ordenados:

        if verificar_restricao(
            variavel,
            colaborador,
            atribuicao,
            turnos_por_variavel
        ):

            atribuicao[variavel] = colaborador

            novos_dominios = forward_checking(
                variavel,
                colaborador,
                atribuicao,
                dominios_atuais,
                turnos_por_variavel
            )

            if novos_dominios is not None:

                resultado = backtracking(
                    variaveis,
                    atribuicao,
                    novos_dominios,
                    turnos_por_variavel
                )

                if resultado is not None:
                    return resultado

            del atribuicao[variavel]

    return None


# 12. Verificar se a atribuição respeita as restrições
def verificar_restricao(variavel, colaborador,
                        atribuicao, turnos_por_variavel):

    turno_atual = turnos_por_variavel[variavel]

    for outra_variavel, outro_colaborador in atribuicao.items():

        # O mesmo colaborador não pode ter turnos sobrepostos
        if outro_colaborador == colaborador:

            outro_turno = turnos_por_variavel[outra_variavel]

            if turnos_sobrepostos(turno_atual, outro_turno):
                return False

    return True



# 13. Função principal para gerar a escala

def resolver_escala(colaboradores, turnos, ausencias,
                    turnos_atribuidos=None):

    variaveis, turnos_por_variavel = construir_variaveis(turnos)

    dominios = construir_dominios(
        colaboradores,
        variaveis,
        turnos_por_variavel,
        ausencias,
        turnos_atribuidos
    )

    # Verificar se alguma vaga não tem colaboradores disponíveis
    for variavel in dominios:

        if len(dominios[variavel]) == 0:
            return None, turnos_por_variavel

    solucao = backtracking(
        variaveis,
        {},
        dominios,
        turnos_por_variavel
    )

    return solucao, turnos_por_variavel