import pool from "../config/database.js";

function validarData(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const dataConvertida = new Date(`${data}T00:00:00Z`);

  return !Number.isNaN(dataConvertida.getTime()) &&
    dataConvertida.toISOString().slice(0, 10) === data;
}

// Criar pedido de férias ou ausência
export async function criarPedido(req, res) {
  const {
    tipo_ausencia,
    data_inicio,
    data_fim,
    motivo
  } = req.body;

  const idUtilizador = req.utilizador.id;

  try {
    const tiposPermitidos = ["ferias", "folga", "outra"];

    if (!tiposPermitidos.includes(tipo_ausencia)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Tipo de ausência inválido."
      });
    }

    if (!validarData(data_inicio) || !validarData(data_fim)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "As datas fornecidas são inválidas."
      });
    }

    if (data_inicio > data_fim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de início não pode ser posterior à data de fim."
      });
    }

    const ligacao = await pool.getConnection();

    try {
      await ligacao.beginTransaction();

      // Bloqueia temporariamente o utilizador para evitar
      // pedidos sobrepostos criados em simultâneo.
      const [utilizadores] = await ligacao.execute(
        `SELECT id_utilizador
         FROM utilizadores
         WHERE id_utilizador = ?
         FOR UPDATE`,
        [idUtilizador]
      );

      if (utilizadores.length === 0) {
        await ligacao.rollback();

        return res.status(404).json({
          sucesso: false,
          mensagem: "Utilizador não encontrado."
        });
      }

      const [pedidosExistentes] = await ligacao.execute(
        `SELECT id_pedido
         FROM pedidos_ausencia
         WHERE id_utilizador = ?
         AND estado_registo = 'ativo'
         AND estado IN ('pendente', 'aprovado')
         AND data_inicio <= ?
         AND data_fim >= ?`,
        [idUtilizador, data_fim, data_inicio]
      );

      if (pedidosExistentes.length > 0) {
        await ligacao.rollback();

        return res.status(409).json({
          sucesso: false,
          mensagem: "Já existe um pedido pendente ou aprovado para este período."
        });
      }

      const [resultado] = await ligacao.execute(
        `INSERT INTO pedidos_ausencia
         (id_utilizador, tipo_ausencia, data_inicio, data_fim, motivo)
         VALUES (?, ?, ?, ?, ?)`,
        [
          idUtilizador,
          tipo_ausencia,
          data_inicio,
          data_fim,
          motivo || null
        ]
      );

      await ligacao.commit();

      return res.status(201).json({
        sucesso: true,
        mensagem: "Pedido criado com sucesso.",
        id_pedido: resultado.insertId
      });

    } catch (error) {
      await ligacao.rollback();
      throw error;
    } finally {
      ligacao.release();
    }

  } catch (error) {
    console.error("Erro ao criar pedido:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar pedido de ausência."
    });
  }
}

// Consultar os pedidos do próprio utilizador
export async function listarMeusPedidos(req, res) {
  const idUtilizador = req.utilizador.id;
  const { estado, tipo_ausencia } = req.query;

  try {
    let sql = `
      SELECT *
      FROM pedidos_ausencia
      WHERE id_utilizador = ?
      AND estado_registo = 'ativo'
    `;

    const valores = [idUtilizador];

    if (estado) {
      sql += " AND estado = ?";
      valores.push(estado);
    }

    if (tipo_ausencia) {
      sql += " AND tipo_ausencia = ?";
      valores.push(tipo_ausencia);
    }

    sql += " ORDER BY data_pedido DESC";

    const [pedidos] = await pool.execute(sql, valores);

    return res.status(200).json({
      sucesso: true,
      pedidos
    });

  } catch (error) {
    console.error("Erro ao listar pedidos:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar os teus pedidos."
    });
  }
}

// Consultar todos os pedidos
export async function listarTodosPedidos(req, res) {
  const { estado, tipo_ausencia } = req.query;

  try {
    let sql = `
      SELECT
        p.*,
        u.nome AS nome_utilizador
      FROM pedidos_ausencia p
      INNER JOIN utilizadores u
        ON p.id_utilizador = u.id_utilizador
      WHERE p.estado_registo = 'ativo'
    `;

    const valores = [];

    if (estado) {
      sql += " AND p.estado = ?";
      valores.push(estado);
    }

    if (tipo_ausencia) {
      sql += " AND p.tipo_ausencia = ?";
      valores.push(tipo_ausencia);
    }

    sql += " ORDER BY p.data_pedido DESC";

    const [pedidos] = await pool.execute(sql, valores);

    return res.status(200).json({
      sucesso: true,
      pedidos
    });

  } catch (error) {
    console.error("Erro ao consultar todos os pedidos:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar pedidos."
    });
  }
}

// Consultar um pedido específico
export async function obterPedido(req, res) {
  const { id } = req.params;
  const { id: idUtilizador, perfil } = req.utilizador;

  try {
    const [pedidos] = await pool.execute(
      `SELECT *
       FROM pedidos_ausencia
       WHERE id_pedido = ?
       AND estado_registo = 'ativo'`,
      [id]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Pedido não encontrado."
      });
    }

    const pedido = pedidos[0];

    if (
      pedido.id_utilizador !== idUtilizador &&
      !["admin", "gestor"].includes(perfil)
    ) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Não tens permissão para consultar este pedido."
      });
    }

    return res.status(200).json({
      sucesso: true,
      pedido
    });

  } catch (error) {
    console.error("Erro ao consultar pedido:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar pedido."
    });
  }
}

