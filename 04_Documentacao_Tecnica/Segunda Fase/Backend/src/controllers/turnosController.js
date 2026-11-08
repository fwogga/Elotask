import pool from "../config/database.js";
import { registrarAlteracao } from "./historicoController.js";

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

    await registrarAlteracao({
  id_utilizador: req.utilizador.id,
  tipo_alteracao: "criacao_turno",
  descricao: `Criou o turno "${nome.trim()}" para o dia ${data_turno}.`
    });

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
  let conexao;

  try {
    const { id_turno } = req.params;
    const { nome, hora_inicio, hora_fim, data_turno, descricao } = req.body;

    // Validar os dados obrigatórios
    if (!nome || !hora_inicio || !hora_fim || !data_turno) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "É necessário preencher o nome, a data, a hora de início e a hora de fim."
      });
    }

    if (!Number.isInteger(Number(id_turno)) || Number(id_turno) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O identificador do turno é inválido."
      });
    }

    if (nome.length > 100) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O nome do turno não pode ultrapassar 100 caracteres."
      });
    }

    // Validar a data e as horas
    if (!validarData(data_turno)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data do turno é inválida. Utilize o formato AAAA-MM-DD."
      });
    }

    if (!validarHora(hora_inicio) || !validarHora(hora_fim)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "As horas devem estar no formato HH:MM."
      });
    }

    if (hora_inicio === hora_fim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A hora de início e a hora de fim não podem ser iguais."
      });
    }

    // Obter uma ligação individual à base de dados
    conexao = await pool.getConnection();

    // Iniciar a transação
    await conexao.beginTransaction();

    // Obter o bloqueio central das operações de turnos
    await conexao.query(
      `SELECT id
       FROM controlo_concorrencia_turnos
       WHERE id = 1
       FOR UPDATE`
    );

    // 6. Verificar se o turno existe e está ativo
    const [turnos] = await conexao.query(
      `SELECT id_turno
       FROM turnos
       WHERE id_turno = ?
       AND estado_registo = 'ativo'
       FOR UPDATE`,
      [id_turno]
    );

    if (turnos.length === 0) {
      await conexao.rollback();

      return res.status(404).json({
        sucesso: false,
        mensagem: "Turno não encontrado ou inativo."
      });
    }

    // Verificar se existem colaboradores atribuídos
    // a este turno e se algum tem outro turno sobreposto
    const [turnosSobrepostos] = await conexao.query(
      `SELECT
         tc.id_utilizador,
         t.id_turno,
         t.nome,
         t.data_turno,
         t.hora_inicio,
         t.hora_fim
       FROM turno_colaboradores tc
       INNER JOIN turnos t
         ON tc.id_turno = t.id_turno
       WHERE tc.id_turno <> ?
       AND tc.estado IN ('atribuido', 'confirmado')
       AND t.estado_registo = 'ativo'

       AND tc.id_utilizador IN (
         SELECT id_utilizador
         FROM turno_colaboradores
         WHERE id_turno = ?
         AND estado IN ('atribuido', 'confirmado')
       )

       AND TIMESTAMP(t.data_turno, t.hora_inicio) <
           TIMESTAMP(
             DATE_ADD(
               ?,
               INTERVAL IF(? <= ?, 1, 0) DAY
             ),
             ?
           )

       AND DATE_ADD(
             TIMESTAMP(t.data_turno, t.hora_fim),
             INTERVAL IF(t.hora_fim <= t.hora_inicio, 1, 0) DAY
           ) > TIMESTAMP(?, ?)

       LIMIT 1`,
      [
        id_turno,
        id_turno,
        data_turno,
        hora_fim,
        hora_inicio,
        hora_fim,
        data_turno,
        hora_inicio
      ]
    );

    if (turnosSobrepostos.length > 0) {
      await conexao.rollback();

      return res.status(409).json({
        sucesso: false,
        mensagem: "Não é possível alterar o turno porque existe um conflito de horário com outro turno de um dos colaboradores atribuídos.",
        turno_conflito: turnosSobrepostos[0]
      });
    }

    // Atualizar o turno
    await conexao.query(
      `UPDATE turnos
       SET nome = ?,
           hora_inicio = ?,
           hora_fim = ?,
           data_turno = ?,
           descricao = ?
       WHERE id_turno = ?
       AND estado_registo = 'ativo'`,
      [
        nome,
        hora_inicio,
        hora_fim,
        data_turno,
        descricao || null,
        id_turno
      ]
    );

    // Confirmar a transação
    await conexao.commit();

    await registrarAlteracao({
  id_utilizador: req.utilizador.id,
  tipo_alteracao: "atualizacao_turno",
  descricao: `Atualizou o turno ${id_turno} (${nome}) para o dia ${data_turno}.`
    });

    return res.status(200).json({
      sucesso: true,
      mensagem: "Turno atualizado com sucesso."
    });

  } catch (error) {

    // Cancelar a transação em caso de erro
    if (conexao) {
      try {
        await conexao.rollback();
      } catch (erroRollback) {
        console.error("Erro ao cancelar a transação:", erroRollback);
      }
    }

    console.error("Erro ao atualizar turno:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao atualizar o turno."
    });

  } finally {

    // Libertar a ligação à base de dados
    if (conexao) {
      conexao.release();
    }
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

    await registrarAlteracao({
  id_utilizador: req.utilizador.id,
  tipo_alteracao: "eliminacao_turno",
  descricao: `Eliminou logicamente o turno ${id_turno}.`
    });

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

    await registrarAlteracao({
  id_utilizador: req.utilizador.id,
  tipo_alteracao: "reativacao_turno",
  descricao: `Reativou o turno ${id_turno}.`
    });

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