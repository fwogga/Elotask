import express from "express";

import {
  criarChecklist,
  listarChecklistsTarefa,
  obterChecklistPorId,
  atualizarChecklist,
  eliminarChecklist,
  listarChecklistsInativas,
  reativarChecklist
} from "../controllers/checklistsController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

// Criar checklist
router.post(
  "/:id_projeto/tarefas/:id_tarefa/checklists",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  criarChecklist
);

// Listar checklists de uma tarefa
router.get(
  "/:id_projeto/tarefas/:id_tarefa/checklists",
  autenticarToken,
  listarChecklistsTarefa
);

// Listar checklists inativas
router.get(
  "/:id_projeto/tarefas/:id_tarefa/checklists/inativas",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  listarChecklistsInativas
);

// Consultar checklist específica
router.get(
  "/:id_projeto/tarefas/:id_tarefa/checklists/:id_checklist",
  autenticarToken,
  obterChecklistPorId
);

// Atualizar checklist
router.put(
  "/:id_projeto/tarefas/:id_tarefa/checklists/:id_checklist",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  atualizarChecklist
);

// Eliminar checklist
router.delete(
  "/:id_projeto/tarefas/:id_tarefa/checklists/:id_checklist",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  eliminarChecklist
);

// Reativar checklist
router.put(
  "/:id_projeto/tarefas/:id_tarefa/checklists/:id_checklist/reativar",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  reativarChecklist
);

export default router;