import { Router } from "express";
import {
  listarUtilizadores,
  obterUtilizadorPorId,
  criarUtilizador,
  atualizarUtilizador,
  eliminarUtilizador
} from "../controllers/utilizadoresController.js";
import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = Router();

//router.get("/", listarUtilizadores);
router.get(
  "/",
  autenticarToken,
  autorizarPerfil("admin"),
  listarUtilizadores
);
router.get("/:id", obterUtilizadorPorId);
router.post("/", criarUtilizador);
router.patch("/:id", atualizarUtilizador);
router.delete("/:id", eliminarUtilizador);

export default router;
