import express from "express";

import {
  criarTarefa,
  listarTarefasProjeto,
  atualizarTarefa,
  atualizarEstadoTarefa,
  eliminarTarefa
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

// Atualizar tarefa
router.put(
  "/:id_projeto/tarefas/:id_tarefa",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  atualizarTarefa
);

// Atualizar estado da tarefa
router.put(
  "/:id_projeto/tarefas/:id_tarefa/estado",
  autenticarToken,
  atualizarEstadoTarefa
);

// Eliminar tarefa
router.delete(
  "/:id_projeto/tarefas/:id_tarefa",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  eliminarTarefa
);

export default router;