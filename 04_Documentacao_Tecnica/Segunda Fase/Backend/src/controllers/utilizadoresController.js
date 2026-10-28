import pool from "../config/database.js";
import bcrypt from "bcryptjs";

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
