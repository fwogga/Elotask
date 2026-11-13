const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const { validarParams } = require('../middleware/validation');
const { receberAnexos } = require('../middleware/upload');
const c = require('../controllers/anexocontroller');

// Montado em /api. Autenticação rota a rota (não afeta outras rotas /api).
// Os ficheiros NÃO são servidos como estáticos: só passam por aqui, com verificação de acesso.
const router = express.Router();

// Acrescentar ficheiros a uma mensagem própria (ordem: autenticar -> permissão -> receber ficheiros)
router.post(
    '/mensagens/:idMensagem/anexos',
    autenticar, validarParams('idMensagem'), asyncHandler(c.verificarPodeAnexar), receberAnexos, asyncHandler(c.adicionar)
);

// Descarregar e remover
router.get('/anexos/:idAnexo/download', autenticar, validarParams('idAnexo'), asyncHandler(c.descarregar));
router.delete('/anexos/:idAnexo', autenticar, validarParams('idAnexo'), asyncHandler(c.eliminar));

module.exports = router;