import { Router } from "express";

import {
  criarEvento,
  consultarCalendario,
  obterEvento,
  atualizarEvento,
  eliminarEvento,
  listarEventosInativos,
  reativarEvento
} from "../controllers/calendarioController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = Router();

router.use(autenticarToken);

// Consultar calendário
router.get("/", consultarCalendario);

// Eventos inativos (antes da rota com :id)
router.get(
  "/eventos/inativos",
  autorizarPerfil("admin", "gestor"),
  listarEventosInativos
);

// Criar evento
router.post("/eventos", criarEvento);

// Consultar evento
router.get("/eventos/:id", obterEvento);

// Atualizar evento
router.put("/eventos/:id", atualizarEvento);

// Eliminar evento logicamente
router.delete("/eventos/:id", eliminarEvento);

// Reativar evento
router.patch(
  "/eventos/:id/reativar",
  autorizarPerfil("admin", "gestor"),
  reativarEvento
);

export default router;