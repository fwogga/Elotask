
import { Router } from "express";

import {
  adicionarMembroEquipa,
  listarMembrosEquipa,
  removerMembroEquipa
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

// Remover membro da equipa
router.delete(
  "/:id/membros/:id_utilizador",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  removerMembroEquipa
);

export default router;
