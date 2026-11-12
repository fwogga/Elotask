const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const { validarParams } = require('../middleware/validation');
const c = require('../controllers/reuniaocontroller');

const router = express.Router();
router.use(autenticar);

router.get('/', asyncHandler(c.listar));
router.post('/horarios-sugeridos', asyncHandler(c.sugerirHorarios));
router.post('/', asyncHandler(c.criar));

router.get('/:idReuniao', validarParams('idReuniao'), asyncHandler(c.obter));
router.patch('/:idReuniao', validarParams('idReuniao'), asyncHandler(c.atualizar));

router.patch('/:idReuniao/estado', validarParams('idReuniao'), asyncHandler(c.alterarEstado));
router.patch('/:idReuniao/convite', validarParams('idReuniao'), asyncHandler(c.responderConvite));

router.post('/:idReuniao/participantes', validarParams('idReuniao'), asyncHandler(c.adicionarParticipantes));
router.delete('/:idReuniao/participantes/:idUtilizador', validarParams('idReuniao', 'idUtilizador'), asyncHandler(c.removerParticipante));

module.exports = router;