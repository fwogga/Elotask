const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const { validarParams } = require('../middleware/validation');
const c = require('../controllers/eventocontroller');

const router = express.Router();
router.use(autenticar);

router.get('/', asyncHandler(c.listar));
router.post('/', asyncHandler(c.criar));
router.get('/:idEvento', validarParams('idEvento'), asyncHandler(c.obter));
router.patch('/:idEvento', validarParams('idEvento'), asyncHandler(c.atualizar));
router.delete('/:idEvento', validarParams('idEvento'), asyncHandler(c.eliminar));

module.exports = router;