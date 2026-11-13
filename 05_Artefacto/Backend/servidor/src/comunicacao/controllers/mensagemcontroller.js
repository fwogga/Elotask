const service = require('../services/mensagemservice');
const v = require('../middleware/validation');

const ok = (res, dados, status = 200) => res.status(status).json({ sucesso: true, dados });

const MAX_CONTEUDO = 5000;

// O remetente é SEMPRE o utilizador autenticado (req.utilizador), nunca vem do corpo do pedido.

function lerNovaMensagem(body = {}) {
    return {
        conteudo: v.texto(body.conteudo, 'conteudo', { max: MAX_CONTEUDO }),
        idMensagemResposta: v.inteiroPositivoOpcional(body.id_mensagem_resposta, 'id_mensagem_resposta')
    };
}

async function listarDaConversa(req, res) {
    const pag = v.paginacao(req.query);
    ok(res, await service.listarDaConversa(req.params.idConversa, req.utilizador.id, pag));
}

async function listarDoCanal(req, res) {
    const pag = v.paginacao(req.query);
    ok(res, await service.listarDoCanal(req.params.idCanal, req.utilizador.id, pag));
}

async function enviarNaConversa(req, res) {
    const dados = lerNovaMensagem(req.body);
    ok(res, await service.enviarNaConversa(req.params.idConversa, req.utilizador.id, dados), 201);
}

async function enviarNoCanal(req, res) {
    const dados = lerNovaMensagem(req.body);
    ok(res, await service.enviarNoCanal(req.params.idCanal, req.utilizador.id, dados), 201);
}

async function editar(req, res) {
    const conteudo = v.texto((req.body || {}).conteudo, 'conteudo', { obrigatorio: true, max: MAX_CONTEUDO });
    ok(res, await service.editar(req.params.idMensagem, req.utilizador.id, conteudo));
}

async function eliminar(req, res) {
    ok(res, await service.eliminar(req.params.idMensagem, req.utilizador.id));
}

module.exports = { listarDaConversa, listarDoCanal, enviarNaConversa, enviarNoCanal, editar, eliminar };