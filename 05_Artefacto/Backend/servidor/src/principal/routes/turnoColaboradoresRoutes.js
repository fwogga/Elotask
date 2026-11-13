import express from "express";

import {
  atribuirColaboradorTurno,
  listarColaboradoresTurno,
  atualizarEstadoAtribuicao,
  listarTurnosColaborador
} from "../controllers/turnoColaboradoresController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

// Atribuir colaborador a um turno
router.post(
  "/:id_turno/colaboradores",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  atribuirColaboradorTurno
);

// Listar colaboradores de um turno
router.get(
  "/:id_turno/colaboradores",
  autenticarToken,
  listarColaboradoresTurno
);

// Alterar estado de uma atribuição
router.put(
  "/:id_turno/colaboradores/:id_utilizador/estado",
  autenticarToken,
  atualizarEstadoAtribuicao
);

// Consultar turnos de um colaborador
router.get(
  "/colaboradores/:id_utilizador/turnos",
  autenticarToken,
  listarTurnosColaborador
);

export default router;