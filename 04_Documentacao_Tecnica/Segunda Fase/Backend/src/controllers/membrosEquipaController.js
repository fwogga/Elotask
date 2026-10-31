import pool from "../config/database.js";

// POST equipas/:id/membros
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

// GET equipas/:id/membros
export async function listarMembrosEquipa(req, res) {
  try {
    const { id } = req.params;

    // Validar o ID da equipa
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID da equipa inválido."
      });
    }

    // Verificar se a equipa existe e está ativa
    const [equipas] = await pool.query(
      `SELECT id_equipa, nome
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

    // Consultar os membros da equipa
    const [membros] = await pool.query(
      `SELECT
         u.id_utilizador,
         u.nome,
         u.email,
         u.tipo_utilizador,
         u.cargo,
         me.funcao,
         me.data_entrada
       FROM membros_equipa me
       INNER JOIN utilizadores u
         ON me.id_utilizador = u.id_utilizador
       WHERE me.id_equipa = ?
        AND me.estado = 'ativo'
        AND u.estado = 'ativo'
       ORDER BY u.nome ASC`,
      [id]
    );

    return res.status(200).json({
      sucesso: true,
      equipa: equipas[0],
      total_membros: membros.length,
      membros
    });

  } catch (error) {
    console.error("Erro ao listar membros da equipa:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao listar membros da equipa."
    });
  }
}

// DELETE /equipas/:id/membros/:id_utilizador
export async function removerMembroEquipa(req, res) {
  try {
    const { id, id_utilizador } = req.params;

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

    // Verificar se o membro pertence atualmente à equipa
    const [membros] = await pool.query(
      `SELECT id_utilizador
       FROM membros_equipa
       WHERE id_equipa = ?
         AND id_utilizador = ?
         AND estado = 'ativo'`,
      [id, id_utilizador]
    );

    if (membros.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Membro não encontrado nesta equipa ou já removido."
      });
    }

    // Desativar a associação do membro à equipa
    await pool.query(
      `UPDATE membros_equipa
       SET estado = 'inativo'
       WHERE id_equipa = ?
         AND id_utilizador = ?`,
      [id, id_utilizador]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Membro removido da equipa com sucesso."
    });

  } catch (error) {
    console.error("Erro ao remover membro da equipa:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao remover membro da equipa."
    });
  }
}

// PUT /equipas/:id/membros/:id_utilizador/reativar
export async function reativarMembroEquipa(req, res) {
  try {
    const { id, id_utilizador } = req.params;

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

    // Verificar se existe uma associação inativa
    const [membros] = await pool.query(
      `SELECT id_utilizador
       FROM membros_equipa
       WHERE id_equipa = ?
         AND id_utilizador = ?
         AND estado = 'inativo'`,
      [id, id_utilizador]
    );

    if (membros.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Associação inativa não encontrada."
      });
    }

    // Reativar a associação
    await pool.query(
      `UPDATE membros_equipa
       SET estado = 'ativo'
       WHERE id_equipa = ?
         AND id_utilizador = ?`,
      [id, id_utilizador]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Membro reativado na equipa com sucesso."
    });

  } catch (error) {
    console.error("Erro ao reativar membro:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao reativar membro."
    });
  }
}