import { Router } from "express";
import {
  listarUtilizadores,
  obterUtilizadorPorId
} from "../controllers/utilizadoresController.js";

const router = Router();

router.get("/", listarUtilizadores);
router.get("/:id", obterUtilizadorPorId);

export default router;
