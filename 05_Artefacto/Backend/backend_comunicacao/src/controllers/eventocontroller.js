const eventoModel = require('../models/evento');
const v = require('../middleware/validation');
const { erro } = require('../utils/httpError');

const ok = (res, dados, status = 200) => res.status(status).json({ sucesso: true, dados });

// Os eventos são pessoais: só o criador os vê e altera (a identidade vem do token).

/** Aceita "YYYY-MM-DD" (dia inteiro) ou data/hora completa. */
function filtroData(valor, nome, fimDoDia) {
    if (valor === undefined || valor === '') return null;
    if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor.trim())) {
        v.dataHora(`${valor.trim()} 00:00:00`, nome); // valida que a data existe
        return `${valor.trim()} ${fimDoDia ? '23:59:59' : '00:00:00'}`;
    }
    return v.dataHora(valor, nome);
}

async function obterDoUtilizador(idEvento, idUtilizador) {
    const evento = await eventoModel.obterPorId(idEvento);
    if (!evento) throw erro.notFound('Evento não encontrado.');
    // 404 em vez de 403: não revela a existência de eventos de outros utilizadores
    if (evento.id_criador !== idUtilizador) throw erro.notFound('Evento não encontrado.');
    return evento;
}

function validarIntervalo(inicio, fim) {
    if (fim < inicio) throw erro.badRequest('data_fim não pode ser anterior a data_inicio.');
}

async function listar(req, res) {
    const q = req.query;
    const de = filtroData(q.de, 'de', false);
    const ate = filtroData(q.ate, 'ate', true);
    if (de && ate && ate < de) throw erro.badRequest('"ate" não pode ser anterior a "de".');
    const tipo = v.texto(q.tipo, 'tipo', { max: 30 });

    ok(res, await eventoModel.listarPorCriador(req.utilizador.id, { de, ate, tipo }));
}

async function obter(req, res) {
    ok(res, await obterDoUtilizador(req.params.idEvento, req.utilizador.id));
}

async function criar(req, res) {
    const b = req.body || {};
    const titulo = v.texto(b.titulo, 'titulo', { obrigatorio: true, max: 150 });
    const descricao = v.texto(b.descricao, 'descricao', { max: 5000 });
    const dataInicio = v.dataHora(b.data_inicio, 'data_inicio', { obrigatorio: true });
    const dataFim = v.dataHora(b.data_fim, 'data_fim', { obrigatorio: true });
    // tipo_evento é NOT NULL na BD e de texto livre (ex.: 'reuniao', 'prazo'); por omissão 'evento'
    const tipoEvento = v.texto(b.tipo_evento, 'tipo_evento', { max: 30 }) || 'evento';
    validarIntervalo(dataInicio, dataFim);

    const id = await eventoModel.criar({
        idCriador: req.utilizador.id, titulo, descricao, dataInicio, dataFim, tipoEvento
    });
    ok(res, await eventoModel.obterPorId(id), 201);
}

async function atualizar(req, res) {
    const atual = await obterDoUtilizador(req.params.idEvento, req.utilizador.id);
    const b = req.body || {};

    const alteracoes = {};
    if (b.titulo !== undefined) alteracoes.titulo = v.texto(b.titulo, 'titulo', { obrigatorio: true, max: 150 });
    if (b.descricao !== undefined) alteracoes.descricao = v.texto(b.descricao, 'descricao', { max: 5000 });
    if (b.data_inicio !== undefined) alteracoes.dataInicio = v.dataHora(b.data_inicio, 'data_inicio', { obrigatorio: true });
    if (b.data_fim !== undefined) alteracoes.dataFim = v.dataHora(b.data_fim, 'data_fim', { obrigatorio: true });
    if (b.tipo_evento !== undefined) alteracoes.tipoEvento = v.texto(b.tipo_evento, 'tipo_evento', { obrigatorio: true, max: 30 });
    if (!Object.keys(alteracoes).length) throw erro.badRequest('Nenhum campo para atualizar.');

    // valida o intervalo final (valores novos + os que se mantêm)
    validarIntervalo(alteracoes.dataInicio ?? atual.data_inicio, alteracoes.dataFim ?? atual.data_fim);

    await eventoModel.atualizar(atual.id_evento, alteracoes);
    ok(res, await eventoModel.obterPorId(atual.id_evento));
}

async function eliminar(req, res) {
    const evento = await obterDoUtilizador(req.params.idEvento, req.utilizador.id);
    await eventoModel.eliminar(evento.id_evento);
    ok(res, { eliminado: evento.id_evento });
}

module.exports = { listar, obter, criar, atualizar, eliminar };