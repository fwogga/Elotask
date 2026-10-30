import { Router } from "express";

import {
  listarEquipas,
  criarEquipa,
  atualizarEquipa,
  eliminarEquipa
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

// Atualizar equipa — administrador e gestor
router.put(
  "/:id",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  atualizarEquipa
);

// Eliminar equipa logicamente — administrador e gestor
router.delete(
  "/:id",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  eliminarEquipa
);

export default router;
