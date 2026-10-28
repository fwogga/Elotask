
import pool from "../config/database.js";

export async function listarUtilizadores(req, res) {
  try {
    const [utilizadores] = await pool.query(`
      SELECT
        id_utilizador,
        nome,
        email,
        tipo_utilizador,
        telefone,
        foto_perfil,
        cargo,
        estado,
        data_criacao
      FROM utilizadores
      ORDER BY id_utilizador
    `);

    return res.status(200).json({
      sucesso: true,
      total: utilizadores.length,
      dados: utilizadores
    });
  } catch (error) {
    console.error("Erro ao listar utilizadores:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao consultar os utilizadores."
    });
  }
}

export async function obterUtilizadorPorId(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O ID do utilizador é inválido."
      });
    }

    const [utilizadores] = await pool.query(
      `SELECT
        id_utilizador,
        nome,
        email,
        tipo_utilizador,
        telefone,
        foto_perfil,
        cargo,
        estado,
        data_criacao
      FROM utilizadores
      WHERE id_utilizador = ?`,
      [id]
    );

    if (utilizadores.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Utilizador não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      dados: utilizadores[0]
    });
  } catch (error) {
    console.error("Erro ao consultar utilizador:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao consultar o utilizador."
    });
  }
}
