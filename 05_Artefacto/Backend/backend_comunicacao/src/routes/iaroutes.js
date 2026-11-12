const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const { validarParams } = require('../middleware/validation');
const c = require('../controllers/iacontroller');

// Montado em /api/ia
const router = express.Router();
router.use(autenticar);

// Chat com a IA (conversas privadas de cada utilizador)
router.post('/conversas', asyncHandler(c.criarConversa));
router.get('/conversas', asyncHandler(c.listarConversas));
router.get('/conversas/:idConversaIa/mensagens', validarParams('idConversaIa'), asyncHandler(c.listarMensagens));
router.post('/conversas/:idConversaIa/mensagens', validarParams('idConversaIa'), asyncHandler(c.perguntar));

// Resumos e decisões de reuniões
router.post('/reunioes/:idReuniao/resumo', validarParams('idReuniao'), asyncHandler(c.gerarResumo));
router.get('/reunioes/:idReuniao/resumos', validarParams('idReuniao'), asyncHandler(c.obterResumos));
router.patch('/decisoes/:idDecisao', validarParams('idDecisao'), asyncHandler(c.validarDecisao));

// Sugestões para o projeto
router.post('/projetos/:idProjeto/sugestoes', validarParams('idProjeto'), asyncHandler(c.gerarSugestoes));
router.get('/projetos/:idProjeto/sugestoes', validarParams('idProjeto'), asyncHandler(c.listarSugestoes));
router.patch('/sugestoes/:idSugestao', validarParams('idSugestao'), asyncHandler(c.responderSugestao));
router.patch('/sugestoes-organizacao/:idSugestao', validarParams('idSugestao'), asyncHandler(c.responderSugestaoOrganizacao));

module.exports = router;