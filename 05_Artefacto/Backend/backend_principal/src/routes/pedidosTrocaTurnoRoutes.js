import { Router } from "express";

import {
  criarPedidoTroca,
  listarMeusPedidosTroca,
  responderPedidoTroca,
  cancelarPedidoTroca,
  listarPedidosParaAprovacao,
  decidirPedidoTroca
} from "../controllers/pedidosTrocaTurnoController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = Router();

router.use(autenticarToken);

// Criar pedido de troca
router.post("/", criarPedidoTroca);

// Consultar pedidos enviados e recebidos
router.get("/meus-pedidos", listarMeusPedidosTroca);

// Aceitar ou recusar pedido — destinatário
router.patch("/:id/responder", responderPedidoTroca);

// Cancelar pedido — solicitante
router.patch("/:id/cancelar", cancelarPedidoTroca);

// Consultar pedidos que aguardam aprovação
router.get(
  "/aprovacoes",
  autorizarPerfil("admin", "gestor"),
  listarPedidosParaAprovacao
);

// Aprovar ou rejeitar pedido — gestor ou administrador
router.patch(
  "/:id/decidir",
  autorizarPerfil("admin", "gestor"),
  decidirPedidoTroca
);

export default router;