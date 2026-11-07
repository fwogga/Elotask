import express from "express";

import {
  criarTarefa
} from "../controllers/tarefasController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

router.post(
  "/:id_projeto/tarefas",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  criarTarefa
);

export default router;