import express from "express";

import {
  criarItemChecklist,
  listarItensChecklist,
  atualizarItemChecklist,
  atualizarEstadoItemChecklist,
  eliminarItemChecklist,
  listarItensInativos,
  reativarItemChecklist
} from "../controllers/itensChecklistController.js";
import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

// Criar item
router.post(
  "/:id_projeto/tarefas/:id_tarefa/checklists/:id_checklist/itens",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  criarItemChecklist
);

// Listar itens
router.get(
  "/:id_projeto/tarefas/:id_tarefa/checklists/:id_checklist/itens",
  autenticarToken,
  listarItensChecklist
);

// Atualizar descrição ou ordem
router.put(
  "/:id_projeto/tarefas/:id_tarefa/checklists/:id_checklist/itens/:id_item",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  atualizarItemChecklist
);

// Alterar estado do item
router.put(
  "/:id_projeto/tarefas/:id_tarefa/checklists/:id_checklist/itens/:id_item/estado",
  autenticarToken,
  atualizarEstadoItemChecklist
);

// Eliminar item
router.delete(
  "/:id_projeto/tarefas/:id_tarefa/checklists/:id_checklist/itens/:id_item",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  eliminarItemChecklist
);

// Listar itens inativos
router.get(
  "/:id_projeto/tarefas/:id_tarefa/checklists/:id_checklist/itens/inativos",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  listarItensInativos
);

// Reativar item
router.put(
  "/:id_projeto/tarefas/:id_tarefa/checklists/:id_checklist/itens/:id_item/reativar",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  reativarItemChecklist
);

export default router;