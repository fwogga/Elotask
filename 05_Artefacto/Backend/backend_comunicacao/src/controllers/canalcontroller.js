const service = require('../services/canalservice');
const v = require('../middleware/validation');
const { erro } = require('../utils/httpError');

const ok = (res, dados, status = 200) => res.status(status).json({ sucesso: true, dados });

const TIPOS = ['publico', 'privado'];

// O utilizador vem SEMPRE do token (req.utilizador); o id da equipa vem do URL.

async function listarMeus(req, res) {
    ok(res, await service.listarMeus(req.utilizador.id));
}

async function listarDaEquipa(req, res) {
    ok(res, await service.listarDaEquipa(req.params.idEquipa, req.utilizador.id));
}

async function obter(req, res) {
    ok(res, await service.obterDetalhe(req.params.idCanal, req.utilizador.id));
}

async function criar(req, res) {
    const b = req.body || {};
    const dados = {
        nome: v.texto(b.nome, 'nome', { obrigatorio: true, max: 100 }),
        descricao: v.texto(b.descricao, 'descricao', { max: 5000 }),
        tipo: v.opcao(b.tipo, TIPOS, 'tipo') || 'publico',
        participantes: v.listaIds(b.participantes, 'participantes')
    };
    ok(res, await service.criar(req.utilizador, req.params.idEquipa, dados), 201);
}

async function atualizar(req, res) {
    const b = req.body || {};
    const alteracoes = {};
    if (b.nome !== undefined) alteracoes.nome = v.texto(b.nome, 'nome', { obrigatorio: true, max: 100 });
    if (b.descricao !== undefined) alteracoes.descricao = v.texto(b.descricao, 'descricao', { max: 5000 });
    if (b.tipo !== undefined) alteracoes.tipo = v.opcao(b.tipo, TIPOS, 'tipo', { obrigatorio: true });
    if (!Object.keys(alteracoes).length) throw erro.badRequest('Nenhum campo para atualizar.');
    ok(res, await service.atualizar(req.params.idCanal, req.utilizador.id, alteracoes));
}

/** Apagar um canal apaga também todas as suas mensagens: exige ?confirmar=true. */
async function eliminar(req, res) {
    if (req.query.confirmar !== 'true') {
        throw erro.badRequest('Eliminar o canal apaga todas as suas mensagens. Repita o pedido com ?confirmar=true.');
    }
    ok(res, await service.eliminar(req.params.idCanal, req.utilizador.id));
}

async function entrar(req, res) {
    ok(res, await service.entrar(req.params.idCanal, req.utilizador.id));
}

async function listarMembros(req, res) {
    ok(res, await service.listarMembros(req.params.idCanal, req.utilizador.id));
}

async function adicionarMembros(req, res) {
    const ids = v.listaIds((req.body || {}).participantes, 'participantes');
    if (!ids.length) throw erro.badRequest('Indique pelo menos um participante.');
    ok(res, await service.adicionarMembros(req.params.idCanal, req.utilizador, ids), 201);
}

async function removerMembro(req, res) {
    ok(res, await service.removerMembro(req.params.idCanal, req.utilizador, req.params.idUtilizador));
}

async function alterarPapel(req, res) {
    const papel = v.opcao((req.body || {}).papel, ['administrador', 'membro'], 'papel', { obrigatorio: true });
    ok(res, await service.alterarPapel(req.params.idCanal, req.utilizador.id, req.params.idUtilizador, papel));
}

module.exports = {
    listarMeus, listarDaEquipa, obter, criar, atualizar, eliminar, entrar, listarMembros,
    adicionarMembros, removerMembro, alterarPapel
};