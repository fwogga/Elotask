import pool from "../../comunicacao/config/database.js";

// POST /projetos/:id/membros
export async function adicionarMembroProjeto(req, res) {
  try {
    const { id } = req.params;
    const { id_utilizador, funcao } = req.body;

    // Validar o ID do projeto
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto inválido."
      });
    }

    // Validar o ID do utilizador
    if (
      !Number.isInteger(Number(id_utilizador)) ||
      Number(id_utilizador) <= 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do utilizador inválido."
      });
    }

    // Verificar se o projeto existe
    const [projetos] = await pool.query(
      "SELECT id_projeto FROM projetos WHERE id_projeto = ?",
      [id]
    );

    if (projetos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Projeto não encontrado."
      });
    }

    // Verificar se o utilizador existe e está ativo
    const [utilizadores] = await pool.query(
      `SELECT id_utilizador
       FROM utilizadores
       WHERE id_utilizador = ? AND estado = 'ativo'`,
      [id_utilizador]
    );

    if (utilizadores.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Utilizador não encontrado ou inativo."
      });
    }

    // Verificar se já existe uma associação
    const [associacoes] = await pool.query(
      `SELECT estado
       FROM projeto_membros
       WHERE id_projeto = ? AND id_utilizador = ?`,
      [id, id_utilizador]
    );

    if (associacoes.length > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem: associacoes[0].estado === "ativo"
          ? "Este utilizador já pertence ao projeto."
          : "Este utilizador tem uma associação inativa. Deve ser reativada."
      });
    }

    // Adicionar o membro ao projeto
    await pool.query(
      `INSERT INTO projeto_membros
       (id_projeto, id_utilizador, funcao)
       VALUES (?, ?, ?)`,
      [id, id_utilizador, funcao || null]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Membro adicionado ao projeto com sucesso."
    });

  } catch (error) {
    console.error("Erro ao adicionar membro ao projeto:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao adicionar membro ao projeto."
    });
  }
}

// GET /projetos/:id/membros
export async function listarMembrosProjeto(req, res) {
  try {
    const { id } = req.params;

    // Validar o ID do projeto
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto inválido."
      });
    }

    // Verificar se o projeto existe
    const [projetos] = await pool.query(
      `SELECT id_projeto, nome
       FROM projetos
       WHERE id_projeto = ?`,
      [id]
    );

    if (projetos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Projeto não encontrado."
      });
    }

    // Consultar os membros ativos do projeto
    const [membros] = await pool.query(
      `SELECT
        u.id_utilizador,
        u.nome,
        u.email,
        u.tipo_utilizador,
        pm.funcao,
        pm.data_adicao
       FROM projeto_membros pm
       INNER JOIN utilizadores u
         ON pm.id_utilizador = u.id_utilizador
       WHERE pm.id_projeto = ?
         AND pm.estado = 'ativo'
         AND u.estado = 'ativo'
       ORDER BY u.nome ASC`,
      [id]
    );

    return res.status(200).json({
      sucesso: true,
      projeto: projetos[0],
      total_membros: membros.length,
      membros
    });

  } catch (error) {
    console.error("Erro ao listar membros do projeto:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar os membros do projeto."
    });
  }
}

// PUT /projetos/:id/membros/:id_utilizador
export async function atualizarFuncaoMembroProjeto(req, res) {
  try {
    const { id, id_utilizador } = req.params;
    const { funcao } = req.body;

    // Validar o ID do projeto
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto inválido."
      });
    }

    // Validar o ID do utilizador
    if (
      !Number.isInteger(Number(id_utilizador)) ||
      Number(id_utilizador) <= 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do utilizador inválido."
      });
    }

    // Validar a função
    if (typeof funcao !== "string" || !funcao.trim()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A função do membro é obrigatória."
      });
    }

    // Verificar se o membro pertence ao projeto e está ativo
    const [associacoes] = await pool.query(
      `SELECT id_projeto, id_utilizador
       FROM projeto_membros
       WHERE id_projeto = ?
         AND id_utilizador = ?
         AND estado = 'ativo'`,
      [id, id_utilizador]
    );

    if (associacoes.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Membro não encontrado neste projeto ou associação inativa."
      });
    }

    // Atualizar a função do membro
    await pool.query(
      `UPDATE projeto_membros
       SET funcao = ?
       WHERE id_projeto = ?
         AND id_utilizador = ?`,
      [funcao.trim(), id, id_utilizador]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Função do membro atualizada com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atualizar função do membro:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar a função do membro."
    });
  }
}

