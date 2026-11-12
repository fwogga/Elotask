const pool = require('../config/database');

const exec = (db) => db || pool;

// Só leitura: os projetos e as tarefas pertencem a outro módulo (gestão de tarefas).
// Aqui só se lê o necessário para dar contexto à IA e para verificar quem pertence ao projeto.

async function obterPorId(idProjeto, db) {
    const [rows] = await exec(db).query(
        'SELECT id_projeto, nome, descricao, estado FROM projetos WHERE id_projeto = ?',
        [idProjeto]
    );
    return rows[0] || null;
}

async function ehMembro(idProjeto, idUtilizador, db) {
    const [rows] = await exec(db).query(
        'SELECT 1 FROM projeto_membros WHERE id_projeto = ? AND id_utilizador = ?',
        [idProjeto, idUtilizador]
    );
    return rows.length > 0;
}

/** Tarefas ativas do projeto, com os NOMES dos responsáveis (nunca emails nem telefones). */
async function listarTarefasParaIA(idProjeto, limite = 100, db) {
    const [rows] = await exec(db).query(
        `SELECT t.id_tarefa, t.titulo, t.descricao, t.prioridade, t.estado, t.prazo,
                GROUP_CONCAT(u.nome ORDER BY u.nome SEPARATOR '||') AS responsaveis
           FROM tarefas t
           LEFT JOIN tarefa_responsaveis tr ON tr.id_tarefa = t.id_tarefa
           LEFT JOIN utilizadores u ON u.id_utilizador = tr.id_utilizador
          WHERE t.id_projeto = ? AND t.estado <> 'cancelada'
          GROUP BY t.id_tarefa, t.titulo, t.descricao, t.prioridade, t.estado, t.prazo
          ORDER BY t.prazo IS NULL, t.prazo, t.id_tarefa
          LIMIT ?`,
        [idProjeto, limite]
    );
    return rows.map((r) => ({ ...r, responsaveis: r.responsaveis ? r.responsaveis.split('||') : [] }));
}

module.exports = { obterPorId, ehMembro, listarTarefasParaIA };