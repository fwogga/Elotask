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


// POST /equipas
export async function criarEquipa(req, res) {
  try {
    const { nome, descricao } = req.body;

    // Validar o nome da equipa
    if (typeof nome !== "string" || !nome.trim()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O nome da equipa é obrigatório."
      });
    }

    // Obter o ID do utilizador autenticado através do token JWT
    const idCriador = req.utilizador.id;

    // Inserir a nova equipa na base de dados
    const [resultado] = await pool.query(
      `INSERT INTO equipas (nome, descricao, id_criador)
       VALUES (?, ?, ?)`,
      [nome.trim(), descricao?.trim() || null, idCriador]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Equipa criada com sucesso.",
      equipa: {
        id_equipa: resultado.insertId,
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        id_criador: idCriador
      }
    });

  } catch (error) {
    console.error("Erro ao criar equipa:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao criar a equipa."
    });
  }
}

