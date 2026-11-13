import { Router } from "express";

import {
  listarUtilizadores,
  obterUtilizadorPorId,
  criarUtilizador,
  atualizarUtilizador,
  eliminarUtilizador,
  obterMeuPerfil,
  atualizarMeuPerfil
} from "../controllers/utilizadoresController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = Router();

// Todas as rotas exigem autenticação
router.use(autenticarToken);

// Consultar o próprio perfil — todos os utilizadores autenticados
router.get(
  "/meu-perfil",
  obterMeuPerfil
);

// Atualizar o próprio perfil — todos os utilizadores autenticados
router.patch(
  "/meu-perfil",
  atualizarMeuPerfil
);

// Consultar todos os utilizadores — apenas administrador
router.get(
  "/",
  autorizarPerfil("admin"),
  listarUtilizadores
);

// Consultar um utilizador pelo ID — apenas administrador
router.get(
  "/:id",
  autorizarPerfil("admin"),
  obterUtilizadorPorId
);

// Criar um utilizador — apenas administrador
router.post(
  "/",
  autorizarPerfil("admin"),
  criarUtilizador
);

// Atualizar um utilizador — apenas administrador
router.patch(
  "/:id",
  autorizarPerfil("admin"),
  atualizarUtilizador
);

// Desativar um utilizador — apenas administrador
router.delete(
  "/:id",
  autorizarPerfil("admin"),
  eliminarUtilizador
);

export default router;

