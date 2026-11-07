import pool from "../config/database.js";

export async function criarChecklist(req, res) {
  try {
    const { id_projeto, id_tarefa } = req.params;
    const { titulo } = req.body;

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
        mensagem: "O título da checklist é obrigatório."
      });
    }

    if (titulo.trim().length > 150) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O título não pode ultrapassar 150 caracteres."
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

    // Criar a checklist
    const [resultado] = await pool.query(
      `INSERT INTO checklists (id_tarefa, titulo)
       VALUES (?, ?)`,
      [id_tarefa, titulo.trim()]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Checklist criada com sucesso.",
      id_checklist: resultado.insertId
    });

  } catch (error) {
    console.error("Erro ao criar checklist:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar a checklist."
    });
  }
}

export async function listarChecklistsTarefa(req, res) {
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

    // Verificar se a tarefa existe
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

    // Consultar as checklists
    const [checklists] = await pool.query(
      `SELECT
        id_checklist,
        id_tarefa,
        titulo,
        data_criacao
       FROM checklists
       WHERE id_tarefa = ?
         AND estado_registo = 'ativo'
       ORDER BY data_criacao DESC`,
      [id_tarefa]
    );

    return res.status(200).json({
      sucesso: true,
      total: checklists.length,
      checklists
    });

  } catch (error) {
    console.error("Erro ao listar checklists:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar as checklists."
    });
  }
}