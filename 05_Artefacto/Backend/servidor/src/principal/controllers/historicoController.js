import pool from "../../comunicacao/config/database.js";

// Registar uma alteração
export async function registrarAlteracao({
  id_utilizador,
  id_projeto = null,
  id_tarefa = null,
  tipo_alteracao,
  descricao
}) {
  try {
    if (!tipo_alteracao || !descricao) {
      throw new Error("O tipo de alteração e a descrição são obrigatórios.");
    }

    const [resultado] = await pool.query(
      `INSERT INTO historico_alteracoes
       (id_utilizador, id_projeto, id_tarefa, tipo_alteracao, descricao)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id_utilizador || null,
        id_projeto,
        id_tarefa,
        tipo_alteracao,
        descricao
      ]
    );

    return resultado.insertId;

  } catch (error) {
    console.error("Erro ao registar alteração:", error);
    throw error;
  }
}


// Consultar o histórico de alterações
export async function consultarHistorico(req, res) {
  try {
    const {
      id_projeto,
      id_tarefa,
      id_utilizador,
      tipo_alteracao,
      data_inicio,
      data_fim
    } = req.query;

    const perfil = req.utilizador.perfil;
    const utilizadorAtual = req.utilizador.id;

    let sql = `
      SELECT
        h.id_alteracao,
        h.id_utilizador,
        u.nome AS nome_utilizador,
        h.id_projeto,
        p.nome AS nome_projeto,
        h.id_tarefa,
        t.titulo AS titulo_tarefa,
        h.tipo_alteracao,
        h.descricao,
        h.data_alteracao
      FROM historico_alteracoes h
      LEFT JOIN utilizadores u
        ON h.id_utilizador = u.id_utilizador
      LEFT JOIN projetos p
        ON h.id_projeto = p.id_projeto
      LEFT JOIN tarefas t
        ON h.id_tarefa = t.id_tarefa
      WHERE 1 = 1
    `;

    const parametros = [];

    // Administradores e gestores podem consultar todo o histórico.
    // Os colaboradores só consultam o próprio histórico e o dos projetos
    // em que estão inscritos.
    if (!["admin", "gestor"].includes(perfil)) {
      sql += `
        AND (
          h.id_utilizador = ?
          OR h.id_projeto IN (
            SELECT pm.id_projeto
            FROM projeto_membros pm
            WHERE pm.id_utilizador = ?
          )
        )
      `;

      parametros.push(utilizadorAtual, utilizadorAtual);
    }

    if (id_projeto) {
      sql += " AND h.id_projeto = ?";
      parametros.push(id_projeto);
    }

    if (id_tarefa) {
      sql += " AND h.id_tarefa = ?";
      parametros.push(id_tarefa);
    }

    if (id_utilizador && ["admin", "gestor"].includes(perfil)) {
      sql += " AND h.id_utilizador = ?";
      parametros.push(id_utilizador);
    }

    if (tipo_alteracao) {
      sql += " AND h.tipo_alteracao = ?";
      parametros.push(tipo_alteracao);
    }

    if (data_inicio) {
      sql += " AND DATE(h.data_alteracao) >= ?";
      parametros.push(data_inicio);
    }

    if (data_fim) {
      sql += " AND DATE(h.data_alteracao) <= ?";
      parametros.push(data_fim);
    }

    sql += " ORDER BY h.data_alteracao DESC";

    const [historico] = await pool.query(sql, parametros);

    return res.status(200).json({
      sucesso: true,
      total: historico.length,
      historico
    });

  } catch (error) {
    console.error("Erro ao consultar histórico:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar o histórico de alterações."
    });
  }
}


// Consultar uma alteração específica
export async function obterAlteracao(req, res) {
  try {
    const { id } = req.params;
    const perfil = req.utilizador.perfil;
    const utilizadorAtual = req.utilizador.id;

    let sql = `
      SELECT
        h.id_alteracao,
        h.id_utilizador,
        u.nome AS nome_utilizador,
        h.id_projeto,
        p.nome AS nome_projeto,
        h.id_tarefa,
        t.titulo AS titulo_tarefa,
        h.tipo_alteracao,
        h.descricao,
        h.data_alteracao
      FROM historico_alteracoes h
      LEFT JOIN utilizadores u
        ON h.id_utilizador = u.id_utilizador
      LEFT JOIN projetos p
        ON h.id_projeto = p.id_projeto
      LEFT JOIN tarefas t
        ON h.id_tarefa = t.id_tarefa
      WHERE h.id_alteracao = ?
    `;

    const parametros = [id];

    if (!["admin", "gestor"].includes(perfil)) {
      sql += `
        AND (
          h.id_utilizador = ?
          OR h.id_projeto IN (
            SELECT pm.id_projeto
            FROM projeto_membros pm
            WHERE pm.id_utilizador = ?
          )
        )
      `;

      parametros.push(utilizadorAtual, utilizadorAtual);
    }

    const [alteracoes] = await pool.query(sql, parametros);

    if (alteracoes.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Alteração não encontrada ou sem permissão para a consultar."
      });
    }

    return res.status(200).json({
      sucesso: true,
      alteracao: alteracoes[0]
    });

  } catch (error) {
    console.error("Erro ao consultar alteração:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar a alteração."
    });
  }
}