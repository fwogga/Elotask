const service = require('../services/chamadaservice');
const v = require('../middleware/validation');

const ok = (res, dados, status = 200) => res.status(status).json({ sucesso: true, dados });

// O utilizador vem SEMPRE do token (req.utilizador); o iniciador é quem faz o pedido.

async function listar(req, res) {
    const { limite, antes } = v.paginacao(req.query, { limiteDefault: 20, limiteMax: 100 });
    const estado = v.opcao(req.query.estado, ['iniciada', 'em_curso', 'terminada', 'falhada', 'cancelada'], 'estado');
    ok(res, await service.listar(req.utilizador.id, { estado, limite, antes }));
}

async function listarAtivas(req, res) {
    ok(res, await service.listarAtivas(req.utilizador.id));
}

function configWebrtc(req, res) {
    ok(res, service.configWebrtc());
}

async function obter(req, res) {
    ok(res, await service.obterDetalhe(req.params.idChamada, req.utilizador.id));
}

async function iniciar(req, res) {
    const b = req.body || {};
    const dados = {
        tipoChamada: v.opcao(b.tipo_chamada, ['voz', 'video'], 'tipo_chamada', { obrigatorio: true }),
        idConversa: v.inteiroPositivoOpcional(b.id_conversa, 'id_conversa'),
        idReuniao: v.inteiroPositivoOpcional(b.id_reuniao, 'id_reuniao')
    };
    ok(res, await service.iniciar(req.utilizador, dados), 201);
}

async function entrar(req, res) {
    ok(res, await service.entrar(req.params.idChamada, req.utilizador));
}

async function recusar(req, res) {
    ok(res, await service.recusar(req.params.idChamada, req.utilizador));
}

async function sair(req, res) {
    ok(res, await service.sair(req.params.idChamada, req.utilizador));
}

async function terminar(req, res) {
    ok(res, await service.terminar(req.params.idChamada, req.utilizador));
}

module.exports = { listar, listarAtivas, configWebrtc, obter, iniciar, entrar, recusar, sair, terminar };