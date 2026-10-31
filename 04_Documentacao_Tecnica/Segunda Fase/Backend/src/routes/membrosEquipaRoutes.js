
import { Router } from "express";

import {
  adicionarMembroEquipa
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

export default router;
