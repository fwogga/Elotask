import { Router } from "express";

import {
  consultarHistorico,
  obterAlteracao
} from "../controllers/historicoController.js";

import { autenticarToken } from "../middlewares/autenticacaoMiddleware.js";

const router = Router();

router.use(autenticarToken);

// Consultar o histórico
router.get("/", consultarHistorico);

// Consultar uma alteração específica
router.get("/:id", obterAlteracao);

export default router;