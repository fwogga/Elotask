import pool from "../../comunicacao/config/database.js";

export async function atribuirResponsavelTarefa(req, res) {
  try {
    const { id_projeto, id_tarefa } = req.params;
    const { id_utilizador } = req.body;

    // Validar os IDs
    if (
      !Number.isInteger(Number(id_projeto)) ||
      Number(id_projeto) <= 0 ||
      !Number.isInteger(Number(id_tarefa)) ||
      Number(id_tarefa) <= 0 ||
      !Number.isInteger(Number(id_utilizador)) ||
      Number(id_utilizador) <= 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Os IDs fornecidos são inválidos."
      });
    }

    // Verificar se a tarefa existe e está ativa
    const [tarefas] = await pool.query(
      `SELECT id_tarefa
       FROM tarefas
       WHERE id_tarefa = ?
         AND id_projeto = ?
         AND estado_registo = 'ativo'`,
      [id_tarefa, id_projeto]
    );

    if (tarefas.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Tarefa não encontrada neste projeto."
      });
    }

    // Verificar se o utilizador pertence ao projeto
    const [membros] = await pool.query(
      `SELECT pm.id_utilizador
       FROM projeto_membros pm
       INNER JOIN utilizadores u
         ON pm.id_utilizador = u.id_utilizador
       WHERE pm.id_projeto = ?
         AND pm.id_utilizador = ?
         AND pm.estado = 'ativo'
         AND u.estado = 'ativo'`,
      [id_projeto, id_utilizador]
    );

    if (membros.length === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O utilizador não é um membro ativo deste projeto."
      });
    }

    // Verificar se já existe uma atribuição
    const [atribuicoes] = await pool.query(
      `SELECT id_tarefa
       FROM tarefa_responsaveis
       WHERE id_tarefa = ?
         AND id_utilizador = ?`,
      [id_tarefa, id_utilizador]
    );

    if (atribuicoes.length > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Este utilizador já está atribuído à tarefa."
      });
    }

    // Inserir a atribuição
    await pool.query(
      `INSERT INTO tarefa_responsaveis
       (id_tarefa, id_utilizador)
       VALUES (?, ?)`,
      [id_tarefa, id_utilizador]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Responsável atribuído à tarefa com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atribuir responsável:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atribuir responsável à tarefa."
    });
  }
}

export async function listarResponsaveisTarefa(req, res) {
  try {
    const { id_projeto, id_tarefa } = req.params;

    // Validar os IDs
    if (
      !Number.isInteger(Number(id_projeto)) ||
      Number(id_projeto) <= 0 ||
      !Number.isInteger(Number(id_tarefa)) ||
      Number(id_tarefa) <= 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto ou da tarefa inválido."
      });
    }

    // Verificar se a tarefa existe e está ativa
    const [tarefas] = await pool.query(
      `SELECT id_tarefa
       FROM tarefas
       WHERE id_tarefa = ?
         AND id_projeto = ?
         AND estado_registo = 'ativo'`,
      [id_tarefa, id_projeto]
    );

    if (tarefas.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Tarefa não encontrada neste projeto."
      });
    }

    // Consultar os responsáveis
    const [responsaveis] = await pool.query(
      `SELECT
        u.id_utilizador,
        u.nome,
        u.email,
        u.tipo_utilizador,
        tr.data_atribuicao
       FROM tarefa_responsaveis tr
       INNER JOIN utilizadores u
         ON tr.id_utilizador = u.id_utilizador
       WHERE tr.id_tarefa = ?
       ORDER BY tr.data_atribuicao ASC`,
      [id_tarefa]
    );

    return res.status(200).json({
      sucesso: true,
      total: responsaveis.length,
      responsaveis
    });

  } catch (error) {
    console.error("Erro ao listar responsáveis:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar os responsáveis da tarefa."
    });
  }
}

export async function removerResponsavelTarefa(req, res) {
  try {
    const { id_projeto, id_tarefa, id_utilizador } = req.params;

    // Validar os IDs
    if (
      !Number.isInteger(Number(id_projeto)) ||
      Number(id_projeto) <= 0 ||
      !Number.isInteger(Number(id_tarefa)) ||
      Number(id_tarefa) <= 0 ||
      !Number.isInteger(Number(id_utilizador)) ||
      Number(id_utilizador) <= 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Os IDs fornecidos são inválidos."
      });
    }

    // Verificar se a tarefa existe e está ativa
    const [tarefas] = await pool.query(
      `SELECT id_tarefa
       FROM tarefas
       WHERE id_tarefa = ?
         AND id_projeto = ?
         AND estado_registo = 'ativo'`,
      [id_tarefa, id_projeto]
    );

    if (tarefas.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Tarefa não encontrada neste projeto."
      });
    }

    // Verificar se o responsável está atribuído
    const [atribuicoes] = await pool.query(
      `SELECT id_tarefa
       FROM tarefa_responsaveis
       WHERE id_tarefa = ?
         AND id_utilizador = ?`,
      [id_tarefa, id_utilizador]
    );

    if (atribuicoes.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Este utilizador não está atribuído à tarefa."
      });
    }

    // Remover a associação
    await pool.query(
      `DELETE FROM tarefa_responsaveis
       WHERE id_tarefa = ?
         AND id_utilizador = ?`,
      [id_tarefa, id_utilizador]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Responsável removido da tarefa com sucesso."
    });

  } catch (error) {
    console.error("Erro ao remover responsável:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao remover responsável da tarefa."
    });
  }
}

export async function obterResponsavelTarefa(req, res) {
  try {
    const { id_projeto, id_tarefa, id_utilizador } = req.params;

    // Validar os IDs
    if (
      !Number.isInteger(Number(id_projeto)) ||
      Number(id_projeto) <= 0 ||
      !Number.isInteger(Number(id_tarefa)) ||
      Number(id_tarefa) <= 0 ||
      !Number.isInteger(Number(id_utilizador)) ||
      Number(id_utilizador) <= 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Os IDs fornecidos são inválidos."
      });
    }

    // Consultar o responsável específico
    const [responsaveis] = await pool.query(
      `SELECT
        u.id_utilizador,
        u.nome,
        u.email,
        u.tipo_utilizador,
        tr.data_atribuicao
       FROM tarefa_responsaveis tr
       INNER JOIN tarefas t
         ON tr.id_tarefa = t.id_tarefa
       INNER JOIN utilizadores u
         ON tr.id_utilizador = u.id_utilizador
       WHERE t.id_tarefa = ?
         AND t.id_projeto = ?
         AND t.estado_registo = 'ativo'
         AND tr.id_utilizador = ?`,
      [id_tarefa, id_projeto, id_utilizador]
    );

    if (responsaveis.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Responsável não encontrado nesta tarefa."
      });
    }

    return res.status(200).json({
      sucesso: true,
      responsavel: responsaveis[0]
    });

  } catch (error) {
    console.error("Erro ao consultar responsável:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar o responsável da tarefa."
    });
  }
}