// DELETE /projetos/:id/membros/:id_utilizador
export async function removerMembroProjeto(req, res) {
  try {
    const { id, id_utilizador } = req.params;

    // Validar o ID do projeto
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto inválido."
      });
    }

    // Validar o ID do utilizador
    if (
      !Number.isInteger(Number(id_utilizador)) ||
      Number(id_utilizador) <= 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do utilizador inválido."
      });
    }

    // Verificar se a associação existe e está ativa
    const [associacoes] = await pool.query(
      `SELECT id_projeto, id_utilizador
       FROM projeto_membros
       WHERE id_projeto = ?
         AND id_utilizador = ?
         AND estado = 'ativo'`,
      [id, id_utilizador]
    );

    if (associacoes.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Membro não encontrado neste projeto ou já removido."
      });
    }

    // Desativar a associação
    await pool.query(
      `UPDATE projeto_membros
       SET estado = 'inativo'
       WHERE id_projeto = ?
         AND id_utilizador = ?`,
      [id, id_utilizador]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Membro removido do projeto com sucesso."
    });

  } catch (error) {
    console.error("Erro ao remover membro do projeto:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao remover membro do projeto."
    });
  }
}

// GET /projetos/:id/membros/inativos
export async function listarMembrosInativosProjeto(req, res) {
  try {
    const { id } = req.params;

    // Validar o ID do projeto
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto inválido."
      });
    }

    // Verificar se o projeto existe
    const [projetos] = await pool.query(
      `SELECT id_projeto, nome
       FROM projetos
       WHERE id_projeto = ?`,
      [id]
    );

    if (projetos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Projeto não encontrado."
      });
    }

    // Consultar os membros inativos
    const [membros] = await pool.query(
      `SELECT
        u.id_utilizador,
        u.nome,
        u.email,
        u.tipo_utilizador,
        u.estado AS estado_utilizador,
        pm.funcao,
        pm.data_adicao
       FROM projeto_membros pm
       INNER JOIN utilizadores u
         ON pm.id_utilizador = u.id_utilizador
       WHERE pm.id_projeto = ?
         AND pm.estado = 'inativo'
       ORDER BY u.nome ASC`,
      [id]
    );

    return res.status(200).json({
      sucesso: true,
      projeto: projetos[0],
      total_membros_inativos: membros.length,
      membros
    });

  } catch (error) {
    console.error("Erro ao listar membros inativos:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar os membros inativos do projeto."
    });
  }
}

// PUT /projetos/:id/membros/:id_utilizador/reativar
export async function reativarMembroProjeto(req, res) {
  try {
    const { id, id_utilizador } = req.params;

    // Validar o ID do projeto
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto inválido."
      });
    }

    // Validar o ID do utilizador
    if (
      !Number.isInteger(Number(id_utilizador)) ||
      Number(id_utilizador) <= 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do utilizador inválido."
      });
    }

    // Verificar se o projeto existe
    const [projetos] = await pool.query(
      `SELECT id_projeto
       FROM projetos
       WHERE id_projeto = ?`,
      [id]
    );

    if (projetos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Projeto não encontrado."
      });
    }

    // Verificar se o utilizador existe e está ativo
    const [utilizadores] = await pool.query(
      `SELECT id_utilizador
       FROM utilizadores
       WHERE id_utilizador = ?
         AND estado = 'ativo'`,
      [id_utilizador]
    );

    if (utilizadores.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Utilizador não encontrado ou inativo."
      });
    }

    // Verificar se existe uma associação inativa
    const [associacoes] = await pool.query(
      `SELECT estado
       FROM projeto_membros
       WHERE id_projeto = ?
         AND id_utilizador = ?`,
      [id, id_utilizador]
    );

    if (associacoes.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Este utilizador nunca foi associado ao projeto."
      });
    }

    if (associacoes[0].estado === "ativo") {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Este utilizador já está ativo no projeto."
      });
    }

    // Reativar a associação
    await pool.query(
      `UPDATE projeto_membros
       SET estado = 'ativo'
       WHERE id_projeto = ?
         AND id_utilizador = ?`,
      [id, id_utilizador]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Membro reativado no projeto com sucesso."
    });

  } catch (error) {
    console.error("Erro ao reativar membro do projeto:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao reativar membro do projeto."
    });
  }
}