import express from "express";

import {
  criarTarefa,
  listarTarefasProjeto
} from "../controllers/tarefasController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

// Criar tarefa
router.post(
  "/:id_projeto/tarefas",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  criarTarefa
);

// Listar tarefas
router.get(
  "/:id_projeto/tarefas",
  autenticarToken,
  listarTarefasProjeto
);

export default router;