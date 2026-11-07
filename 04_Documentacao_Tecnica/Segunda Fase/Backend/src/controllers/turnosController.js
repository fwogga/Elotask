import pool from "../config/database.js";

// Validar formato da data (AAAA-MM-DD)
function validarData(data) {
  return /^\d{4}-\d{2}-\d{2}$/.test(data) &&
    !Number.isNaN(Date.parse(`${data}T00:00:00`));
}

// Validar formato da hora (HH:MM)
function validarHora(hora) {
  return typeof hora === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}


// Criar turno
export async function criarTurno(req, res) {
  try {
    const { nome, hora_inicio, hora_fim, data_turno, descricao } = req.body;

    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O nome do turno é obrigatório."
      });
    }

    if (nome.trim().length > 100) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O nome não pode ultrapassar 100 caracteres."
      });
    }

    if (!validarHora(hora_inicio) || !validarHora(hora_fim)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Indica horas válidas no formato HH:MM."
      });
    }

    if (hora_inicio === hora_fim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A hora de início e de fim não podem ser iguais."
      });
    }

    if (!data_turno || !validarData(data_turno)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Indica uma data válida no formato AAAA-MM-DD."
      });
    }

    if (descricao !== undefined && descricao !== null &&
        typeof descricao !== "string") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A descrição deve ser um texto."
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO turnos
       (nome, hora_inicio, hora_fim, data_turno, descricao)
       VALUES (?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        hora_inicio,
        hora_fim,
        data_turno,
        descricao?.trim() || null
      ]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Turno criado com sucesso.",
      id_turno: resultado.insertId
    });

  } catch (error) {
    console.error("Erro ao criar turno:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar turno."
    });
  }
}


// Listar turnos ativos
export async function listarTurnos(req, res) {
  try {
    const [turnos] = await pool.query(
      `SELECT id_turno, nome, hora_inicio, hora_fim,
              data_turno, descricao
       FROM turnos
       WHERE estado_registo = 'ativo'
       ORDER BY data_turno ASC, hora_inicio ASC`
    );

    return res.status(200).json({
      sucesso: true,
      total: turnos.length,
      turnos
    });

  } catch (error) {
    console.error("Erro ao listar turnos:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar turnos."
    });
  }
}


// Consultar um turno específico
export async function obterTurnoPorId(req, res) {
  try {
    const { id_turno } = req.params;

    const [turnos] = await pool.query(
      `SELECT id_turno, nome, hora_inicio, hora_fim,
              data_turno, descricao
       FROM turnos
       WHERE id_turno = ?
       AND estado_registo = 'ativo'`,
      [id_turno]
    );

    if (turnos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Turno não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      turno: turnos[0]
    });

  } catch (error) {
    console.error("Erro ao consultar turno:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar turno."
    });
  }
}


// Atualizar turno
export async function atualizarTurno(req, res) {
  try {
    const { id_turno } = req.params;
    const { nome, hora_inicio, hora_fim, data_turno, descricao } = req.body;

    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O nome do turno é obrigatório."
      });
    }

    if (nome.trim().length > 100) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O nome não pode ultrapassar 100 caracteres."
      });
    }

    if (!validarHora(hora_inicio) || !validarHora(hora_fim)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Indica horas válidas no formato HH:MM."
      });
    }

    if (hora_inicio === hora_fim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A hora de início e de fim não podem ser iguais."
      });
    }

    if (!validarData(data_turno)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Indica uma data válida no formato AAAA-MM-DD."
      });
    }

    if (descricao !== undefined && descricao !== null &&
        typeof descricao !== "string") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A descrição deve ser um texto."
      });
    }

    const [resultado] = await pool.query(
      `UPDATE turnos
       SET nome = ?,
           hora_inicio = ?,
           hora_fim = ?,
           data_turno = ?,
           descricao = ?
       WHERE id_turno = ?
       AND estado_registo = 'ativo'`,
      [
        nome.trim(),
        hora_inicio,
        hora_fim,
        data_turno,
        descricao?.trim() || null,
        id_turno
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Turno não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Turno atualizado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atualizar turno:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar turno."
    });
  }
}


// Eliminar turno logicamente
export async function eliminarTurno(req, res) {
  try {
    const { id_turno } = req.params;

    const [resultado] = await pool.query(
      `UPDATE turnos
       SET estado_registo = 'inativo'
       WHERE id_turno = ?
       AND estado_registo = 'ativo'`,
      [id_turno]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Turno não encontrado ou já inativo."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Turno eliminado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao eliminar turno:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao eliminar turno."
    });
  }
}


// Listar turnos inativos
export async function listarTurnosInativos(req, res) {
  try {
    const [turnos] = await pool.query(
      `SELECT id_turno, nome, hora_inicio, hora_fim,
              data_turno, descricao
       FROM turnos
       WHERE estado_registo = 'inativo'
       ORDER BY data_turno DESC`
    );

    return res.status(200).json({
      sucesso: true,
      total: turnos.length,
      turnos
    });

  } catch (error) {
    console.error("Erro ao listar turnos inativos:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar turnos inativos."
    });
  }
}


// Reativar turno
export async function reativarTurno(req, res) {
  try {
    const { id_turno } = req.params;

    const [resultado] = await pool.query(
      `UPDATE turnos
       SET estado_registo = 'ativo'
       WHERE id_turno = ?
       AND estado_registo = 'inativo'`,
      [id_turno]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Turno inativo não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Turno reativado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao reativar turno:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao reativar turno."
    });
  }
}