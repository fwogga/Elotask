import express from "express";

import {
  criarChecklist,
  listarChecklistsTarefa
} from "../controllers/checklistsController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

router.post(
  "/:id_projeto/tarefas/:id_tarefa/checklists",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  criarChecklist
);

router.get(
  "/:id_projeto/tarefas/:id_tarefa/checklists",
  autenticarToken,
  listarChecklistsTarefa
);

export default router;