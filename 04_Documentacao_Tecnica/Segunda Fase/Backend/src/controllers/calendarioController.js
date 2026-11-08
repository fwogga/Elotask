import pool from "../config/database.js";

// Criar um evento manual no calendário
export async function criarEvento(req, res) {
  try {
    const { titulo, descricao, data_inicio, data_fim, tipo_evento } = req.body;
    const id_criador = req.utilizador.id;

    if (!titulo || !data_inicio || !data_fim || !tipo_evento) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Preenche o título, as datas e o tipo de evento."
      });
    }

    if (new Date(data_fim) < new Date(data_inicio)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de fim não pode ser anterior à data de início."
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO eventos_calendario
       (id_criador, titulo, descricao, data_inicio, data_fim, tipo_evento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id_criador,
        titulo,
        descricao || null,
        data_inicio,
        data_fim,
        tipo_evento
      ]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Evento criado com sucesso.",
      id_evento: resultado.insertId
    });
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar evento."
    });
  }
}

// Consultar calendário: eventos, tarefas e turnos
export async function consultarCalendario(req, res) {
  try {
    const id_utilizador = req.utilizador.id;
    const { data_inicio, data_fim } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Indica a data_inicio e a data_fim para consultar o calendário."
      });
    }

    if (data_fim < data_inicio) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data final não pode ser anterior à data inicial."
      });
    }

    const [eventos] = await pool.query(
      `SELECT
         id_evento AS id,
         titulo,
         descricao,
         data_inicio,
         data_fim,
         tipo_evento AS tipo,
         'evento' AS origem
       FROM eventos_calendario
       WHERE data_inicio < DATE_ADD(?, INTERVAL 1 DAY)
         AND data_fim >= ?
       ORDER BY data_inicio`,
      [data_fim, data_inicio]
    );

    const [tarefas] = await pool.query(
      `SELECT DISTINCT
         t.id_tarefa AS id,
         t.titulo,
         t.descricao,
         COALESCE(t.data_inicio, t.prazo) AS data_inicio,
         t.prazo AS data_fim,
         t.estado AS tipo,
         'tarefa' AS origem
       FROM tarefas t
       INNER JOIN tarefa_responsaveis tr
         ON tr.id_tarefa = t.id_tarefa
       WHERE tr.id_utilizador = ?
         AND t.estado_registo = 'ativo'
         AND (
           (t.data_inicio BETWEEN ? AND ?)
           OR (t.prazo BETWEEN ? AND ?)
         )
       ORDER BY data_inicio`,
      [id_utilizador, data_inicio, data_fim, data_inicio, data_fim]
    );

    const [turnos] = await pool.query(
      `SELECT
         tu.id_turno AS id,
         tu.nome AS titulo,
         tu.descricao,
         CONCAT(tu.data_turno, ' ', tu.hora_inicio) AS data_inicio,
         CONCAT(tu.data_turno, ' ', tu.hora_fim) AS data_fim,
         tc.estado AS tipo,
         'turno' AS origem
       FROM turnos tu
       INNER JOIN turno_colaboradores tc
         ON tc.id_turno = tu.id_turno
       WHERE tc.id_utilizador = ?
         AND tc.estado IN ('atribuido', 'confirmado')
         AND tu.estado_registo = 'ativo'
         AND tu.data_turno BETWEEN ? AND ?
       ORDER BY tu.data_turno, tu.hora_inicio`,
      [id_utilizador, data_inicio, data_fim]
    );

    const calendario = [...eventos, ...tarefas, ...turnos].sort(
      (a, b) => new Date(a.data_inicio) - new Date(b.data_inicio)
    );

    return res.status(200).json({
      sucesso: true,
      total: calendario.length,
      calendario
    });
  } catch (error) {
    console.error("Erro ao consultar calendário:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar o calendário."
    });
  }
}

// Consultar um evento específico
export async function obterEvento(req, res) {
  try {
    const { id } = req.params;

    const [eventos] = await pool.query(
      `SELECT * FROM eventos_calendario WHERE id_evento = ?`,
      [id]
    );

    if (eventos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Evento não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      evento: eventos[0]
    });
  } catch (error) {
    console.error("Erro ao consultar evento:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar evento."
    });
  }
}

// Atualizar um evento
export async function atualizarEvento(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descricao, data_inicio, data_fim, tipo_evento } = req.body;
    const id_utilizador = req.utilizador.id;
    const perfil = req.utilizador.perfil;

    if (!titulo || !data_inicio || !data_fim || !tipo_evento) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Preenche todos os campos obrigatórios."
      });
    }

    if (new Date(data_fim) < new Date(data_inicio)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de fim não pode ser anterior à data de início."
      });
    }

    const [resultado] = await pool.query(
      `UPDATE eventos_calendario
       SET titulo = ?, descricao = ?, data_inicio = ?,
           data_fim = ?, tipo_evento = ?
       WHERE id_evento = ?
         AND (id_criador = ? OR ? IN ('admin', 'gestor'))`,
      [
        titulo,
        descricao || null,
        data_inicio,
        data_fim,
        tipo_evento,
        id,
        id_utilizador,
        perfil
      ]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Evento não encontrado ou sem permissão para o alterar."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Evento atualizado com sucesso."
    });
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar evento."
    });
  }
}

// Eliminar um evento
export async function eliminarEvento(req, res) {
  try {
    const { id } = req.params;
    const id_utilizador = req.utilizador.id;
    const perfil = req.utilizador.perfil;

    const [resultado] = await pool.query(
      `DELETE FROM eventos_calendario
       WHERE id_evento = ?
         AND (id_criador = ? OR ? IN ('admin', 'gestor'))`,
      [id, id_utilizador, perfil]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Evento não encontrado ou sem permissão para o eliminar."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Evento eliminado com sucesso."
    });
  } catch (error) {
    console.error("Erro ao eliminar evento:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao eliminar evento."
    });
  }
}
