const service = require('../services/lembreteservice');
const v = require('../middleware/validation');

const ok = (res, dados, status = 200) => res.status(status).json({ sucesso: true, dados });

// O dono dos lembretes é SEMPRE o utilizador autenticado (req.utilizador); nunca vem do pedido.

async function listarMeus(req, res) {
    const estado = v.opcao(req.query.estado, service.ESTADOS, 'estado');
    ok(res, await service.listarMeus(req.utilizador.id, { estado }));
}

module.exports = { listarMeus };