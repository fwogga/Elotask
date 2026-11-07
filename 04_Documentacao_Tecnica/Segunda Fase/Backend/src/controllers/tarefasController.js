import pool from "../config/database.js";

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

    // Validar as datas
    const validarData = (data) => {
      return (
        typeof data === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(data) &&
        !Number.isNaN(Date.parse(`${data}T00:00:00Z`)) &&
        new Date(`${data}T00:00:00Z`).toISOString().slice(0, 10) === data
      );
    };

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