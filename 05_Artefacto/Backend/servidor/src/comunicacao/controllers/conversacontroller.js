const service = require('../services/conversaservice');
const v = require('../middleware/validation');
const { erro } = require('../utils/httpError');

const ok = (res, dados, status = 200) => res.status(status).json({ sucesso: true, dados });

// A identidade vem SEMPRE do token (req.utilizador), nunca do corpo do pedido.

async function listarMinhas(req, res) {
    ok(res, await service.listarDoUtilizador(req.utilizador.id));
}

/** Rota de referência do relatório: só o próprio utilizador pode listar as suas conversas. */
async function listarPorUtilizador(req, res) {
    if (req.params.idUtilizador !== req.utilizador.id) throw erro.forbidden('Só pode consultar as suas próprias conversas.');
    ok(res, await service.listarDoUtilizador(req.utilizador.id));
}

async function obter(req, res) {
    ok(res, await service.obterDetalhe(req.params.idConversa, req.utilizador.id));
}

async function listarMembros(req, res) {
    ok(res, await service.listarMembros(req.params.idConversa, req.utilizador.id));
}

async function criar(req, res) {
    const corpo = req.body || {};
    const tipo = v.opcao(corpo.tipo, ['individual', 'grupo'], 'tipo', { obrigatorio: true });
    const nome = v.texto(corpo.nome, 'nome', { max: 150 });
    const participantes = v.listaIds(corpo.participantes, 'participantes');

    const { conversa, criada } = await service.criar(req.utilizador.id, { tipo, nome, participantes });
    ok(res, conversa, criada ? 201 : 200);
}

async function atualizar(req, res) {
    const corpo = req.body || {};
    const nome = v.texto(corpo.nome, 'nome', { max: 150 });
    const estado = v.opcao(corpo.estado, ['ativa', 'arquivada'], 'estado');
    if (nome === null && estado === null) throw erro.badRequest('Indique nome e/ou estado.');
    ok(res, await service.atualizar(req.params.idConversa, req.utilizador.id, {
        nome: nome ?? undefined,
        estado: estado ?? undefined
    }));
}

async function adicionarMembros(req, res) {
    const ids = v.listaIds((req.body || {}).participantes, 'participantes');
    if (!ids.length) throw erro.badRequest('Indique pelo menos um participante.');
    ok(res, await service.adicionarMembros(req.params.idConversa, req.utilizador.id, ids), 201);
}

async function removerMembro(req, res) {
    ok(res, await service.removerMembro(req.params.idConversa, req.utilizador.id, req.params.idUtilizador));
}

async function alterarPapel(req, res) {
    const papel = v.opcao((req.body || {}).papel, ['administrador', 'membro'], 'papel', { obrigatorio: true });
    ok(res, await service.alterarPapel(req.params.idConversa, req.utilizador.id, req.params.idUtilizador, papel));
}

module.exports = { listarMinhas, listarPorUtilizador, obter, listarMembros, criar, atualizar, adicionarMembros, removerMembro, alterarPapel };