import express from "express";

import {
  criarPedido,
  listarMeusPedidos,
  listarTodosPedidos,
  obterPedido,
  decidirPedido,
  cancelarPedido,
  inativarPedido,
  listarPedidosInativos,
  reativarPedido
} from "../controllers/pedidosAusenciaController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(autenticarToken);

// Criar pedido
router.post("/", criarPedido);

// Consultar os próprios pedidos
router.get("/meus", listarMeusPedidos);

// Consultar todos os pedidos
router.get(
  "/",
  autorizarPerfil("admin", "gestor"),
  listarTodosPedidos
);

// Consultar pedidos inativos
router.get(
  "/inativos",
  autorizarPerfil("admin", "gestor"),
  listarPedidosInativos
);

// Aprovar ou rejeitar
router.put(
  "/:id/decisao",
  autorizarPerfil("admin", "gestor"),
  decidirPedido
);

// Cancelar pedido
router.put("/:id/cancelar", cancelarPedido);

// Inativar registo
router.put(
  "/:id/inativar",
  autorizarPerfil("admin", "gestor"),
  inativarPedido
);

// Reativar registo
router.put(
  "/:id/reativar",
  autorizarPerfil("admin", "gestor"),
  reativarPedido
);

// Consultar pedido específico
router.get("/:id", obterPedido);

export default router;