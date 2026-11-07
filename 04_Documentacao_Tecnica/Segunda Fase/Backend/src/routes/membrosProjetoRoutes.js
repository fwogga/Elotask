import express from "express";

import {
  adicionarMembroProjeto,
  listarMembrosProjeto
} from "../controllers/membrosProjetoController.js";

import {
  autenticarToken,
  autorizarPerfil
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

export default router;