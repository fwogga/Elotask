import pool from "../../comunicacao/config/database.js";

// Criar um pedido de troca de turno
export async function criarPedidoTroca(req, res) {
  try {
    const idSolicitante = Number(req.utilizador.id);
    const {
      id_destinatario,
      id_turno_solicitante,
      id_turno_destinatario,
      motivo
    } = req.body;

    const idDestinatario = Number(id_destinatario);
    const idTurnoSolicitante = Number(id_turno_solicitante);
    const idTurnoDestinatario = Number(id_turno_destinatario);

    if (
      !Number.isInteger(idDestinatario) ||
      !Number.isInteger(idTurnoSolicitante) ||
      !Number.isInteger(idTurnoDestinatario) ||
      idDestinatario <= 0 ||
      idTurnoSolicitante <= 0 ||
      idTurnoDestinatario <= 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Os dados dos colaboradores e dos turnos são obrigatórios."
      });
    }

    if (
      idSolicitante === idDestinatario ||
      idTurnoSolicitante === idTurnoDestinatario
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Não podes solicitar uma troca contigo próprio ou com o mesmo turno."
      });
    }

    if (motivo !== undefined && motivo !== null &&
        typeof motivo !== "string") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O motivo deve ser um texto."
      });
    }

    // Verificar se o destinatário está ativo
    const [destinatarios] = await pool.query(
      `SELECT id_utilizador
       FROM utilizadores
       WHERE id_utilizador = ?
       AND estado = 'ativo'`,
      [idDestinatario]
    );

    if (destinatarios.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "O colaborador indicado não existe ou está inativo."
      });
    }

    // Verificar se ambos estão atribuídos aos respetivos turnos
    const [atribuicoes] = await pool.query(
      `SELECT id_turno, id_utilizador
       FROM turno_colaboradores
       WHERE (
         (id_turno = ? AND id_utilizador = ?)
         OR
         (id_turno = ? AND id_utilizador = ?)
       )
       AND estado IN ('atribuido', 'confirmado')`,
      [
        idTurnoSolicitante,
        idSolicitante,
        idTurnoDestinatario,
        idDestinatario
      ]
    );

    const solicitanteTemTurno = atribuicoes.some(
      a => a.id_turno === idTurnoSolicitante &&
           a.id_utilizador === idSolicitante
    );

    const destinatarioTemTurno = atribuicoes.some(
      a => a.id_turno === idTurnoDestinatario &&
           a.id_utilizador === idDestinatario
    );

    if (!solicitanteTemTurno || !destinatarioTemTurno) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Um ou ambos os colaboradores não estão atribuídos aos turnos indicados."
      });
    }

    // Criar pedido
    const [resultado] = await pool.query(
      `INSERT INTO pedidos_troca_turno (
        id_solicitante,
        id_destinatario,
        id_turno_solicitante,
        id_turno_destinatario,
        motivo
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        idSolicitante,
        idDestinatario,
        idTurnoSolicitante,
        idTurnoDestinatario,
        motivo?.trim() || null
      ]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Pedido de troca enviado com sucesso.",
      id_pedido: resultado.insertId
    });

  } catch (error) {
    console.error("Erro ao criar pedido de troca:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao criar o pedido de troca."
    });
  }
}


// Consultar pedidos enviados ou recebidos
export async function listarMeusPedidosTroca(req, res) {
  try {
    const idUtilizador = Number(req.utilizador.id);

    const [pedidos] = await pool.query(
      `SELECT
        p.*,
        u1.nome AS nome_solicitante,
        u2.nome AS nome_destinatario,
        t1.nome AS nome_turno_solicitante,
        t1.data_turno AS data_turno_solicitante,
        t2.nome AS nome_turno_destinatario,
        t2.data_turno AS data_turno_destinatario
      FROM pedidos_troca_turno p
      INNER JOIN utilizadores u1
        ON p.id_solicitante = u1.id_utilizador
      INNER JOIN utilizadores u2
        ON p.id_destinatario = u2.id_utilizador
      INNER JOIN turnos t1
        ON p.id_turno_solicitante = t1.id_turno
      INNER JOIN turnos t2
        ON p.id_turno_destinatario = t2.id_turno
      WHERE p.id_solicitante = ?
         OR p.id_destinatario = ?
      ORDER BY p.data_pedido DESC`,
      [idUtilizador, idUtilizador]
    );

    return res.status(200).json({
      sucesso: true,
      total: pedidos.length,
      dados: pedidos
    });

  } catch (error) {
    console.error("Erro ao listar pedidos:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao consultar os pedidos."
    });
  }
}


// Aceitar ou recusar um pedido — destinatário
export async function responderPedidoTroca(req, res) {
  try {
    const idPedido = Number(req.params.id);
    const idUtilizador = Number(req.utilizador.id);
    const { resposta } = req.body;

    if (!["aceite", "recusado"].includes(resposta)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A resposta deve ser 'aceite' ou 'recusado'."
      });
    }

    const [resultado] = await pool.query(
      `UPDATE pedidos_troca_turno
       SET estado = ?
       WHERE id_pedido = ?
       AND id_destinatario = ?
       AND estado = 'pendente'`,
      [resposta, idPedido, idUtilizador]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Pedido não encontrado ou já respondido."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: resposta === "aceite"
        ? "Pedido aceite. Aguarda a aprovação do gestor."
        : "Pedido recusado."
    });

  } catch (error) {
    console.error("Erro ao responder ao pedido:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao responder ao pedido."
    });
  }
}


// Cancelar pedido — solicitante
export async function cancelarPedidoTroca(req, res) {
  try {
    const idPedido = Number(req.params.id);
    const idUtilizador = Number(req.utilizador.id);

    const [resultado] = await pool.query(
      `UPDATE pedidos_troca_turno
       SET estado = 'cancelado'
       WHERE id_pedido = ?
       AND id_solicitante = ?
       AND estado IN ('pendente', 'aceite')`,
      [idPedido, idUtilizador]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Pedido não encontrado ou que já não pode ser cancelado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Pedido cancelado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao cancelar pedido:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao cancelar o pedido."
    });
  }
}


// Consultar pedidos que aguardam aprovação
export async function listarPedidosParaAprovacao(req, res) {
  try {
    const [pedidos] = await pool.query(
      `SELECT
        p.*,
        u1.nome AS nome_solicitante,
        u2.nome AS nome_destinatario,
        t1.nome AS nome_turno_solicitante,
        t1.data_turno AS data_turno_solicitante,
        t2.nome AS nome_turno_destinatario,
        t2.data_turno AS data_turno_destinatario
      FROM pedidos_troca_turno p
      INNER JOIN utilizadores u1
        ON p.id_solicitante = u1.id_utilizador
      INNER JOIN utilizadores u2
        ON p.id_destinatario = u2.id_utilizador
      INNER JOIN turnos t1
        ON p.id_turno_solicitante = t1.id_turno
      INNER JOIN turnos t2
        ON p.id_turno_destinatario = t2.id_turno
      WHERE p.estado = 'aceite'
      ORDER BY p.data_pedido ASC`
    );

    return res.status(200).json({
      sucesso: true,
      total: pedidos.length,
      dados: pedidos
    });

  } catch (error) {
    console.error("Erro ao consultar aprovações:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao consultar os pedidos."
    });
  }
}


function obterIntervaloTurno(turno) {
  const inicio = new Date(
    `${turno.data_turno}T${turno.hora_inicio}Z`
  );

  let fim = new Date(
    `${turno.data_turno}T${turno.hora_fim}Z`
  );

  // Se o turno terminar no dia seguinte
  if (fim <= inicio) {
    fim.setUTCDate(fim.getUTCDate() + 1);
  }

  return { inicio, fim };
}

function existeSobreposicao(turnoA, turnoB) {
  const intervaloA = obterIntervaloTurno(turnoA);
  const intervaloB = obterIntervaloTurno(turnoB);

  return (
    intervaloA.inicio < intervaloB.fim &&
    intervaloA.fim > intervaloB.inicio
  );
}


// Aprovar ou rejeitar pedido — gestor ou administrador
export async function decidirPedidoTroca(req, res) {
  let conexao;

  try {
    const idPedido = Number(req.params.id);
    const idAprovador = Number(req.utilizador.id);
    const { decisao } = req.body;

    if (!Number.isInteger(idPedido) || idPedido <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O identificador do pedido é inválido."
      });
    }

    if (!["aprovado", "rejeitado"].includes(decisao)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A decisão deve ser 'aprovado' ou 'rejeitado'."
      });
    }

    conexao = await pool.getConnection();
    await conexao.beginTransaction();

    // Bloquear o pedido para impedir decisões simultâneas
    const [pedidos] = await conexao.query(
      `SELECT *
       FROM pedidos_troca_turno
       WHERE id_pedido = ?
       FOR UPDATE`,
      [idPedido]
    );

    if (pedidos.length === 0) {
      await conexao.rollback();

      return res.status(404).json({
        sucesso: false,
        mensagem: "Pedido de troca não encontrado."
      });
    }

    const pedido = pedidos[0];

    if (pedido.estado !== "aceite") {
      await conexao.rollback();

      return res.status(400).json({
        sucesso: false,
        mensagem: "Este pedido ainda não foi aceite pelo colega ou já foi decidido."
      });
    }

    // Se o gestor rejeitar, não é necessário alterar os turnos
    if (decisao === "rejeitado") {
      await conexao.query(
        `UPDATE pedidos_troca_turno
         SET estado = 'rejeitado'
         WHERE id_pedido = ?`,
        [idPedido]
      );

      await conexao.query(
  `INSERT INTO historico_alteracoes
   (id_utilizador, id_projeto, id_tarefa, tipo_alteracao, descricao)
   VALUES (?, NULL, NULL, ?, ?)`,
        [
    idAprovador,
    "rejeicao_pedido_troca_turno",
    `Rejeitou o pedido de troca ${idPedido}, entre os turnos ${pedido.id_turno_solicitante} e ${pedido.id_turno_destinatario}.`
        ]
    );

      await conexao.commit();

      return res.status(200).json({
        sucesso: true,
        mensagem: "Pedido rejeitado. Os turnos mantêm-se inalterados."
      });
    }

    // Bloqueio global para evitar alterações simultâneas aos horários
    await conexao.query(
      `SELECT id
       FROM controlo_concorrencia_turnos
       WHERE id = 1
       FOR UPDATE`
    );

    const idSolicitante = pedido.id_solicitante;
    const idDestinatario = pedido.id_destinatario;
    const idTurnoSolicitante = pedido.id_turno_solicitante;
    const idTurnoDestinatario = pedido.id_turno_destinatario;

    // Confirmar que os dois colaboradores continuam ativos
    const [utilizadores] = await conexao.query(
      `SELECT id_utilizador
       FROM utilizadores
       WHERE id_utilizador IN (?, ?)
       AND estado = 'ativo'
       FOR UPDATE`,
      [idSolicitante, idDestinatario]
    );

    if (utilizadores.length !== 2) {
      await conexao.rollback();

      return res.status(409).json({
        sucesso: false,
        mensagem: "Um dos colaboradores já não está ativo. A troca não pode ser realizada."
      });
    }

    // Consultar e bloquear os dois turnos
    const [turnos] = await conexao.query(
      `SELECT
        id_turno,
        DATE_FORMAT(data_turno, '%Y-%m-%d') AS data_turno,
        TIME_FORMAT(hora_inicio, '%H:%i:%s') AS hora_inicio,
        TIME_FORMAT(hora_fim, '%H:%i:%s') AS hora_fim,
        estado_registo
       FROM turnos
       WHERE id_turno IN (?, ?)
       FOR UPDATE`,
      [idTurnoSolicitante, idTurnoDestinatario]
    );

    if (
      turnos.length !== 2 ||
      turnos.some(t => t.estado_registo !== "ativo")
    ) {
      await conexao.rollback();

      return res.status(409).json({
        sucesso: false,
        mensagem: "Um dos turnos já não está disponível para troca."
      });
    }

    const turnoSolicitante = turnos.find(
      t => t.id_turno === idTurnoSolicitante
    );

    const turnoDestinatario = turnos.find(
      t => t.id_turno === idTurnoDestinatario
    );

    // Confirmar que as atribuições continuam válidas
    const [atribuicoes] = await conexao.query(
      `SELECT id_turno, id_utilizador, estado
       FROM turno_colaboradores
       WHERE (
         (id_turno = ? AND id_utilizador = ?)
         OR
         (id_turno = ? AND id_utilizador = ?)
       )
       AND estado IN ('atribuido', 'confirmado')
       FOR UPDATE`,
      [
        idTurnoSolicitante,
        idSolicitante,
        idTurnoDestinatario,
        idDestinatario
      ]
    );

    const atribuicaoSolicitante = atribuicoes.find(
      a => a.id_turno === idTurnoSolicitante &&
           a.id_utilizador === idSolicitante
    );

    const atribuicaoDestinatario = atribuicoes.find(
      a => a.id_turno === idTurnoDestinatario &&
           a.id_utilizador === idDestinatario
    );

    if (!atribuicaoSolicitante || !atribuicaoDestinatario) {
      await conexao.rollback();

      return res.status(409).json({
        sucesso: false,
        mensagem: "As atribuições dos turnos foram alteradas. A troca já não pode ser realizada."
      });
    }

    // Consultar os restantes turnos ativos do solicitante
    const [turnosSolicitante] = await conexao.query(
      `SELECT
        t.id_turno,
        DATE_FORMAT(t.data_turno, '%Y-%m-%d') AS data_turno,
        TIME_FORMAT(t.hora_inicio, '%H:%i:%s') AS hora_inicio,
        TIME_FORMAT(t.hora_fim, '%H:%i:%s') AS hora_fim
       FROM turno_colaboradores tc
       INNER JOIN turnos t
         ON tc.id_turno = t.id_turno
       WHERE tc.id_utilizador = ?
       AND tc.estado IN ('atribuido', 'confirmado')
       AND t.estado_registo = 'ativo'
       AND tc.id_turno NOT IN (?, ?)
       FOR UPDATE`,
      [
        idSolicitante,
        idTurnoSolicitante,
        idTurnoDestinatario
      ]
    );

    // Consultar os restantes turnos ativos do destinatário
    const [turnosDestinatario] = await conexao.query(
      `SELECT
        t.id_turno,
        DATE_FORMAT(t.data_turno, '%Y-%m-%d') AS data_turno,
        TIME_FORMAT(t.hora_inicio, '%H:%i:%s') AS hora_inicio,
        TIME_FORMAT(t.hora_fim, '%H:%i:%s') AS hora_fim
       FROM turno_colaboradores tc
       INNER JOIN turnos t
         ON tc.id_turno = t.id_turno
       WHERE tc.id_utilizador = ?
       AND tc.estado IN ('atribuido', 'confirmado')
       AND t.estado_registo = 'ativo'
       AND tc.id_turno NOT IN (?, ?)
       FOR UPDATE`,
      [
        idDestinatario,
        idTurnoSolicitante,
        idTurnoDestinatario
      ]
    );

    // O solicitante passará a trabalhar no turno do destinatário
    const conflitoSolicitante = turnosSolicitante.some(
      turno => existeSobreposicao(turnoDestinatario, turno)
    );

    // O destinatário passará a trabalhar no turno do solicitante
    const conflitoDestinatario = turnosDestinatario.some(
      turno => existeSobreposicao(turnoSolicitante, turno)
    );

    if (conflitoSolicitante || conflitoDestinatario) {
      await conexao.rollback();

      return res.status(409).json({
        sucesso: false,
        mensagem: "A troca provocaria uma sobreposição de horários. Os turnos não foram alterados."
      });
    }

    // Remover as duas atribuições antigas
    await conexao.query(
      `DELETE FROM turno_colaboradores
       WHERE (
         (id_turno = ? AND id_utilizador = ?)
         OR
         (id_turno = ? AND id_utilizador = ?)
       )`,
      [
        idTurnoSolicitante,
        idSolicitante,
        idTurnoDestinatario,
        idDestinatario
      ]
    );

    // Trocar os colaboradores, preservando atribuições já existentes
    await conexao.query(
  `INSERT INTO turno_colaboradores
   (id_turno, id_utilizador, estado)
   VALUES
   (?, ?, ?),
   (?, ?, ?)
   ON DUPLICATE KEY UPDATE estado = estado`,
  [
    idTurnoSolicitante,
    idDestinatario,
    atribuicaoDestinatario.estado,

    idTurnoDestinatario,
    idSolicitante,
    atribuicaoSolicitante.estado
  ]
);

    // Atualizar o pedido
    await conexao.query(
      `UPDATE pedidos_troca_turno
       SET estado = 'aprovado'
       WHERE id_pedido = ?`,
      [idPedido]
    );

    await conexao.query(
  `INSERT INTO historico_alteracoes
   (id_utilizador, id_projeto, id_tarefa, tipo_alteracao, descricao)
   VALUES (?, NULL, NULL, ?, ?)`,
  [
    idAprovador,
    "aprovacao_pedido_troca_turno",
    `Aprovou o pedido de troca ${idPedido}: o utilizador ${idSolicitante} passou para o turno ${idTurnoDestinatario} e o utilizador ${idDestinatario} passou para o turno ${idTurnoSolicitante}.`
  ]
);

    await conexao.commit();

    return res.status(200).json({
      sucesso: true,
      mensagem: "Pedido aprovado e troca de turnos realizada com sucesso."
    });

  } catch (error) {
    if (conexao) {
      await conexao.rollback();
    }

    console.error("Erro ao decidir pedido de troca:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao decidir o pedido de troca."
    });

  } finally {
    if (conexao) {
      conexao.release();
    }
  }
}
