import pool from "./database.js";

try {
  const [rows] = await pool.query("SELECT 1 AS resultado");

  console.log("Ligação ao MySQL estabelecida com sucesso!");
  console.log("Resultado do teste:", rows[0].resultado);
} catch (error) {
  console.error("Erro ao ligar ao MySQL:", error.message);
} finally {
  await pool.end();
}
