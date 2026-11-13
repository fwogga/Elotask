import pool from "../../comunicacao/config/database.js";
import { registrarAlteracao } from "./historicoController.js";

// Atribuir colaborador a um turno

export async function atribuirColaboradorTurno(req, res) {
  let conexao;

  try {
    const { id_turno } = req.params;
    const { id_utilizador } = req.body;

    // 1. Validar os identificadores
    if (
      !id_turno ||
      !id_utilizador ||
      !Number.isInteger(Number(id_turno)) ||
      !Number.isInteger(Number(id_utilizador))
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "É necessário indicar identificadores válidos para o turno e o colaborador."
      });
    }

    // Obter uma ligação individual à base de dados
    conexao = await pool.getConnection();

    // Iniciar a transação
    await conexao.beginTransaction();

    // Bloquear as operações de turnos durante esta transação
    await conexao.query(
        `SELECT id
        FROM controlo_concorrencia_turnos
        WHERE id = 1
        FOR UPDATE`
    );

    // Bloquear o registo do colaborador
    // Impede duas atribuições simultâneas para o mesmo colaborador
    const [utilizadores] = await conexao.query(
      `SELECT id_utilizador, nome
       FROM utilizadores
       WHERE id_utilizador = ?
       AND tipo_utilizador = 'colaborador'
       AND estado = 'ativo'
       FOR UPDATE`,
      [id_utilizador]
    );

    if (utilizadores.length === 0) {
      await conexao.rollback();

      return res.status(404).json({
        sucesso: false,
        mensagem: "Colaborador não encontrado ou inativo."
      });
    }

    // Bloquear e verificar o turno
    const [turnos] = await conexao.query(
      `SELECT id_turno, nome, data_turno, hora_inicio, hora_fim
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

    const turnoAtual = turnos[0];

    // Verificar se o colaborador já tem outro turno sobreposto
    const [turnosSobrepostos] = await conexao.query(
      `SELECT
         t.id_turno,
         t.nome,
         t.data_turno,
         t.hora_inicio,
         t.hora_fim
       FROM turno_colaboradores tc
       INNER JOIN turnos t
         ON tc.id_turno = t.id_turno
       WHERE tc.id_utilizador = ?
       AND tc.id_turno <> ?
       AND tc.estado IN ('atribuido', 'confirmado')
       AND t.estado_registo = 'ativo'

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
        id_utilizador,
        id_turno,
        turnoAtual.data_turno,
        turnoAtual.hora_fim,
        turnoAtual.hora_inicio,
        turnoAtual.hora_fim,
        turnoAtual.data_turno,
        turnoAtual.hora_inicio
      ]
    );

    if (turnosSobrepostos.length > 0) {
      await conexao.rollback();

      return res.status(409).json({
        sucesso: false,
        mensagem: "O colaborador já está atribuído a outro turno que coincide com este horário.",
        turno_conflito: turnosSobrepostos[0]
      });
    }

    // Verificar se já existe uma atribuição
    const [atribuicoes] = await conexao.query(
      `SELECT id_turno, id_utilizador, estado
       FROM turno_colaboradores
       WHERE id_turno = ?
       AND id_utilizador = ?
       FOR UPDATE`,
      [id_turno, id_utilizador]
    );

    if (atribuicoes.length > 0) {

      // Não permitir duplicar uma atribuição ativa
      if (atribuicoes[0].estado !== 'cancelado') {
        await conexao.rollback();

        return res.status(409).json({
          sucesso: false,
          mensagem: "Este colaborador já está atribuído a este turno."
        });
      }

      // Reativar uma atribuição cancelada
      await conexao.query(
        `UPDATE turno_colaboradores
         SET estado = 'atribuido',
             data_atribuicao = CURRENT_TIMESTAMP
         WHERE id_turno = ?
         AND id_utilizador = ?`,
        [id_turno, id_utilizador]
      );

      await conexao.commit();

      await registrarAlteracao({
  id_utilizador: req.utilizador.id,
  tipo_alteracao: "reativacao_atribuicao_turno",
  descricao: `Reativou a atribuição do utilizador ${id_utilizador} ao turno ${id_turno}.`
    });

      return res.status(200).json({
        sucesso: true,
        mensagem: "A atribuição do colaborador foi reativada com sucesso."
      });
    }

    // Criar uma nova atribuição
    await conexao.query(
      `INSERT INTO turno_colaboradores
       (id_turno, id_utilizador, estado, data_atribuicao)
       VALUES (?, ?, 'atribuido', CURRENT_TIMESTAMP)`,
      [id_turno, id_utilizador]
    );

    // Confirmar a transação
    await conexao.commit();

    await registrarAlteracao({
  id_utilizador: req.utilizador.id,
  tipo_alteracao: "atribuicao_colaborador_turno",
  descricao: `Atribuiu o utilizador ${id_utilizador} ao turno ${id_turno}.`
    });

    return res.status(201).json({
      sucesso: true,
      mensagem: "Colaborador atribuído ao turno com sucesso."
    });

  } catch (error) {

    // Se ocorrer algum erro, cancelar a transação
    if (conexao) {
      try {
        await conexao.rollback();
      } catch (erroRollback) {
        console.error("Erro ao cancelar a transação:", erroRollback);
      }
    }

    console.error("Erro ao atribuir colaborador ao turno:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao atribuir colaborador ao turno."
    });

  } finally {

    // Libertar a ligação à base de dados
    if (conexao) {
      conexao.release();
    }
  }
}


