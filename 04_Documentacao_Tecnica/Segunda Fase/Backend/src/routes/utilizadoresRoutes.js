import { Router } from "express";

import {
  listarUtilizadores,
  obterUtilizadorPorId,
  criarUtilizador,
  atualizarUtilizador,
  eliminarUtilizador
} from "../controllers/utilizadoresController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = Router();

// Consultar todos os utilizadores — apenas administrador
router.get(
  "/",
  autenticarToken,
  autorizarPerfil("admin"),
  listarUtilizadores
);

// Consultar um utilizador pelo ID — apenas administrador
router.get(
  "/:id",
  autenticarToken,
  autorizarPerfil("admin"),
  obterUtilizadorPorId
);

// Criar um utilizador — apenas administrador
router.post(
  "/",
  autenticarToken,
  autorizarPerfil("admin"),
  criarUtilizador
);

// Atualizar um utilizador — apenas administrador
router.patch(
  "/:id",
  autenticarToken,
  autorizarPerfil("admin"),
  atualizarUtilizador
);

// Desativar um utilizador — apenas administrador
router.delete(
  "/:id",
  autenticarToken,
  autorizarPerfil("admin"),
  eliminarUtilizador
);

export default router;

