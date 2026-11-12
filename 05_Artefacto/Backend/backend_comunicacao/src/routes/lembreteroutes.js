const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const c = require('../controllers/lembretecontroller');

// Montado em /api/lembretes. Só consulta: os lembretes são criados e enviados pelo sistema.
const router = express.Router();
router.use(autenticar);

router.get('/', asyncHandler(c.listarMeus));

module.exports = router;