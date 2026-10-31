import pool from "../config/database.js";

// POST /:id/membros
export async function adicionarMembroEquipa(req, res) {
  try {
    const { id } = req.params;
    const { id_utilizador, funcao } = req.body;

    // Validar o ID da equipa
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID da equipa inválido."
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

    // Verificar se a equipa existe e está ativa
    const [equipas] = await pool.query(
      `SELECT id_equipa
       FROM equipas
       WHERE id_equipa = ? AND estado = 'ativa'`,
      [id]
    );

    if (equipas.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Equipa não encontrada ou inativa."
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

    // Verificar se o utilizador já pertence à equipa
    const [membros] = await pool.query(
      `SELECT id_utilizador
       FROM membros_equipa
       WHERE id_equipa = ? AND id_utilizador = ?`,
      [id, id_utilizador]
    );

    if (membros.length > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Este utilizador já pertence à equipa."
      });
    }

    // Adicionar o membro
    await pool.query(
      `INSERT INTO membros_equipa
       (id_equipa, id_utilizador, funcao)
       VALUES (?, ?, ?)`,
      [id, id_utilizador, funcao || null]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Membro adicionado à equipa com sucesso."
    });

  } catch (error) {
    console.error("Erro ao adicionar membro à equipa:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao adicionar membro à equipa."
    });
  }
}
