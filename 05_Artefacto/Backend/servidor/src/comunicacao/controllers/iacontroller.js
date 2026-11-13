const service = require('../services/iaservice');
const v = require('../middleware/validation');

const ok = (res, dados, status = 200) => res.status(status).json({ sucesso: true, dados });

// O utilizador é SEMPRE o autenticado (req.utilizador); nunca vem do corpo do pedido.

// --- Chat com a IA ---------------------------------------------------------

async function criarConversa(req, res) {
    const idProjeto = v.inteiroPositivoOpcional((req.body || {}).id_projeto, 'id_projeto');
    ok(res, await service.criarConversa(req.utilizador.id, idProjeto), 201);
}

async function listarConversas(req, res) {
    ok(res, await service.listarConversas(req.utilizador.id));
}

async function listarMensagens(req, res) {
    const pag = v.paginacao(req.query);
    ok(res, await service.listarMensagens(req.params.idConversaIa, req.utilizador.id, pag));
}

async function perguntar(req, res) {
    const pergunta = v.texto((req.body || {}).pergunta, 'pergunta', { obrigatorio: true, max: 4000 });
    ok(res, await service.perguntar(req.params.idConversaIa, req.utilizador.id, pergunta), 201);
}

// --- Resumos e decisões de reuniões ----------------------------------------

async function gerarResumo(req, res) {
    // notas ou transcrição da reunião (o Python exige pelo menos 20 caracteres)
    const texto = v.texto((req.body || {}).texto, 'texto', { obrigatorio: true, max: 50000, min: 20 });
    ok(res, await service.gerarResumo(req.params.idReuniao, req.utilizador, texto), 201);
}

async function obterResumos(req, res) {
    ok(res, await service.obterResumos(req.params.idReuniao, req.utilizador.id));
}

async function validarDecisao(req, res) {
    const estado = v.opcao((req.body || {}).estado_validacao, ['confirmada', 'rejeitada'], 'estado_validacao', { obrigatorio: true });
    ok(res, await service.validarDecisao(req.params.idDecisao, req.utilizador.id, estado));
}

// --- Sugestões para o projeto ----------------------------------------------

const ESTADOS_SUGESTAO = ['pendente', 'aceite', 'rejeitada'];

async function gerarSugestoes(req, res) {
    ok(res, await service.gerarSugestoes(req.params.idProjeto, req.utilizador), 201);
}

async function listarSugestoes(req, res) {
    const estado = v.opcao(req.query.estado, ESTADOS_SUGESTAO, 'estado');
    ok(res, await service.listarSugestoes(req.params.idProjeto, req.utilizador.id, { estado }));
}

async function responderSugestao(req, res) {
    const estado = v.opcao((req.body || {}).estado, ['aceite', 'rejeitada'], 'estado', { obrigatorio: true });
    ok(res, await service.responderSugestao(req.params.idSugestao, req.utilizador.id, estado));
}

async function responderSugestaoOrganizacao(req, res) {
    const estado = v.opcao((req.body || {}).estado, ['aceite', 'rejeitada'], 'estado', { obrigatorio: true });
    ok(res, await service.responderSugestaoOrganizacao(req.params.idSugestao, req.utilizador.id, estado));
}

module.exports = {
    criarConversa, listarConversas, listarMensagens, perguntar,
    gerarResumo, obterResumos, validarDecisao,
    gerarSugestoes, listarSugestoes, responderSugestao, responderSugestaoOrganizacao
};