import pool from "../config/database.js";

// POST /
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