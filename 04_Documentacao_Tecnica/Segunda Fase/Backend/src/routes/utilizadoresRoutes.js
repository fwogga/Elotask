import { Router } from "express";
import {
  listarUtilizadores,
  obterUtilizadorPorId,
  criarUtilizador,
  atualizarUtilizador,
  eliminarUtilizador
} from "../controllers/utilizadoresController.js";

const router = Router();

router.get("/", listarUtilizadores);
router.get("/:id", obterUtilizadorPorId);
router.post("/", criarUtilizador);
router.patch("/:id", atualizarUtilizador);
router.delete("/:id", eliminarUtilizador);

export default router;
