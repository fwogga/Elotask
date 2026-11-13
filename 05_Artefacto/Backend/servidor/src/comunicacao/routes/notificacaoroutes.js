const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const { validarParams } = require('../middleware/validation');
const c = require('../controllers/notificacaocontroller');

const router = express.Router();
router.use(autenticar);

router.get('/', asyncHandler(c.listar));
router.get('/nao-lidas', asyncHandler(c.contarNaoLidas));

// rotas fixas antes das rotas com :id
router.patch('/lidas', asyncHandler(c.marcarTodasComoLidas));
router.patch('/:idNotificacao/lida', validarParams('idNotificacao'), asyncHandler(c.marcarComoLida));
router.delete('/:idNotificacao', validarParams('idNotificacao'), asyncHandler(c.eliminar));

module.exports = router;