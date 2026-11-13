const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const { validarParams } = require('../middleware/validation');
const c = require('../controllers/mensagemcontroller');

// Montado em /api. A autenticação é aplicada rota a rota (e não com router.use),
// para não afetar outras rotas /api que ainda não existem.
const router = express.Router();

// Mensagens de uma conversa
router.get('/conversas/:idConversa/mensagens', autenticar, validarParams('idConversa'), asyncHandler(c.listarDaConversa));
router.post('/conversas/:idConversa/mensagens', autenticar, validarParams('idConversa'), asyncHandler(c.enviarNaConversa));

// Mensagens de um canal
router.get('/canais/:idCanal/mensagens', autenticar, validarParams('idCanal'), asyncHandler(c.listarDoCanal));
router.post('/canais/:idCanal/mensagens', autenticar, validarParams('idCanal'), asyncHandler(c.enviarNoCanal));

// Editar / eliminar uma mensagem
router.patch('/mensagens/:idMensagem', autenticar, validarParams('idMensagem'), asyncHandler(c.editar));
router.delete('/mensagens/:idMensagem', autenticar, validarParams('idMensagem'), asyncHandler(c.eliminar));

module.exports = router;