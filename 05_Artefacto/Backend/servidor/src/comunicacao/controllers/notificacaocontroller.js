const service = require('../services/notificacaoservice');
const v = require('../middleware/validation');

const ok = (res, dados, status = 200) => res.status(status).json({ sucesso: true, dados });

// O dono das notificações é SEMPRE o utilizador autenticado (req.utilizador).

async function listar(req, res) {
    const { limite, antes } = v.paginacao(req.query, { limiteDefault: 20, limiteMax: 100 });
    const apenasNaoLidas = ['true', '1'].includes(String(req.query.nao_lidas).toLowerCase());
    ok(res, await service.listar(req.utilizador.id, { limite, antes, apenasNaoLidas }));
}

async function contarNaoLidas(req, res) {
    ok(res, await service.contarNaoLidas(req.utilizador.id));
}

async function marcarComoLida(req, res) {
    ok(res, await service.marcarComoLida(req.params.idNotificacao, req.utilizador.id));
}

async function marcarTodasComoLidas(req, res) {
    ok(res, await service.marcarTodasComoLidas(req.utilizador.id));
}

async function eliminar(req, res) {
    ok(res, await service.eliminar(req.params.idNotificacao, req.utilizador.id));
}

module.exports = { listar, contarNaoLidas, marcarComoLida, marcarTodasComoLidas, eliminar };