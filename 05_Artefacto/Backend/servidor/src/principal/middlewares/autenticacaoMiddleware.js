import { identificarUtilizador } from "../../comunicacao/middleware/auth.js";
import pool from "../../comunicacao/config/database.js";

// Verifica o token (o mesmo login serve a API toda) e guarda quem fez o pedido
export async function autenticarToken(req, res, next) {
  try {
    const cabecalho = req.headers.authorization || "";
    const utilizador = await identificarUtilizador({
      token: cabecalho.startsWith("Bearer ") ? cabecalho.slice(7).trim() : null,
      devUserId: req.headers["x-user-id"]
    });

    req.utilizador = {
      id: utilizador.id,
      perfil: utilizador.tipo,
      nome: utilizador.nome,
      email: utilizador.email
    };

    next();
  } catch (error) {
    return res.status(401).json({
      sucesso: false,
      mensagem: error.message || "Token inválido ou expirado."
    });
  }
}


// "gestor" depende do contexto da rota:
//  - num projeto (/projetos/:id...) é quem criou esse projeto;
//  - numa equipa (/equipas/:id...) é quem criou essa equipa;
//  - criar um projeto ou uma equipa está aberto a todos (quem cria fica gestor);
//  - no resto (turnos, ausências, trocas) é quem criou pelo menos uma equipa.
async function eGestor(req) {
  const eu = req.utilizador.id;

  if (req.method === "POST" && req.path === "/" && ["/projetos", "/equipas"].includes(req.baseUrl)) {
    return true;
  }

  if (req.baseUrl === "/projetos") {
    const [linhas] = await pool.query(
      "SELECT 1 FROM projetos WHERE id_projeto = ? AND id_criador = ?",
      [req.params.id_projeto ?? req.params.id, eu]
    );
    return linhas.length > 0;
  }

  if (req.baseUrl === "/equipas") {
    const [linhas] = await pool.query(
      "SELECT 1 FROM equipas WHERE id_equipa = ? AND id_criador = ?",
      [req.params.id_equipa ?? req.params.id, eu]
    );
    return linhas.length > 0;
  }

  const [linhas] = await pool.query("SELECT 1 FROM equipas WHERE id_criador = ? LIMIT 1", [eu]);
  return linhas.length > 0;
}


// Verifica se quem fez o pedido pode usar a rota.
// "admin" só serve para as rotas exclusivas de administração (ex.: gerir contas);
// dentro dos projetos e equipas quem manda é o gestor.
export function autorizarPerfil(...perfisPermitidos) {
  return async (req, res, next) => {

    if (!req.utilizador) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "É necessário realizar a autenticação."
      });
    }

    try {
      if (perfisPermitidos.includes("colaborador")) {
        return next();
      }

      if (perfisPermitidos.includes("gestor") && await eGestor(req)) {
        return next();
      }

      if (!perfisPermitidos.includes("gestor") && perfisPermitidos.includes(req.utilizador.perfil)) {
        return next();
      }
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao verificar as permissões."
      });
    }

    return res.status(403).json({
      sucesso: false,
      mensagem: perfisPermitidos.includes("gestor")
        ? "Só o gestor (quem criou o projeto ou a equipa) pode fazer esta operação."
        : "Só o administrador pode fazer esta operação."
    });
  };
}