// Listar colaboradores de um turno
export async function listarColaboradoresTurno(req, res) {
  try {
    const { id_turno } = req.params;

    const [turnos] = await pool.query(
      `SELECT id_turno
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

    const [colaboradores] = await pool.query(
      `SELECT
         u.id_utilizador,
         u.nome,
         u.email,
         u.cargo,
         tc.estado,
         tc.data_atribuicao
       FROM turno_colaboradores tc
       INNER JOIN utilizadores u
         ON tc.id_utilizador = u.id_utilizador
       WHERE tc.id_turno = ?
       AND tc.estado <> 'cancelado'
       ORDER BY u.nome ASC`,
      [id_turno]
    );

    return res.status(200).json({
      sucesso: true,
      total: colaboradores.length,
      colaboradores
    });

  } catch (error) {
    console.error("Erro ao listar colaboradores:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar colaboradores do turno."
    });
  }
}


// Alterar estado da atribuição
export async function atualizarEstadoAtribuicao(req, res) {
  try {
    const { id_turno, id_utilizador } = req.params;
    const { estado } = req.body;

    const estadosPermitidos = ["confirmado", "cancelado"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Estado inválido. Utiliza confirmado ou cancelado."
      });
    }

    // O colaborador só pode alterar a própria atribuição.
    // Admin e gestor podem alterar qualquer atribuição.
    const utilizadorAutenticado = req.utilizador;

    if (
      utilizadorAutenticado.perfil === "colaborador" &&
      Number(utilizadorAutenticado.id) !== Number(id_utilizador)
    ) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Só podes alterar o estado da tua própria atribuição."
      });
    }

    const [resultado] = await pool.query(
      `UPDATE turno_colaboradores tc
       INNER JOIN turnos t ON tc.id_turno = t.id_turno
       SET tc.estado = ?
       WHERE tc.id_turno = ?
       AND tc.id_utilizador = ?
       AND t.estado_registo = 'ativo'
       AND tc.estado <> 'cancelado'`,
      [estado, id_turno, id_utilizador]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Atribuição não encontrada ou já cancelada."
      });
    }

    await registrarAlteracao({
  id_utilizador: req.utilizador.id,
  tipo_alteracao: estado === "confirmado"
    ? "confirmacao_atribuicao_turno"
    : "cancelamento_atribuicao_turno",
  descricao: `Alterou o estado da atribuição do utilizador ${id_utilizador} ao turno ${id_turno} para "${estado}".`
    });

    return res.status(200).json({
      sucesso: true,
      mensagem: estado === "confirmado"
        ? "Atribuição confirmada com sucesso."
        : "Atribuição cancelada com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atualizar atribuição:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar estado da atribuição."
    });
  }
}


// Consultar turnos de um colaborador
export async function listarTurnosColaborador(req, res) {
  try {
    const { id_utilizador } = req.params;
    const utilizadorAutenticado = req.utilizador;

    if (
      utilizadorAutenticado.perfil === "colaborador" &&
      Number(utilizadorAutenticado.id) !== Number(id_utilizador)
    ) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Só podes consultar os teus próprios turnos."
      });
    }

    const [utilizadores] = await pool.query(
      `SELECT id_utilizador
       FROM utilizadores
       WHERE id_utilizador = ?
       AND estado = 'ativo'`,
      [id_utilizador]
    );

    if (utilizadores.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Colaborador não encontrado ou inativo."
      });
    }

    const [turnos] = await pool.query(
      `SELECT
         t.id_turno,
         t.nome,
         t.hora_inicio,
         t.hora_fim,
         t.data_turno,
         t.descricao,
         tc.estado AS estado_atribuicao,
         tc.data_atribuicao
       FROM turno_colaboradores tc
       INNER JOIN turnos t ON tc.id_turno = t.id_turno
       WHERE tc.id_utilizador = ?
       AND tc.estado <> 'cancelado'
       AND t.estado_registo = 'ativo'
       ORDER BY t.data_turno ASC, t.hora_inicio ASC`,
      [id_utilizador]
    );

    return res.status(200).json({
      sucesso: true,
      total: turnos.length,
      turnos
    });

  } catch (error) {
    console.error("Erro ao listar turnos do colaborador:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar turnos do colaborador."
    });
  }
}