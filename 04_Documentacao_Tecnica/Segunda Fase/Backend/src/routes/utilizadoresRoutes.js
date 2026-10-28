import { Router } from "express";
import {
  listarUtilizadores,
  obterUtilizadorPorId,
  criarUtilizador,
  atualizarUtilizador
} from "../controllers/utilizadoresController.js";

const router = Router();

router.get("/", listarUtilizadores);
router.get("/:id", obterUtilizadorPorId);
router.post("/", criarUtilizador);
router.patch("/:id", atualizarUtilizador);

export default router;
