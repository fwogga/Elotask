
import { Router } from "express";

import {
  adicionarMembroEquipa,
  listarMembrosEquipa,
  removerMembroEquipa,
  reativarMembroEquipa,
  listarMembrosInativosEquipa,
  atualizarFuncaoMembro
} from "../controllers/membrosEquipaController.js";

import {
  autenticarToken,
  autorizarPerfil
} from "../middlewares/autenticacaoMiddleware.js";

const router = Router();

// Adicionar um membro a uma equipa
router.post(
  "/:id/membros",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  adicionarMembroEquipa
);

// Listar membros da equipa
router.get(
  "/:id/membros",
  autenticarToken,
  autorizarPerfil("admin", "gestor", "colaborador"),
  listarMembrosEquipa
);

// Remover membro da equipa
router.delete(
  "/:id/membros/:id_utilizador",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  removerMembroEquipa
);

// Reativar membro da equipa
router.put(
  "/:id/membros/:id_utilizador/reativar",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  reativarMembroEquipa
);

// Listar membros inativos da equipa
router.get(
  "/:id/membros/inativos",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  listarMembrosInativosEquipa
);

// Atualizar a função do membro da equipa
router.put(
  "/:id/membros/:id_utilizador",
  autenticarToken,
  autorizarPerfil("admin", "gestor"),
  atualizarFuncaoMembro
);
export default router;
