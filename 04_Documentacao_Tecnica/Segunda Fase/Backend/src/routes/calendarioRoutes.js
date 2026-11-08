import { Router } from "express";

import {
  criarEvento,
  consultarCalendario,
  obterEvento,
  atualizarEvento,
  eliminarEvento
} from "../controllers/calendarioController.js";

import { autenticarToken } from "../middlewares/autenticacaoMiddleware.js";

const router = Router();

router.use(autenticarToken);

// Consultar os eventos, tarefas e turnos do calendário
router.get("/", consultarCalendario);

// Criar um evento
router.post("/eventos", criarEvento);

// Consultar um evento específico
router.get("/eventos/:id", obterEvento);

// Atualizar um evento
router.put("/eventos/:id", atualizarEvento);

// Eliminar um evento
router.delete("/eventos/:id", eliminarEvento);

export default router;
