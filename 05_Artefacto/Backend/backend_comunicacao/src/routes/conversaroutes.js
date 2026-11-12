const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const { validarParams } = require('../middleware/validation');
const c = require('../controllers/conversacontroller');

const router = express.Router();
router.use(autenticar);

router.get('/', asyncHandler(c.listarMinhas));
router.post('/', asyncHandler(c.criar));

// rota de referência do relatório (restrita ao próprio utilizador)
router.get('/utilizador/:idUtilizador', validarParams('idUtilizador'), asyncHandler(c.listarPorUtilizador));

router.get('/:idConversa', validarParams('idConversa'), asyncHandler(c.obter));
router.patch('/:idConversa', validarParams('idConversa'), asyncHandler(c.atualizar));

router.get('/:idConversa/membros', validarParams('idConversa'), asyncHandler(c.listarMembros));
router.post('/:idConversa/membros', validarParams('idConversa'), asyncHandler(c.adicionarMembros));
router.patch('/:idConversa/membros/:idUtilizador', validarParams('idConversa', 'idUtilizador'), asyncHandler(c.alterarPapel));
router.delete('/:idConversa/membros/:idUtilizador', validarParams('idConversa', 'idUtilizador'), asyncHandler(c.removerMembro));

module.exports = router;