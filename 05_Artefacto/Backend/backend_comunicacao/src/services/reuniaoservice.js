const pool = require('../config/database');
const reuniaoModel = require('../models/reuniao');
const participanteModel = require('../models/participantereuniao');
const utilizadorModel = require('../models/utilizador');
const notificacaoService = require('./notificacaoservice');
const iaClient = require('./iaclient');
const { erro } = require('../utils/httpError');

const MAX_PARTICIPANTES = 200;

// Limites do pedido de horários (têm de coincidir com os do serviço Python, app/csp_reunioes.py)
const MAX_PARTICIPANTES_HORARIOS = 50;
const MAX_JANELA_DIAS = 31;
const MAX_OCUPACOES = 2000;

// agendada -> (em_curso | cancelada); em_curso -> (concluida | cancelada); concluida e cancelada são finais
const TRANSICOES = {
    agendada: ['em_curso', 'cancelada'],
    em_curso: ['concluida', 'cancelada'],
    concluida: [],
    cancelada: []
};

const quando = (dataHora) => String(dataHora).slice(0, 16);

// ---------------------------------------------------------------------------
// Notificações (melhor esforço: se falharem, a operação já foi concluída)
// ---------------------------------------------------------------------------
async function notificar(idsUtilizadores, idReuniao, titulo, mensagem) {
    for (const idUtilizador of idsUtilizadores) {
        try {
            await notificacaoService.criar({
                idUtilizador, tipo: 'reuniao', titulo, mensagem, entidadeTipo: 'reuniao', entidadeId: idReuniao
            });
        } catch (e) {
            console.error('[reunioes] falha ao notificar utilizador', idUtilizador, e.message);
        }
    }
}

// ---------------------------------------------------------------------------
// Acesso e regras
// ---------------------------------------------------------------------------

/** Só participantes veem a reunião. Para os outros devolve 404 (não revela que existe). */
async function exigirParticipante(idReuniao, idUtilizador) {
    const reuniao = await reuniaoModel.obterPorId(idReuniao);
    const participante = reuniao && (await participanteModel.obter(idReuniao, idUtilizador));
    if (!reuniao || !participante) throw erro.notFound('Reunião não encontrada.');
    return { reuniao, participante };
}

async function exigirOrganizador(idReuniao, idUtilizador) {
    const { reuniao } = await exigirParticipante(idReuniao, idUtilizador);
    if (reuniao.id_criador !== idUtilizador) throw erro.forbidden('Apenas o organizador pode fazer isto.');
    return reuniao;
}

function exigirAgendada(reuniao) {
    if (reuniao.estado !== 'agendada') {
        throw erro.conflict(`A reunião está "${reuniao.estado}" e já não pode ser alterada.`);
    }
}

/** Regras sobre os valores finais da reunião (usadas ao criar e ao alterar). */
function validarRegras({ dataInicio, dataFim, tipoReuniao, localizacao }) {
    if (dataFim <= dataInicio) throw erro.badRequest('data_fim tem de ser posterior a data_inicio.');
    if (tipoReuniao === 'presencial' && !localizacao) {
        throw erro.badRequest('Reuniões presenciais requerem localizacao.');
    }
}

async function validarUtilizadores(ids) {
    const ativos = new Set((await utilizadorModel.listarAtivosPorIds(ids)).map((u) => u.id_utilizador));
    const invalidos = ids.filter((id) => !ativos.has(id));
    if (invalidos.length) throw erro.badRequest('Utilizadores inexistentes ou inativos.', { ids_invalidos: invalidos });
}

async function obterDetalhe(idReuniao, idUtilizador) {
    const { reuniao, participante } = await exigirParticipante(idReuniao, idUtilizador);
    const participantes = await participanteModel.listar(idReuniao);
    return { ...reuniao, meu_convite: participante.estado_convite, participantes };
}

// ---------------------------------------------------------------------------
// Operações
// ---------------------------------------------------------------------------

async function listar(idUtilizador, filtros) {
    return reuniaoModel.listarDoUtilizador(idUtilizador, filtros);
}

async function criar(organizador, dados) {
    const convidados = dados.participantes.filter((id) => id !== organizador.id);
    if (convidados.length + 1 > MAX_PARTICIPANTES) throw erro.badRequest(`Máximo de ${MAX_PARTICIPANTES} participantes.`);
    validarRegras(dados);
    await validarUtilizadores(convidados);

    const idReuniao = await pool.withTransaction(async (conn) => {
        const id = await reuniaoModel.criar({ ...dados, idCriador: organizador.id }, conn);
        await participanteModel.adicionar(id, organizador.id, 'aceite', conn); // o organizador já está confirmado
        for (const idConvidado of convidados) await participanteModel.adicionar(id, idConvidado, 'pendente', conn);
        return id;
    });

    notificar(convidados, idReuniao, 'Convite para reunião',
        `${organizador.nome} convidou-o(a) para "${dados.titulo}" em ${quando(dados.dataInicio)}.`);

    return obterDetalhe(idReuniao, organizador.id);
}

