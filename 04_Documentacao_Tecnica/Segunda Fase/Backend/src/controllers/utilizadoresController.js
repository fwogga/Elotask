import pool from "../config/database.js";
import bcrypt from "bcryptjs";

// GET /utilizadores

export async function listarUtilizadores(req, res) {
  try {
    const [utilizadores] = await pool.query(`
      SELECT
        id_utilizador,
        nome,
        email,
        tipo_utilizador,
        telefone,
        foto_perfil,
        cargo,
        estado,
        data_criacao
      FROM utilizadores
      ORDER BY id_utilizador
    `);

    return res.status(200).json({
      sucesso: true,
      total: utilizadores.length,
      dados: utilizadores
    });
  } catch (error) {
    console.error("Erro ao listar utilizadores:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao consultar os utilizadores."
    });
  }
}

// GET /utilizadores/:id

export async function obterUtilizadorPorId(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O ID do utilizador é inválido."
      });
    }

    const [utilizadores] = await pool.query(
      `SELECT
        id_utilizador,
        nome,
        email,
        tipo_utilizador,
        telefone,
        foto_perfil,
        cargo,
        estado,
        data_criacao
      FROM utilizadores
      WHERE id_utilizador = ?`,
      [id]
    );

    if (utilizadores.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Utilizador não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      dados: utilizadores[0]
    });
  } catch (error) {
    console.error("Erro ao consultar utilizador:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao consultar o utilizador."
    });
  }
}

// POST /utilizadores

