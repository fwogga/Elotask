import { Router } from "express";

import {
  criarProjeto
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

export default router;