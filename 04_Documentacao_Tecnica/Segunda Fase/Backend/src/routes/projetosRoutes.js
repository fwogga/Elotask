import { Router } from "express";

import {
  criarProjeto,
  listarProjetos
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

export default router;