import { Router } from "express";
import { listarUtilizadores } from "../controllers/utilizadoresController.js";

const router = Router();

router.get("/", listarUtilizadores);

export default router;
