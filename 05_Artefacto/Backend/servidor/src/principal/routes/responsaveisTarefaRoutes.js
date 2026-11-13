import express from "express";

import {
  atribuirResponsavelTarefa,
  listarResponsaveisTarefa,
  removerResponsavelTarefa,
  obterResponsavelTarefa
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

router.delete(
  "/:id_projeto/tarefas/:id_tarefa/responsaveis/:id_utilizador",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  removerResponsavelTarefa
);

router.get(
  "/:id_projeto/tarefas/:id_tarefa/responsaveis/:id_utilizador",
  autenticarToken,
  obterResponsavelTarefa
);

export default router;