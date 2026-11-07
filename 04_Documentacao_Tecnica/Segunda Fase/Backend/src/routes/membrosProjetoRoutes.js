import express from "express";

import {
  adicionarMembroProjeto
} from "../controllers/membrosProjetoController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

router.post(
  "/:id/membros",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  adicionarMembroProjeto
);

export default router;