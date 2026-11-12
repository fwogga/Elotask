const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const { validarParams } = require('../middleware/validation');
const c = require('../controllers/chamadacontroller');

const router = express.Router();
router.use(autenticar);

router.get('/', asyncHandler(c.listar));
router.post('/', asyncHandler(c.iniciar));

// rotas fixas antes das rotas com :id
router.get('/ativas', asyncHandler(c.listarAtivas));
router.get('/config-webrtc', c.configWebrtc);

router.get('/:idChamada', validarParams('idChamada'), asyncHandler(c.obter));
router.post('/:idChamada/entrar', validarParams('idChamada'), asyncHandler(c.entrar));
router.post('/:idChamada/recusar', validarParams('idChamada'), asyncHandler(c.recusar));
router.post('/:idChamada/sair', validarParams('idChamada'), asyncHandler(c.sair));
router.post('/:idChamada/terminar', validarParams('idChamada'), asyncHandler(c.terminar));

module.exports = router;