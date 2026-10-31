
import { Router } from "express";

import {
  adicionarMembroEquipa,
  listarMembrosEquipa
} from "../controllers/membrosEquipaController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = Router();

// Adicionar um membro a uma equipa
router.post(
  "/:id/membros",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  adicionarMembroEquipa
);

// Listar membros da equipa
router.get(
  "/:id/membros",
  autenticarToken,
  autorizarPerfil("admin", "gestor", "colaborador"),
  listarMembrosEquipa
);

export default router;
