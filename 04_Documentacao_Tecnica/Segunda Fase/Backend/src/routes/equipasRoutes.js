import { Router } from "express";

import {
  listarEquipas
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

export default router;
