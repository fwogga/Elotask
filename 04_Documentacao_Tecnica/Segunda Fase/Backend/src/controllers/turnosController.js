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
    const {
  nome,
  hora_inicio,
  hora_fim,
  data_turno,
  descricao,
  numero_colaboradores
} = req.body;

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

    if (!Number.isInteger(numero_colaboradores) || numero_colaboradores < 1) {
  return res.status(400).json({
    sucesso: false,
    mensagem: "O número de colaboradores deve ser um inteiro igual ou superior a 1."
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
   (nome, hora_inicio, hora_fim, data_turno, descricao, numero_colaboradores)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [
    nome.trim(),
    hora_inicio,
    hora_fim,
    data_turno,
    descricao?.trim() || null,
    numero_colaboradores
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
              data_turno, descricao, numero_colaboradores
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
              data_turno, descricao, numero_colaboradores
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
    const { nome, hora_inicio, hora_fim, data_turno, descricao, numero_colaboradores } = req.body;

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

    if (
  !Number.isInteger(numero_colaboradores) ||
  numero_colaboradores < 1
) {
  return res.status(400).json({
    sucesso: false,
    mensagem: "O número de colaboradores deve ser um inteiro igual ou superior a 1."
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
       descricao = ?,
       numero_colaboradores = ?
   WHERE id_turno = ?
   AND estado_registo = 'ativo'`,
  [
    nome,
    hora_inicio,
    hora_fim,
    data_turno,
    descricao || null,
    numero_colaboradores,
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
              data_turno, descricao, numero_colaboradores
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


// Definir ou atualizar a disponibilidade de um colaborador
export async function definirDisponibilidade(req, res) {
  let conexao;

  try {
    const { id_utilizador } = req.params;
    const { disponibilidades } = req.body;

    // Validar o identificador do colaborador
    if (!Number.isInteger(Number(id_utilizador)) || Number(id_utilizador) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Identificador do colaborador inválido."
      });
    }

    // Validar a lista de disponibilidades
    if (!Array.isArray(disponibilidades)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A disponibilidade deve ser enviada numa lista."
      });
    }

    const diasValidos = [
      "segunda",
      "terca",
      "quarta",
      "quinta",
      "sexta",
      "sabado",
      "domingo"
    ];

    // Validar cada disponibilidade
    for (const disponibilidade of disponibilidades) {

      const { dia_semana, hora_inicio, hora_fim } = disponibilidade;

      if (!diasValidos.includes(dia_semana)) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Dia da semana inválido."
        });
      }

      if (!validarHora(hora_inicio) || !validarHora(hora_fim)) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Indica horas válidas no formato HH:MM."
        });
      }

      if (hora_inicio >= hora_fim) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "A hora de fim deve ser posterior à hora de início."
        });
      }
    }

    conexao = await pool.getConnection();

    await conexao.beginTransaction();

    // Verificar se o colaborador existe
    const [utilizadores] = await conexao.query(
      `SELECT id_utilizador
       FROM utilizadores
       WHERE id_utilizador = ?
       AND estado = 'ativo'`,
      [id_utilizador]
    );

    if (utilizadores.length === 0) {
      await conexao.rollback();

      return res.status(404).json({
        sucesso: false,
        mensagem: "Colaborador não encontrado ou inativo."
      });
    }

    // Eliminar a disponibilidade anterior
    await conexao.query(
      `DELETE FROM disponibilidades_colaborador
       WHERE id_utilizador = ?`,
      [id_utilizador]
    );

    // Inserir a nova disponibilidade
    for (const disponibilidade of disponibilidades) {

      await conexao.query(
        `INSERT INTO disponibilidades_colaborador
         (id_utilizador, dia_semana, hora_inicio, hora_fim)
         VALUES (?, ?, ?, ?)`,
        [
          id_utilizador,
          disponibilidade.dia_semana,
          disponibilidade.hora_inicio,
          disponibilidade.hora_fim
        ]
      );
    }

    await conexao.commit();

    return res.status(200).json({
      sucesso: true,
      mensagem: "Disponibilidade atualizada com sucesso."
    });

  } catch (error) {
    if (conexao) {
      await conexao.rollback();
    }

    console.error("Erro ao definir disponibilidade:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao definir disponibilidade."
    });

  } finally {
    if (conexao) {
      conexao.release();
    }
  }
}


// Consultar a disponibilidade de um colaborador
export async function obterDisponibilidade(req, res) {
  try {
    const { id_utilizador } = req.params;

    if (!Number.isInteger(Number(id_utilizador)) || Number(id_utilizador) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Identificador do colaborador inválido."
      });
    }

    const [disponibilidades] = await pool.query(
      `SELECT id_disponibilidade, dia_semana,
              hora_inicio, hora_fim
       FROM disponibilidades_colaborador
       WHERE id_utilizador = ?
       ORDER BY FIELD(
         dia_semana,
         'segunda',
         'terca',
         'quarta',
         'quinta',
         'sexta',
         'sabado',
         'domingo'
       ), hora_inicio ASC`,
      [id_utilizador]
    );

    return res.status(200).json({
      sucesso: true,
      total: disponibilidades.length,
      disponibilidades
    });

  } catch (error) {
    console.error("Erro ao consultar disponibilidade:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar disponibilidade."
    });
  }
}


// Gerar escala automaticamente através do serviço Python
export async function gerarEscala(req, res) {
  let conexao;

  try {
    const { data_inicio, data_fim } = req.body;

    // 1. Validar as datas recebidas
    if (!validarData(data_inicio) || !validarData(data_fim)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Indica datas válidas no formato AAAA-MM-DD."
      });
    }

    if (data_inicio > data_fim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de início não pode ser posterior à data de fim."
      });
    }

    // 2. Obter os turnos ativos e ainda sem atribuições
    const [turnos] = await pool.query(
      `SELECT
         t.id_turno,
         t.nome,
         DATE_FORMAT(t.data_turno, '%Y-%m-%d') AS data_turno,
         TIME_FORMAT(t.hora_inicio, '%H:%i') AS hora_inicio,
         TIME_FORMAT(t.hora_fim, '%H:%i') AS hora_fim,
         t.numero_colaboradores
       FROM turnos t
       WHERE t.estado_registo = 'ativo'
       AND t.data_turno BETWEEN ? AND ?
       AND NOT EXISTS (
         SELECT 1
         FROM turno_colaboradores tc
         WHERE tc.id_turno = t.id_turno
         AND tc.estado IN ('atribuido', 'confirmado')
       )
       ORDER BY t.data_turno, t.hora_inicio`,
      [data_inicio, data_fim]
    );

    if (turnos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Não existem turnos por atribuir no período selecionado."
      });
    }

    // 3. Obter os colaboradores e respetivas disponibilidades
    const [registos] = await pool.query(
      `SELECT
         u.id_utilizador,
         u.nome,
         d.dia_semana,
         TIME_FORMAT(d.hora_inicio, '%H:%i') AS hora_inicio,
         TIME_FORMAT(d.hora_fim, '%H:%i') AS hora_fim
       FROM utilizadores u
       LEFT JOIN disponibilidades_colaborador d
         ON u.id_utilizador = d.id_utilizador
       WHERE u.estado = 'ativo'
       AND u.tipo_utilizador = 'colaborador'
       ORDER BY u.id_utilizador, d.dia_semana`
    );

    // Agrupar as disponibilidades por colaborador
    const colaboradoresPorId = new Map();

    for (const registo of registos) {

      if (!colaboradoresPorId.has(registo.id_utilizador)) {
        colaboradoresPorId.set(registo.id_utilizador, {
          id_utilizador: registo.id_utilizador,
          nome: registo.nome,
          disponibilidade: []
        });
      }

      if (registo.dia_semana) {
        colaboradoresPorId
          .get(registo.id_utilizador)
          .disponibilidade.push({
            dia_semana: registo.dia_semana,
            hora_inicio: registo.hora_inicio,
            hora_fim: registo.hora_fim
          });
      }
    }

    const colaboradores = Array.from(
      colaboradoresPorId.values()
    );

    if (colaboradores.length === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Não existem colaboradores ativos."
      });
    }

    // 4. Obter as ausências aprovadas no período
    const [ausencias] = await pool.query(
      `SELECT
         id_utilizador,
         DATE_FORMAT(data_inicio, '%Y-%m-%d') AS data_inicio,
         DATE_FORMAT(data_fim, '%Y-%m-%d') AS data_fim,
         estado
       FROM pedidos_ausencia
       WHERE estado = 'aprovado'
       AND data_inicio <= ?
       AND data_fim >= ?`,
      [data_fim, data_inicio]
    );

    // 5. Obter turnos já atribuídos que possam gerar conflitos
    // Incluímos um dia antes e um dia depois para considerar
    // turnos que atravessam a meia-noite.
    const [atribuicoesExistentes] = await pool.query(
      `SELECT
         tc.id_utilizador,
         t.id_turno,
         DATE_FORMAT(t.data_turno, '%Y-%m-%d') AS data_turno,
         TIME_FORMAT(t.hora_inicio, '%H:%i') AS hora_inicio,
         TIME_FORMAT(t.hora_fim, '%H:%i') AS hora_fim
       FROM turno_colaboradores tc
       INNER JOIN turnos t
         ON tc.id_turno = t.id_turno
       WHERE tc.estado IN ('atribuido', 'confirmado')
       AND t.estado_registo = 'ativo'
       AND t.data_turno BETWEEN
           DATE_SUB(?, INTERVAL 1 DAY)
           AND DATE_ADD(?, INTERVAL 1 DAY)`,
      [data_inicio, data_fim]
    );

    const turnosAtribuidos = atribuicoesExistentes.map(registo => ({
      id_utilizador: registo.id_utilizador,
      turno: {
        id_turno: registo.id_turno,
        data_turno: registo.data_turno,
        hora_inicio: registo.hora_inicio,
        hora_fim: registo.hora_fim
      }
    }));

    // 6. Enviar os dados para a API Python
    const respostaIA = await fetch(
      `${process.env.IA_API_URL || "http://127.0.0.1:8000"}/gerar-escala`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          colaboradores,
          turnos,
          ausencias,
          turnos_atribuidos: turnosAtribuidos
        })
      }
    );

    if (!respostaIA.ok) {
      console.error("Resposta inválida do serviço Python:", respostaIA.status);

      return res.status(502).json({
        sucesso: false,
        mensagem: "O serviço de Inteligência Artificial não conseguiu processar o pedido."
      });
    }

    const resultadoIA = await respostaIA.json();

    // 7. Verificar se o algoritmo encontrou uma solução
    if (!resultadoIA.sucesso) {
      return res.status(409).json({
        sucesso: false,
        mensagem: resultadoIA.mensagem,
        atribuicoes: []
      });
    }

    // 8. Guardar as atribuições na base de dados
    conexao = await pool.getConnection();

    await conexao.beginTransaction();

    // Bloquear os turnos para evitar alterações simultâneas
    const idsTurnos = turnos.map(turno => turno.id_turno);

    const [turnosBloqueados] = await conexao.query(
      `SELECT id_turno
       FROM turnos
       WHERE id_turno IN (?)
       AND estado_registo = 'ativo'
       FOR UPDATE`,
      [idsTurnos]
    );

    if (turnosBloqueados.length !== idsTurnos.length) {
      await conexao.rollback();

      return res.status(409).json({
        sucesso: false,
        mensagem: "Alguns turnos foram alterados durante a geração da escala. Atualiza os dados e tenta novamente."
      });
    }

    // Confirmar que nenhum turno recebeu atribuições entretanto
    const [atribuicoesNovas] = await conexao.query(
      `SELECT id_turno
       FROM turno_colaboradores
       WHERE id_turno IN (?)
       AND estado IN ('atribuido', 'confirmado')
       LIMIT 1`,
      [idsTurnos]
    );

    if (atribuicoesNovas.length > 0) {
      await conexao.rollback();

      return res.status(409).json({
        sucesso: false,
        mensagem: "Um ou mais turnos já receberam atribuições. Atualiza os dados e tenta novamente."
      });
    }

    // Inserir as atribuições
    for (const atribuicao of resultadoIA.atribuicoes) {

      await conexao.query(
        `INSERT INTO turno_colaboradores
         (id_turno, id_utilizador, estado)
         VALUES (?, ?, 'atribuido')`,
        [
          atribuicao.id_turno,
          atribuicao.id_utilizador
        ]
      );
    }

    await conexao.commit();

    return res.status(201).json({
      sucesso: true,
      mensagem: "Escala gerada e guardada com sucesso.",
      total_atribuicoes: resultadoIA.total_atribuicoes,
      atribuicoes: resultadoIA.atribuicoes
    });

  } catch (error) {

    if (conexao) {
      await conexao.rollback();
    }

    console.error("Erro ao gerar escala:", error);

    if (error.cause || error.code === "ECONNREFUSED") {
      return res.status(503).json({
        sucesso: false,
        mensagem: "Não foi possível contactar o serviço de Inteligência Artificial. Confirma se o servidor Python está ativo."
      });
    }

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao gerar a escala."
    });

  } finally {
    if (conexao) {
      conexao.release();
    }
  }
}
