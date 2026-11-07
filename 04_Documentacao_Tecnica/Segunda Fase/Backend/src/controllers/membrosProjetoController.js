import pool from "../config/database.js";

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