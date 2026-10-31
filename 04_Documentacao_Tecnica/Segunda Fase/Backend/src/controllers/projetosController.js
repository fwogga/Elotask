import pool from "../config/database.js";

// POST /projetos
export async function criarProjeto(req, res) {
  try {
    const {
      nome,
      descricao,
      data_inicio,
      data_fim
    } = req.body;

    // Validar o nome
    if (!nome || typeof nome !== "string" || nome.trim() === "") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O nome do projeto é obrigatório."
      });
    }

    // Validar as datas, caso sejam fornecidas
    if (data_inicio && isNaN(Date.parse(data_inicio))) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de início é inválida."
      });
    }

    if (data_fim && isNaN(Date.parse(data_fim))) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de fim é inválida."
      });
    }

    // Verificar se a data de fim é posterior à data de início
    if (
      data_inicio &&
      data_fim &&
      new Date(data_fim) < new Date(data_inicio)
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de fim não pode ser anterior à data de início."
      });
    }

    // Obter o ID do utilizador autenticado
    const id_criador = req.utilizador.id;

    // Inserir o projeto na base de dados
    const [resultado] = await pool.query(
      `INSERT INTO projetos
       (nome, descricao, id_criador, data_inicio, data_fim)
       VALUES (?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        descricao || null,
        id_criador,
        data_inicio || null,
        data_fim || null
      ]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Projeto criado com sucesso.",
      id_projeto: resultado.insertId
    });

  } catch (error) {
    console.error("Erro ao criar projeto:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao criar projeto."
    });
  }
}

// GET /projetos
export async function listarProjetos(req, res) {
  try {
    const [projetos] = await pool.query(
      `SELECT
         p.id_projeto,
         p.nome,
         p.descricao,
         p.data_inicio,
         p.data_fim,
         p.estado,
         p.data_criacao,
         u.id_utilizador AS id_criador,
         u.nome AS nome_criador,
         u.email AS email_criador
       FROM projetos p
       INNER JOIN utilizadores u
         ON p.id_criador = u.id_utilizador
       ORDER BY p.data_criacao DESC`
    );

    return res.status(200).json({
      sucesso: true,
      total_projetos: projetos.length,
      projetos
    });

  } catch (error) {
    console.error("Erro ao listar projetos:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao listar projetos."
    });
  }
}

// Get /projetos/:id
export async function obterProjetoPorId(req, res) {
  try {
    const { id } = req.params;

    // Validar o ID do projeto
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto inválido."
      });
    }

    // Procurar o projeto na base de dados
    const [projetos] = await pool.query(
      `SELECT
         p.id_projeto,
         p.nome,
         p.descricao,
         p.data_inicio,
         p.data_fim,
         p.estado,
         p.data_criacao,
         u.id_utilizador AS id_criador,
         u.nome AS nome_criador,
         u.email AS email_criador
       FROM projetos p
       INNER JOIN utilizadores u
         ON p.id_criador = u.id_utilizador
       WHERE p.id_projeto = ?`,
      [id]
    );

    // Verificar se o projeto existe
    if (projetos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Projeto não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      projeto: projetos[0]
    });

  } catch (error) {
    console.error("Erro ao consultar projeto:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao consultar projeto."
    });
  }
}

// PUT /projetos/:id
export async function atualizarProjeto(req, res) {
  try {
    const { id } = req.params;

    const {
      nome,
      descricao,
      data_inicio,
      data_fim,
      estado
    } = req.body;

    // Validar o ID do projeto
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto inválido."
      });
    }

    // Validar o nome
    if (
      typeof nome !== "string" ||
      nome.trim() === ""
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O nome do projeto é obrigatório."
      });
    }

    // Estados permitidos na base de dados
    const estadosPermitidos = [
      "planeado",
      "em_curso",
      "concluido",
      "suspenso",
      "cancelado"
    ];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Estado do projeto inválido."
      });
    }

    // Validar as datas
    if (
      data_inicio &&
      isNaN(Date.parse(data_inicio))
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de início é inválida."
      });
    }

    if (
      data_fim &&
      isNaN(Date.parse(data_fim))
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de fim é inválida."
      });
    }

    // Verificar a ordem das datas
    if (
      data_inicio &&
      data_fim &&
      new Date(data_fim) < new Date(data_inicio)
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data de fim não pode ser anterior à data de início."
      });
    }

    // Verificar se o projeto existe
    const [projetos] = await pool.query(
      `SELECT id_projeto
       FROM projetos
       WHERE id_projeto = ?`,
      [id]
    );

    if (projetos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Projeto não encontrado."
      });
    }

    // Atualizar os dados do projeto
    await pool.query(
      `UPDATE projetos
       SET nome = ?,
           descricao = ?,
           data_inicio = ?,
           data_fim = ?,
           estado = ?
       WHERE id_projeto = ?`,
      [
        nome.trim(),
        descricao || null,
        data_inicio || null,
        data_fim || null,
        estado,
        id
      ]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Projeto atualizado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atualizar projeto:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao atualizar projeto."
    });
  }
}

// PUT/projetos/:id/estado

export async function atualizarEstadoProjeto(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosPermitidos = [
      "planeado",
      "em_curso",
      "concluido",
      "suspenso",
      "cancelado"
    ];

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "ID do projeto inválido."
      });
    }

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Estado do projeto inválido."
      });
    }

    const [projetos] = await pool.query(
      "SELECT id_projeto FROM projetos WHERE id_projeto = ?",
      [id]
    );

    if (projetos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Projeto não encontrado."
      });
    }

    await pool.query(
      "UPDATE projetos SET estado = ? WHERE id_projeto = ?",
      [estado, id]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Estado do projeto atualizado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atualizar estado do projeto:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar estado do projeto."
    });
  }
}