const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
    host: env.database.host,
    port: env.database.port,
    user: env.database.user,
    password: env.database.password,
    database: env.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    dateStrings: true // datas devolvidas como texto "YYYY-MM-DD HH:MM:SS" (sem conversões de fuso)
});

/** Confirma que a base de dados responde (usado no arranque e no /api/health). */
pool.testConnection = async () => {
    const [rows] = await pool.query('SELECT 1 AS ok');
    return rows[0].ok === 1;
};

/** Executa `fn(conn)` dentro de uma transação (commit/rollback automáticos). */
pool.withTransaction = async (fn) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const resultado = await fn(conn);
        await conn.commit();
        return resultado;
    } catch (e) {
        try { await conn.rollback(); } catch (_) { /* ignora */ }
        throw e;
    } finally {
        conn.release();
    }
};

module.exports = pool;