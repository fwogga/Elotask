import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || !email.trim() ||
      typeof password !== "string" || !password) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Indica o email e a palavra-passe."
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const [utilizadores] = await pool.query(
      `SELECT
        id_utilizador,
        nome,
        email,
        password_hash,
        tipo_utilizador,
        estado
      FROM utilizadores
      WHERE email = ?`,
      [emailNormalizado]
    );

    if (utilizadores.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Email ou palavra-passe incorretos."
      });
    }

    const utilizador = utilizadores[0];

    if (utilizador.estado !== "ativo") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "A conta encontra-se inativa ou suspensa."
      });
    }

    const passwordValida = await bcrypt.compare(
      password,
      utilizador.password_hash
    );

    if (!passwordValida) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Email ou palavra-passe incorretos."
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não está configurado.");
    }

    const token = jwt.sign(
      {
        id: utilizador.id_utilizador,
        perfil: utilizador.tipo_utilizador
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h"
      }
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Autenticação realizada com sucesso.",
      token,
      utilizador: {
        id_utilizador: utilizador.id_utilizador,
        nome: utilizador.nome,
        email: utilizador.email,
        tipo_utilizador: utilizador.tipo_utilizador
      }
    });

  } catch (error) {
    console.error("Erro no login:", error.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao realizar a autenticação."
    });
  }
}
