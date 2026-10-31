import pool from "../config/database.js";

// GET /equipas (ativas)
export async function listarEquipas(req, res) {
  try {
    const [equipas] = await pool.query(`
  SELECT
    e.id_equipa,
    e.nome,
    e.descricao,
    e.id_criador,
    e.data_criacao,
    e.estado
  FROM equipas e
  WHERE e.estado = 'ativa'
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


// PUT /equipas/:id
export async function atualizarEquipa(req, res) {
  try {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    // Validar o ID
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID da equipa inválido."
      });
    }

    // Validar o nome
    if (typeof nome !== "string" || !nome.trim()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O nome da equipa é obrigatório."
      });
    }

    // Verificar se a equipa existe
    const [equipas] = await pool.query(
      "SELECT id_equipa FROM equipas WHERE id_equipa = ?",
      [id]
    );

    if (equipas.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Equipa não encontrada."
      });
    }

    // Atualizar os dados da equipa
    await pool.query(
      `UPDATE equipas
       SET nome = ?, descricao = ?
       WHERE id_equipa = ?`,
      [
        nome.trim(),
        descricao?.trim() || null,
        id
      ]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Equipa atualizada com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atualizar equipa:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao atualizar a equipa."
    });
  }
}


 // DELETE /equipas/:id
export async function eliminarEquipa(req, res) {
  try {
    const { id } = req.params;

    // Validar o ID
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID da equipa inválido."
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
        mensagem: "Equipa não encontrada ou já se encontra inativa."
      });
    }

    // Alterar o estado da equipa para inativa
    await pool.query(
      `UPDATE equipas
       SET estado = 'inativa'
       WHERE id_equipa = ?`,
      [id]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Equipa desativada com sucesso."
    });

  } catch (error) {
    console.error("Erro ao eliminar equipa:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao eliminar a equipa."
    });
  }
}


 // GET /equipas (inativas)
export async function listarEquipasInativas(req, res) {
  try {
    const [equipas] = await pool.query(`
      SELECT
        e.id_equipa,
        e.nome,
        e.descricao,
        e.id_criador,
        e.data_criacao,
        e.estado
      FROM equipas e
      WHERE e.estado = 'inativa'
      ORDER BY e.data_criacao DESC
    `);

    return res.status(200).json({
      sucesso: true,
      total: equipas.length,
      equipas
    });

  } catch (error) {
    console.error("Erro ao listar equipas inativas:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao consultar equipas inativas."
    });
  }
}


 // Reativar uma equipa
export async function reativarEquipa(req, res) {
  try {
    const { id } = req.params;

    // Validar o ID
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID da equipa inválido."
      });
    }

    // Verificar se a equipa existe e está inativa
    const [equipas] = await pool.query(
      `SELECT id_equipa
       FROM equipas
       WHERE id_equipa = ? AND estado = 'inativa'`,
      [id]
    );

    if (equipas.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Equipa não encontrada ou já se encontra ativa."
      });
    }

    // Alterar o estado para ativa
    await pool.query(
      `UPDATE equipas
       SET estado = 'ativa'
       WHERE id_equipa = ?`,
      [id]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Equipa reativada com sucesso."
    });

  } catch (error) {
    console.error("Erro ao reativar equipa:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao reativar a equipa."
    });
  }
}