// Aprovar ou rejeitar um pedido
export async function decidirPedido(req, res) {
  const { id } = req.params;
  const { estado } = req.body;
  const idAprovador = req.utilizador.id;

  if (!["aprovado", "rejeitado"].includes(estado)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "A decisão deve ser 'aprovado' ou 'rejeitado'."
    });
  }

  const ligacao = await pool.getConnection();

  try {
    await ligacao.beginTransaction();

    const [pedidos] = await ligacao.execute(
        `SELECT *
        FROM pedidos_ausencia
        WHERE id_pedido = ?
        AND estado_registo = 'ativo'
        FOR UPDATE`,
        [id]
        );

    if (pedidos.length === 0) {
      await ligacao.rollback();

      return res.status(404).json({
        sucesso: false,
        mensagem: "Pedido não encontrado."
      });
    }

    const pedido = pedidos[0];

    if (pedido.id_utilizador === idAprovador) {
      await ligacao.rollback();

      return res.status(403).json({
        sucesso: false,
        mensagem: "Não podes aprovar ou rejeitar o teu próprio pedido."
      });
    }

    if (pedido.estado !== "pendente") {
      await ligacao.rollback();

      return res.status(400).json({
        sucesso: false,
        mensagem: "Só é possível decidir pedidos que estejam pendentes."
      });
    }

    // Serializa decisões sobre pedidos do mesmo utilizador.
    await ligacao.execute(
      `SELECT id_utilizador
       FROM utilizadores
       WHERE id_utilizador = ?
       FOR UPDATE`,
      [pedido.id_utilizador]
    );

    // Bloqueia novamente o pedido antes de tomar a decisão.
const [pedidosAtualizados] = await ligacao.execute(
  `SELECT *
   FROM pedidos_ausencia
   WHERE id_pedido = ?
   AND estado_registo = 'ativo'
   FOR UPDATE`,
  [id]
);

if (pedidosAtualizados.length === 0) {
  await ligacao.rollback();

  return res.status(404).json({
    sucesso: false,
    mensagem: "Pedido não encontrado."
  });
}

if (pedidosAtualizados[0].estado !== "pendente") {
  await ligacao.rollback();

  return res.status(400).json({
    sucesso: false,
    mensagem: "Este pedido já foi decidido."
  });
}

    if (estado === "aprovado") {
      const [conflitos] = await ligacao.execute(
        `SELECT id_pedido
         FROM pedidos_ausencia
         WHERE id_utilizador = ?
         AND id_pedido <> ?
         AND estado_registo = 'ativo'
         AND estado = 'aprovado'
         AND data_inicio <= ?
         AND data_fim >= ?`,
        [
          pedido.id_utilizador,
          id,
          pedido.data_fim,
          pedido.data_inicio
        ]
      );

      if (conflitos.length > 0) {
        await ligacao.rollback();

        return res.status(409).json({
          sucesso: false,
          mensagem: "Este pedido entra em conflito com outro pedido já aprovado."
        });
      }
    }

    await ligacao.execute(
      `UPDATE pedidos_ausencia
       SET estado = ?,
           id_aprovador = ?,
           data_decisao = CURRENT_TIMESTAMP
       WHERE id_pedido = ?`,
      [estado, idAprovador, id]
    );

    await ligacao.commit();

    return res.status(200).json({
      sucesso: true,
      mensagem: estado === "aprovado"
        ? "Pedido aprovado com sucesso."
        : "Pedido rejeitado com sucesso."
    });

  } catch (error) {
    await ligacao.rollback();
    console.error("Erro ao decidir pedido:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao decidir pedido."
    });

  } finally {
    ligacao.release();
  }
}

// Cancelar um pedido do próprio utilizador
export async function cancelarPedido(req, res) {
  const { id } = req.params;
  const idUtilizador = req.utilizador.id;

  try {
    const [resultado] = await pool.execute(
      `UPDATE pedidos_ausencia
       SET estado = 'cancelado'
       WHERE id_pedido = ?
       AND id_utilizador = ?
       AND estado = 'pendente'
       AND estado_registo = 'ativo'`,
      [id, idUtilizador]
    );

    if (resultado.affectedRows === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Não foi possível cancelar o pedido. Confirma se existe e se ainda está pendente."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Pedido cancelado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao cancelar pedido:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao cancelar pedido."
    });
  }
}

// Inativar um registo
export async function inativarPedido(req, res) {
  const { id } = req.params;

  try {
    const [resultado] = await pool.execute(
      `UPDATE pedidos_ausencia
       SET estado_registo = 'inativo'
       WHERE id_pedido = ?
       AND estado_registo = 'ativo'`,
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Pedido não encontrado ou já inativo."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Registo inativado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao inativar pedido:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao inativar pedido."
    });
  }
}

// Consultar pedidos inativos
export async function listarPedidosInativos(req, res) {
  try {
    const [pedidos] = await pool.execute(
      `SELECT *
       FROM pedidos_ausencia
       WHERE estado_registo = 'inativo'
       ORDER BY data_pedido DESC`
    );

    return res.status(200).json({
      sucesso: true,
      pedidos
    });

  } catch (error) {
    console.error("Erro ao listar pedidos inativos:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar pedidos inativos."
    });
  }
}

// Reativar um registo
export async function reativarPedido(req, res) {
  const { id } = req.params;

  try {
    const [resultado] = await pool.execute(
      `UPDATE pedidos_ausencia
       SET estado_registo = 'ativo'
       WHERE id_pedido = ?
       AND estado_registo = 'inativo'`,
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Pedido não encontrado ou já ativo."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Registo reativado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao reativar pedido:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao reativar pedido."
    });
  }
}