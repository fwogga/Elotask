const service = require('../services/reuniaoservice');
const v = require('../middleware/validation');
const { erro } = require('../utils/httpError');

const ok = (res, dados, status = 200) => res.status(status).json({ sucesso: true, dados });

const TIPOS = ['presencial', 'online'];

// O utilizador vem SEMPRE do token (req.utilizador); o organizador é quem cria a reunião.

async function listar(req, res) {
    const q = req.query;
    const de = v.dataFiltro(q.de, 'de', false);
    const ate = v.dataFiltro(q.ate, 'ate', true);
    if (de && ate && ate < de) throw erro.badRequest('"ate" não pode ser anterior a "de".');
    const estado = v.opcao(q.estado, ['agendada', 'em_curso', 'concluida', 'cancelada'], 'estado');
    ok(res, await service.listar(req.utilizador.id, { de, ate, estado }));
}

async function obter(req, res) {
    ok(res, await service.obterDetalhe(req.params.idReuniao, req.utilizador.id));
}

async function criar(req, res) {
    const b = req.body || {};
    const dados = {
        titulo: v.texto(b.titulo, 'titulo', { obrigatorio: true, max: 150 }),
        descricao: v.texto(b.descricao, 'descricao', { max: 5000 }),
        dataInicio: v.dataHora(b.data_inicio, 'data_inicio', { obrigatorio: true }),
        dataFim: v.dataHora(b.data_fim, 'data_fim', { obrigatorio: true }),
        tipoReuniao: v.opcao(b.tipo_reuniao, TIPOS, 'tipo_reuniao') || 'online',
        localizacao: v.texto(b.localizacao, 'localizacao', { max: 255 }),
        linkReuniao: v.urlHttp(b.link_reuniao, 'link_reuniao'),
        participantes: v.listaIds(b.participantes, 'participantes')
    };
    ok(res, await service.criar(req.utilizador, dados), 201);
}

async function atualizar(req, res) {
    const b = req.body || {};
    const alteracoes = {};
    if (b.titulo !== undefined) alteracoes.titulo = v.texto(b.titulo, 'titulo', { obrigatorio: true, max: 150 });
    if (b.descricao !== undefined) alteracoes.descricao = v.texto(b.descricao, 'descricao', { max: 5000 });
    if (b.data_inicio !== undefined) alteracoes.dataInicio = v.dataHora(b.data_inicio, 'data_inicio', { obrigatorio: true });
    if (b.data_fim !== undefined) alteracoes.dataFim = v.dataHora(b.data_fim, 'data_fim', { obrigatorio: true });
    if (b.tipo_reuniao !== undefined) alteracoes.tipoReuniao = v.opcao(b.tipo_reuniao, TIPOS, 'tipo_reuniao', { obrigatorio: true });
    if (b.localizacao !== undefined) alteracoes.localizacao = v.texto(b.localizacao, 'localizacao', { max: 255 });
    if (b.link_reuniao !== undefined) alteracoes.linkReuniao = v.urlHttp(b.link_reuniao, 'link_reuniao');
    if (!Object.keys(alteracoes).length) throw erro.badRequest('Nenhum campo para atualizar.');

    ok(res, await service.atualizar(req.params.idReuniao, req.utilizador, alteracoes));
}

async function alterarEstado(req, res) {
    const estado = v.opcao((req.body || {}).estado, ['em_curso', 'concluida', 'cancelada'], 'estado', { obrigatorio: true });
    ok(res, await service.alterarEstado(req.params.idReuniao, req.utilizador, estado));
}

async function responderConvite(req, res) {
    const estado = v.opcao((req.body || {}).estado_convite, ['aceite', 'recusado'], 'estado_convite', { obrigatorio: true });
    ok(res, await service.responderConvite(req.params.idReuniao, req.utilizador, estado));
}

async function adicionarParticipantes(req, res) {
    const ids = v.listaIds((req.body || {}).participantes, 'participantes');
    if (!ids.length) throw erro.badRequest('Indique pelo menos um participante.');
    ok(res, await service.adicionarParticipantes(req.params.idReuniao, req.utilizador, ids), 201);
}

async function removerParticipante(req, res) {
    ok(res, await service.removerParticipante(req.params.idReuniao, req.utilizador, req.params.idUtilizador));
}

/** Sugere horários livres para todos os participantes (CSP). Só o organizador; a identidade vem do token. */
async function sugerirHorarios(req, res) {
    const b = req.body || {};

    const inteiroEntre = (valor, nome, min, max, porOmissao) => {
        if (valor === undefined || valor === null || valor === '') return porOmissao;
        const n = Number(valor);
        if (!Number.isInteger(n) || n < min || n > max) throw erro.badRequest(`${nome} deve ser um inteiro entre ${min} e ${max}.`);
        return n;
    };

    const idReuniao = v.inteiroPositivoOpcional(b.id_reuniao, 'id_reuniao');
    const participantes = v.listaIds(b.participantes, 'participantes');
    if (!idReuniao && !participantes.length) throw erro.badRequest('Indique pelo menos um participante.');

    const passoMin = inteiroEntre(b.passo_min, 'passo_min', 15, 60, 30);
    if (![15, 30, 60].includes(passoMin)) throw erro.badRequest('passo_min deve ser 15, 30 ou 60.');
    if (b.dias_uteis !== undefined && typeof b.dias_uteis !== 'boolean') throw erro.badRequest('dias_uteis deve ser verdadeiro ou falso.');

    const dados = {
        idReuniao,
        participantes,
        duracaoMin: inteiroEntre(b.duracao_min, 'duracao_min', 15, 480, undefined),
        janelaInicio: v.dataHora(b.janela_inicio, 'janela_inicio', { obrigatorio: true }),
        janelaFim: v.dataHora(b.janela_fim, 'janela_fim', { obrigatorio: true }),
        passoMin,
        maxAlternativas: inteiroEntre(b.max_alternativas, 'max_alternativas', 1, 10, 3),
        diasUteis: b.dias_uteis === undefined ? true : b.dias_uteis
    };
    if (dados.duracaoMin === undefined) throw erro.badRequest('duracao_min é obrigatório.');

    ok(res, await service.sugerirHorarios(req.utilizador, dados));
}

module.exports = {
    listar, obter, criar, atualizar, alterarEstado, responderConvite, adicionarParticipantes, removerParticipante,
    sugerirHorarios
};