import pool from "../config/database.js";

// Get /equipas
export async function listarEquipas(req, res) {
  try {
    const [equipas] = await pool.query(`
      SELECT
        e.id_equipa,
        e.nome,
        e.descricao,
        e.id_criador,
        e.data_criacao
      FROM equipas e
      ORDER BY e.data_criacao DESC
    `);

    return res.status(200).json({
      sucesso: true,
      total: equipas.length,
      equipas
    });

  } catch (error) {
    console.error("Erro ao listar equipas:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao consultar as equipas."
    });
  }
}
