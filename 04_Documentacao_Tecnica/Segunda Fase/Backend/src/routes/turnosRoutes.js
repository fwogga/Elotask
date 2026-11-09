import express from "express";

import {
  criarTurno,
  listarTurnos,
  obterTurnoPorId,
  atualizarTurno,
  eliminarTurno,
  listarTurnosInativos,
  reativarTurno,
  definirDisponibilidade,
  obterDisponibilidade
} from "../controllers/turnosController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

// Criar turno
router.post(
  "/",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  criarTurno
);

// Listar turnos ativos
router.get(
  "/",
  autenticarToken,
  listarTurnos
);

// Listar turnos inativos
router.get(
  "/inativos",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  listarTurnosInativos
);

// Consultar turno específico
router.get(
  "/:id_turno",
  autenticarToken,
  obterTurnoPorId
);

// Atualizar turno
router.put(
  "/:id_turno",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  atualizarTurno
);

// Eliminar turno
router.delete(
  "/:id_turno",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  eliminarTurno
);

// Reativar turno
router.put(
  "/:id_turno/reativar",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  reativarTurno
);

// Definir disponibilidade de um colaborador
router.put(
  "/disponibilidade/:id_utilizador",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  definirDisponibilidade
);

// Consultar disponibilidade de um colaborador
router.get(
  "/disponibilidade/:id_utilizador",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  obterDisponibilidade
);

export default router;