async function atualizar(idReuniao, organizador, alteracoes) {
    const atual = await exigirOrganizador(idReuniao, organizador.id);
    exigirAgendada(atual);

    const final = {
        dataInicio: alteracoes.dataInicio ?? atual.data_inicio,
        dataFim: alteracoes.dataFim ?? atual.data_fim,
        tipoReuniao: alteracoes.tipoReuniao ?? atual.tipo_reuniao,
        localizacao: alteracoes.localizacao !== undefined ? alteracoes.localizacao : atual.localizacao
    };
    validarRegras(final);

    await reuniaoModel.atualizar(idReuniao, alteracoes);

    // Só avisa os participantes se mudou algo que lhes interessa (quando/onde/como)
    const mudouLogistica = ['dataInicio', 'dataFim', 'tipoReuniao', 'localizacao', 'linkReuniao', 'titulo']
        .some((c) => alteracoes[c] !== undefined);
    if (mudouLogistica) {
        const outros = (await participanteModel.listarIds(idReuniao)).filter((id) => id !== organizador.id);
        notificar(outros, idReuniao, 'Reunião atualizada',
            `${organizador.nome} alterou os detalhes da reunião "${alteracoes.titulo ?? atual.titulo}".`);
    }
    return obterDetalhe(idReuniao, organizador.id);
}

async function alterarEstado(idReuniao, organizador, novoEstado) {
    const atual = await exigirOrganizador(idReuniao, organizador.id);
    if (!TRANSICOES[atual.estado].includes(novoEstado)) {
        throw erro.conflict(`Não é possível passar de "${atual.estado}" para "${novoEstado}".`);
    }
    await reuniaoModel.atualizarEstado(idReuniao, novoEstado);

    if (novoEstado === 'cancelada') {
        const outros = (await participanteModel.listarIds(idReuniao)).filter((id) => id !== organizador.id);
        notificar(outros, idReuniao, 'Reunião cancelada',
            `${organizador.nome} cancelou a reunião "${atual.titulo}" (${quando(atual.data_inicio)}).`);
    }
    return obterDetalhe(idReuniao, organizador.id);
}

/** O participante aceita ou recusa o SEU convite (pode mudar de ideia enquanto a reunião estiver agendada). */
async function responderConvite(idReuniao, participante, estadoConvite) {
    const { reuniao } = await exigirParticipante(idReuniao, participante.id);
    if (reuniao.id_criador === participante.id) throw erro.badRequest('O organizador não responde ao próprio convite.');
    exigirAgendada(reuniao);

    await participanteModel.responder(idReuniao, participante.id, estadoConvite);

    notificar([reuniao.id_criador], idReuniao, 'Resposta a convite',
        `${participante.nome} ${estadoConvite === 'aceite' ? 'aceitou' : 'recusou'} o convite para "${reuniao.titulo}".`);
    return obterDetalhe(idReuniao, participante.id);
}

async function adicionarParticipantes(idReuniao, organizador, ids) {
    const reuniao = await exigirOrganizador(idReuniao, organizador.id);
    exigirAgendada(reuniao);
    await validarUtilizadores(ids);

    const adicionados = [];
    await pool.withTransaction(async (conn) => {
        if ((await participanteModel.contar(idReuniao, conn)) + ids.length > MAX_PARTICIPANTES) {
            throw erro.badRequest(`Máximo de ${MAX_PARTICIPANTES} participantes.`);
        }
        for (const id of ids) {
            if (await participanteModel.adicionar(idReuniao, id, 'pendente', conn)) adicionados.push(id);
        }
    });

    notificar(adicionados, idReuniao, 'Convite para reunião',
        `${organizador.nome} convidou-o(a) para "${reuniao.titulo}" em ${quando(reuniao.data_inicio)}.`);
    return { adicionados, reuniao: await obterDetalhe(idReuniao, organizador.id) };
}

async function removerParticipante(idReuniao, organizador, idAlvo) {
    const reuniao = await exigirOrganizador(idReuniao, organizador.id);
    exigirAgendada(reuniao);
    if (idAlvo === organizador.id) throw erro.badRequest('O organizador não pode ser removido da própria reunião.');
    if (!(await participanteModel.obter(idReuniao, idAlvo))) throw erro.notFound('O utilizador não é participante desta reunião.');

    await participanteModel.remover(idReuniao, idAlvo);
    notificar([idAlvo], idReuniao, 'Removido de reunião',
        `Foi removido(a) da reunião "${reuniao.titulo}" por ${organizador.nome}.`);
    return { removido: idAlvo };
}