export async function criarUtilizador(req, res) {
  try {
    const {
      nome,
      email,
      password,
      tipo_utilizador = "colaborador",
      telefone,
      cargo
    } = req.body;

    if (typeof nome !== "string" || !nome.trim() || typeof email !== "string" ||
      !email.trim() || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Indica o nome, o email e uma palavra-passe com pelo menos 8 caracteres."
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const tiposPermitidos = [
      "admin",
      "gestor",
      "colaborador"
    ];

    if (!tiposPermitidos.includes(tipo_utilizador)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O tipo de utilizador é inválido."
      });
    }

    const [existentes] = await pool.query(
      "SELECT id_utilizador FROM utilizadores WHERE email = ?",
      [emailNormalizado]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Já existe um utilizador com esse email."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [resultado] = await pool.query(
      `INSERT INTO utilizadores
        (nome, email, password_hash, tipo_utilizador, telefone, cargo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        emailNormalizado,
        passwordHash,
        tipo_utilizador,
        telefone || null,
        cargo || null
      ]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Utilizador criado com sucesso.",
      dados: {
        id_utilizador: resultado.insertId,
        nome: nome.trim(),
        email: emailNormalizado,
        tipo_utilizador,
        telefone: telefone || null,
        cargo: cargo || null
      }
    });
  } catch (error) {
    console.error("Erro ao criar utilizador:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao criar o utilizador."
    });
  }
}

//PATCH /utilizadores/:id

export async function atualizarUtilizador(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O ID do utilizador é inválido."
      });
    }

    const camposPermitidos = [
      "nome",
      "email",
      "password",
      "tipo_utilizador",
      "telefone",
      "foto_perfil",
      "cargo",
      "estado"
    ];

    const dados = req.body;

    if (
      !dados ||
      typeof dados !== "object" ||
      Array.isArray(dados)
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Os dados enviados são inválidos."
      });
    }

    const camposRecebidos = Object.keys(dados);

    if (camposRecebidos.length === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Indica pelo menos um campo para atualizar."
      });
    }

    const campoInvalido = camposRecebidos.some(
      campo => !camposPermitidos.includes(campo)
    );

    if (campoInvalido) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Foi enviado um campo não permitido."
      });
    }

    const [registos] = await pool.query(
      "SELECT id_utilizador FROM utilizadores WHERE id_utilizador = ?",
      [id]
    );

    if (registos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Utilizador não encontrado."
      });
    }

    const atualizacoes = {};
    const tiposPermitidos = [
      "admin",
      "gestor",
      "colaborador"
    ];
    const estadosPermitidos = [
      "ativo",
      "inativo",
      "suspenso"
    ];

    for (const campo of camposRecebidos) {
      const valor = dados[campo];

      if (
        ["nome", "email", "password", "tipo_utilizador", "estado"]
          .includes(campo) &&
        (typeof valor !== "string" || !valor.trim())
      ) {
        return res.status(400).json({
          sucesso: false,
          mensagem: `O campo ${campo} é inválido.`
        });
      }

      if (campo === "nome") {
        atualizacoes.nome = valor.trim();
      }

      if (campo === "email") {
        atualizacoes.email = valor.trim().toLowerCase();
      }

      if (campo === "password") {
        if (valor.length < 8) {
          return res.status(400).json({
            sucesso: false,
            mensagem: "A palavra-passe deve ter pelo menos 8 caracteres."
          });
        }

        atualizacoes.password_hash = await bcrypt.hash(valor, 12);
      }

      if (campo === "tipo_utilizador") {
        if (!tiposPermitidos.includes(valor)) {
          return res.status(400).json({
            sucesso: false,
            mensagem: "O tipo de utilizador é inválido."
          });
        }

        atualizacoes.tipo_utilizador = valor;
      }

      if (campo === "estado") {
        if (!estadosPermitidos.includes(valor)) {
          return res.status(400).json({
            sucesso: false,
            mensagem: "O estado do utilizador é inválido."
          });
        }

        atualizacoes.estado = valor;
      }

      if (campo === "telefone" || campo === "cargo") {
        if (
          valor !== null &&
          typeof valor !== "string"
        ) {
          return res.status(400).json({
            sucesso: false,
            mensagem: `O campo ${campo} deve ser texto ou null.`
          });
        }

        atualizacoes[campo] =
          typeof valor === "string" ? valor.trim() || null : null;
      }

      if (campo === "foto_perfil") {
        if (
          valor !== null &&
          typeof valor !== "string"
        ) {
          return res.status(400).json({
            sucesso: false,
            mensagem: "O campo foto_perfil é inválido."
          });
        }

        atualizacoes.foto_perfil = valor;
      }
    }

    if (atualizacoes.email) {
      const [emails] = await pool.query(
        `SELECT id_utilizador
         FROM utilizadores
         WHERE email = ? AND id_utilizador <> ?`,
        [atualizacoes.email, id]
      );

      if (emails.length > 0) {
        return res.status(409).json({
          sucesso: false,
          mensagem: "Esse email já pertence a outro utilizador."
        });
      }
    }

    const campos = Object.keys(atualizacoes);
    const valores = Object.values(atualizacoes);

    const clausulas = campos.map(
      campo => `\`${campo}\` = ?`
    );

    await pool.query(
      `UPDATE utilizadores
       SET ${clausulas.join(", ")}
       WHERE id_utilizador = ?`,
      [...valores, id]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Utilizador atualizado com sucesso."
    });
  } catch (error) {
    console.error("Erro ao atualizar utilizador:", error.message);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Já existe um registo com esses dados."
      });
    }

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao atualizar o utilizador."
    });
  }
}

//DELETE /utilizadores/:id

export async function eliminarUtilizador(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O ID do utilizador é inválido."
      });
    }

    const [utilizadores] = await pool.query(
      `SELECT id_utilizador, estado
       FROM utilizadores
       WHERE id_utilizador = ?`,
      [id]
    );

    if (utilizadores.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Utilizador não encontrado."
      });
    }

    if (utilizadores[0].estado === "inativo") {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Este utilizador já se encontra inativo."
      });
    }

    await pool.query(
      `UPDATE utilizadores
       SET estado = 'inativo'
       WHERE id_utilizador = ?`,
      [id]
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Utilizador desativado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao desativar utilizador:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao desativar o utilizador."
    });
  }
}