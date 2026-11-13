import { Router } from "express";

import {
  criarProjeto,
  listarProjetos,
  obterProjetoPorId,
  atualizarProjeto,
  atualizarEstadoProjeto
} from "../controllers/projetosController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = Router();

// Criar um projeto
router.post(
  "/",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  criarProjeto
);

// Listar todos os projetos
router.get(
  "/",
  autenticarToken,
  autorizarPerfil("admin", "gestor", "colaborador"),
  listarProjetos
);

// Consultar um projeto específico
router.get(
  "/:id",
  autenticarToken,
  autorizarPerfil("admin", "gestor", "colaborador"),
  obterProjetoPorId
);

// Atualizar um projeto
router.put(
  "/:id",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  atualizarProjeto
);

// Atualizar estado do projeto
router.put(
  "/:id/estado",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  atualizarEstadoProjeto
);

export default router;