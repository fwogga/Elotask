import pool from "../config/database.js";

// Validar datas no formato AAAA-MM-DD
const validarData = (data) => {
  return (
    typeof data === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(data) &&
    !Number.isNaN(Date.parse(`${data}T00:00:00Z`)) &&
    new Date(`${data}T00:00:00Z`).toISOString().slice(0, 10) === data
  );
};

// POST /projetos/:id_projeto/tarefas
export async function criarTarefa(req, res) {
  try {
    const { id_projeto } = req.params;

    const {
      titulo,
      descricao,
      prioridade,
      data_inicio,
      prazo
    } = req.body;

    // Validar o ID do projeto
    if (
      !Number.isInteger(Number(id_projeto)) ||
      Number(id_projeto) <= 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto inválido."
      });
    }

    // Validar o título
    if (typeof titulo !== "string" || !titulo.trim()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O título da tarefa é obrigatório."
      });
    }

    // Validar a prioridade
    const prioridadesPermitidas = [
      "baixa",
      "media",
      "alta",
      "urgente"
    ];

    const prioridadeFinal = prioridade || "media";

    if (!prioridadesPermitidas.includes(prioridadeFinal)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Prioridade inválida."
      });
    }

    if (data_inicio && !validarData(data_inicio)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de início é inválida."
      });
    }

    if (prazo && !validarData(prazo)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O prazo da tarefa é inválido."
      });
    }

    if (data_inicio && prazo && prazo < data_inicio) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O prazo não pode ser anterior à data de início."
      });
    }

    // Verificar se o projeto existe e está em curso
    const [projetos] = await pool.query(
      `SELECT id_projeto
       FROM projetos
       WHERE id_projeto = ?
         AND estado = 'em_curso'`,
      [id_projeto]
    );

    if (projetos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Projeto não encontrado ou não está em curso."
      });
    }

    // Criar a tarefa
    const [resultado] = await pool.query(
      `INSERT INTO tarefas
       (id_projeto, id_criador, titulo, descricao,
        prioridade, data_inicio, prazo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_projeto,
        req.utilizador.id,
        titulo.trim(),
        descricao || null,
        prioridadeFinal,
        data_inicio || null,
        prazo || null
      ]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Tarefa criada com sucesso.",
      id_tarefa: resultado.insertId
    });

  } catch (error) {
    console.error("Erro ao criar tarefa:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar tarefa."
    });
  }
}

// GET /projetos/:id_projetos/tarefas
export async function listarTarefasProjeto(req, res) {
  try {
    const { id_projeto } = req.params;

    // Validar o ID do projeto
    if (!Number.isInteger(Number(id_projeto)) || Number(id_projeto) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto inválido."
      });
    }

    // Verificar se o projeto existe
    const [projetos] = await pool.query(
      "SELECT id_projeto FROM projetos WHERE id_projeto = ?",
      [id_projeto]
    );

    if (projetos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Projeto não encontrado."
      });
    }

    // Consultar as tarefas ativas do projeto
    const [tarefas] = await pool.query(
      `SELECT
        t.id_tarefa,
        t.id_projeto,
        t.titulo,
        t.descricao,
        t.prioridade,
        t.estado,
        t.data_criacao,
        t.data_inicio,
        t.prazo,
        t.data_conclusao,
        t.id_criador,
        u.nome AS nome_criador
      FROM tarefas t
      INNER JOIN utilizadores u
        ON t.id_criador = u.id_utilizador
      WHERE t.id_projeto = ?
        AND t.estado_registo = 'ativo'
      ORDER BY t.data_criacao DESC`,
      [id_projeto]
    );

    return res.status(200).json({
      sucesso: true,
      total: tarefas.length,
      tarefas
    });

  } catch (error) {
    console.error("Erro ao listar tarefas:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar as tarefas."
    });
  }
}

// PUT /projetos/:id_projetos/tarefas/:id_tarefa
export async function atualizarTarefa(req, res) {
  try {
    const { id_projeto, id_tarefa } = req.params;

    const {
      titulo,
      descricao,
      prioridade,
      data_inicio,
      prazo
    } = req.body;

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

    // Validar o título
    if (!titulo || typeof titulo !== "string" || !titulo.trim()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O título da tarefa é obrigatório."
      });
    }

    if (titulo.trim().length > 200) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O título não pode ultrapassar 200 caracteres."
      });
    }

    // Validar a prioridade
    const prioridadesPermitidas = [
      "baixa",
      "media",
      "alta",
      "urgente"
    ];

    if (!prioridadesPermitidas.includes(prioridade)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Prioridade inválida."
      });
    }

    // Validar as datas
    if (data_inicio && !validarData(data_inicio)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de início é inválida."
      });
    }

    if (prazo && !validarData(prazo)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O prazo é inválido."
      });
    }

    if (data_inicio && prazo && prazo < data_inicio) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O prazo não pode ser anterior à data de início."
      });
    }

    // Verificar se a tarefa pertence ao projeto
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

    // Atualizar a tarefa
    await pool.query(
      `UPDATE tarefas
       SET titulo = ?,
           descricao = ?,
           prioridade = ?,
           data_inicio = ?,
           prazo = ?
       WHERE id_tarefa = ?
         AND id_projeto = ?`,
      [
        titulo.trim(),
        descricao || null,
        prioridade,
        data_inicio || null,
        prazo || null,
        id_tarefa,
        id_projeto
      ]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Tarefa atualizada com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar a tarefa."
    });
  }
}