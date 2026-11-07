import express from "express";

import {
  atribuirResponsavelTarefa,
  listarResponsaveisTarefa
} from "../controllers/responsaveisTarefaController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

router.post(
  "/:id_projeto/tarefas/:id_tarefa/responsaveis",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  atribuirResponsavelTarefa
);

router.get(
  "/:id_projeto/tarefas/:id_tarefa/responsaveis",
  autenticarToken,
  listarResponsaveisTarefa
);

export default router;