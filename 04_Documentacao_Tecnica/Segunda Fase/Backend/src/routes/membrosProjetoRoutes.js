import express from "express";

import {
  adicionarMembroProjeto,
  listarMembrosProjeto,
  atualizarFuncaoMembroProjeto,
  removerMembroProjeto
} from "../controllers/membrosProjetoController.js";

import {
  autenticarToken,
  autorizarPerfil,
} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

// Adicionar membro no projeto
router.post(
  "/:id/membros",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  adicionarMembroProjeto
);

// Listar membros do projeto
router.get(
  "/:id/membros",
  autenticarToken,
  autorizarPerfil("admin", "gestor", "colaborador"),
  listarMembrosProjeto
);

// Atualizar função do membro do projeto
router.put(
  "/:id/membros/:id_utilizador",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  atualizarFuncaoMembroProjeto
);

// Remover membro do projeto 
router.delete(
  "/:id/membros/:id_utilizador",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  removerMembroProjeto
);

export default router;