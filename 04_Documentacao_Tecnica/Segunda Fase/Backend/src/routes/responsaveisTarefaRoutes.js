import express from "express";

import {
  atribuirResponsavelTarefa
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

export default router;