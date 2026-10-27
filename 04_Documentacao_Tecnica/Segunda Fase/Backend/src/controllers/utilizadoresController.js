
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
