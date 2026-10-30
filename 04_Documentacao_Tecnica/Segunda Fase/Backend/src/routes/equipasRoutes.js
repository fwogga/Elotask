import { Router } from "express";

import {
  listarEquipas,
  criarEquipa
} from "../controllers/equipasController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = Router();

// Consultar equipas — todos os perfis autenticados
router.get(
  "/",
  autenticarToken,
  autorizarPerfil("admin", "gestor", "colaborador"),
  listarEquipas
);

// Criar equipa — administrador e gestor
router.post(
  "/",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  criarEquipa
);

export default router;
