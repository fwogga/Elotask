const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const { validarParams } = require('../middleware/validation');
const c = require('../controllers/canalcontroller');

// Montado em /api (os canais vivem em /api/canais e /api/equipas/:id/canais).
// A autenticação é aplicada rota a rota para não afetar outras rotas /api.
const router = express.Router();

// Canais de uma equipa
router.get('/equipas/:idEquipa/canais', autenticar, validarParams('idEquipa'), asyncHandler(c.listarDaEquipa));
router.post('/equipas/:idEquipa/canais', autenticar, validarParams('idEquipa'), asyncHandler(c.criar));

// Os meus canais
router.get('/canais', autenticar, asyncHandler(c.listarMeus));

// Um canal
router.get('/canais/:idCanal', autenticar, validarParams('idCanal'), asyncHandler(c.obter));
router.patch('/canais/:idCanal', autenticar, validarParams('idCanal'), asyncHandler(c.atualizar));
router.delete('/canais/:idCanal', autenticar, validarParams('idCanal'), asyncHandler(c.eliminar));
router.post('/canais/:idCanal/entrar', autenticar, validarParams('idCanal'), asyncHandler(c.entrar));

// Membros do canal
router.get('/canais/:idCanal/membros', autenticar, validarParams('idCanal'), asyncHandler(c.listarMembros));
router.post('/canais/:idCanal/membros', autenticar, validarParams('idCanal'), asyncHandler(c.adicionarMembros));
router.patch('/canais/:idCanal/membros/:idUtilizador', autenticar, validarParams('idCanal', 'idUtilizador'), asyncHandler(c.alterarPapel));
router.delete('/canais/:idCanal/membros/:idUtilizador', autenticar, validarParams('idCanal', 'idUtilizador'), asyncHandler(c.removerMembro));

module.exports = router;