/** 'AAAA-MM-DD HH:MM:SS' (hora local, sem fuso) -> 'AAAA-MM-DDTHH:MM:SS', o formato que o serviço Python lê. */
const paraIso = (dataHora) => String(dataHora).replace(' ', 'T');

const emMs = (dataHora) => Date.parse(`${paraIso(dataHora)}Z`); // só para comparar/subtrair; não converte fusos

/**
 * Sugere horários em que todos os participantes estão livres (CSP no serviço Python).
 * - Reunião nova: `participantes` + o próprio organizador.
 * - Reagendar: com `idReuniao`, usa os participantes dessa reunião e ignora o horário atual dela.
 * Só o organizador pede; os dados enviados ao Python são ids e intervalos (sem títulos nem descrições).
 */
async function sugerirHorarios(organizador, dados) {
    const { idReuniao, participantes, duracaoMin, janelaInicio, janelaFim, passoMin, maxAlternativas, diasUteis } = dados;

    if (janelaFim <= janelaInicio) throw erro.badRequest('janela_fim tem de ser posterior a janela_inicio.');
    if ((emMs(janelaFim) - emMs(janelaInicio)) / 86400000 > MAX_JANELA_DIAS) {
        throw erro.badRequest(`A janela não pode exceder ${MAX_JANELA_DIAS} dias.`);
    }

    let ids;
    if (idReuniao) {
        const reuniao = await exigirOrganizador(idReuniao, organizador.id);
        exigirAgendada(reuniao);
        ids = await participanteModel.listarIds(idReuniao);
    } else {
        ids = [...new Set([organizador.id, ...participantes])];
        await validarUtilizadores(ids.filter((id) => id !== organizador.id));
    }
    if (ids.length > MAX_PARTICIPANTES_HORARIOS) {
        throw erro.badRequest(`Máximo de ${MAX_PARTICIPANTES_HORARIOS} participantes para sugerir horários.`);
    }

    const ocupacoes = await reuniaoModel.listarOcupacoes({
        idsUtilizadores: ids, de: janelaInicio, ate: janelaFim, excluirReuniao: idReuniao || null
    });
    if (ocupacoes.length > MAX_OCUPACOES) {
        throw erro.badRequest('Há demasiados compromissos nesta janela. Reduza a janela ou o número de participantes.');
    }

    const resposta = await iaClient.sugerirHorarios({
        reunioes: [{
            id_reuniao: idReuniao || 0,
            duracao_min: duracaoMin,
            participantes: ids,
            janela_inicio: paraIso(janelaInicio),
            janela_fim: paraIso(janelaFim)
        }],
        ocupacoes: ocupacoes.map((o) => ({
            id_utilizador: o.id_utilizador, inicio: paraIso(o.inicio), fim: paraIso(o.fim), motivo: o.motivo
        })),
        dias_uteis: diasUteis,
        passo_min: passoMin,
        max_alternativas: maxAlternativas
    });
    if (!Array.isArray(resposta.alternativas) || !Array.isArray(resposta.diagnostico)) {
        console.error('[ia] /sugerir-horarios devolveu uma estrutura inesperada.');
        throw new HttpError(502, 'O serviço de IA devolveu uma resposta inválida.');
    }

    // O Python só conhece ids: aqui traduzem-se para nomes
    const nomes = new Map((await utilizadorModel.listarAtivosPorIds(ids)).map((u) => [u.id_utilizador, u.nome]));
    const nomeDe = (id) => nomes.get(id) ?? `Utilizador ${id}`;
    const d = resposta.diagnostico[0] || {};

    return {
        encontrou_solucao: Boolean(resposta.encontrou_solucao),
        alternativas: resposta.alternativas
            .map((a) => a.horarios && a.horarios[0])
            .filter(Boolean)
            .map((h) => ({ inicio: h.inicio, fim: h.fim })),
        motivo: resposta.motivo
            ? resposta.motivo
                .replace(/reunião \d+/g, 'reunião')
                .replace(/(\d+) \((\d+) horários\)/g, (_, id, n) => `${nomeDe(Number(id))} (${n} horários)`)
            : null,
        participantes: ids.map((id) => ({ id_utilizador: id, nome: nomeDe(id) })),
        diagnostico: {
            horarios_candidatos: d.horarios_candidatos ?? 0,
            horarios_livres: d.horarios_livres ?? 0,
            participantes_mais_ocupados: (d.participantes_mais_ocupados || []).map((p) => ({
                id_utilizador: p.id_utilizador, nome: nomeDe(p.id_utilizador), horarios_bloqueados: p.horarios_bloqueados
            }))
        },
        incompleto: Boolean(resposta.incompleto),
        metodo: resposta.metodo
    };
}

module.exports = {
    listar, obterDetalhe, criar, atualizar, alterarEstado, responderConvite, adicionarParticipantes, removerParticipante,
    sugerirHorarios
};