import { Router } from "express";
import {
  listarUtilizadores,
  obterUtilizadorPorId,
  criarUtilizador
} from "../controllers/utilizadoresController.js";

const router = Router();

router.get("/", listarUtilizadores);
router.get("/:id", obterUtilizadorPorId);
router.post("/", criarUtilizador);

export default router;
