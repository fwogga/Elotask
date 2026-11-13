import pool from "../../comunicacao/config/database.js";
import { registrarAlteracao } from "./historicoController.js";

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

    await registrarAlteracao({
  id_utilizador: req.utilizador.id,
  id_projeto: Number(id_projeto),
  id_tarefa: Number(id_tarefa),
  tipo_alteracao: "criacao_checklist",
  descricao: `Criou a checklist "${titulo.trim()}" na tarefa ${id_tarefa}.`
    });

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

export async function obterChecklistPorId(req, res) {
  try {
    const { id_projeto, id_tarefa, id_checklist } = req.params;

    const [checklists] = await pool.query(
      `SELECT c.id_checklist, c.id_tarefa, c.titulo, c.data_criacao
       FROM checklists c
       INNER JOIN tarefas t ON c.id_tarefa = t.id_tarefa
       WHERE c.id_checklist = ?
       AND c.id_tarefa = ?
       AND t.id_projeto = ?
       AND c.estado_registo = 'ativo'
       AND t.estado_registo = 'ativo'`,
      [id_checklist, id_tarefa, id_projeto]
    );

    if (checklists.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Checklist não encontrada."
      });
    }

    return res.status(200).json({
      sucesso: true,
      checklist: checklists[0]
    });

  } catch (error) {
    console.error("Erro ao consultar checklist:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar checklist."
    });
  }
}

export async function atualizarChecklist(req, res) {
  try {
    const { id_projeto, id_tarefa, id_checklist } = req.params;
    const { titulo } = req.body;

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

    const [resultado] = await pool.query(
      `UPDATE checklists c
       INNER JOIN tarefas t ON c.id_tarefa = t.id_tarefa
       SET c.titulo = ?
       WHERE c.id_checklist = ?
       AND c.id_tarefa = ?
       AND t.id_projeto = ?
       AND c.estado_registo = 'ativo'
       AND t.estado_registo = 'ativo'`,
      [titulo.trim(), id_checklist, id_tarefa, id_projeto]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Checklist não encontrada."
      });
    }

    await registrarAlteracao({
  id_utilizador: req.utilizador.id,
  id_projeto: Number(id_projeto),
  id_tarefa: Number(id_tarefa),
  tipo_alteracao: "atualizacao_checklist",
  descricao: `Atualizou a checklist ${id_checklist} para "${titulo.trim()}".`
    });

    return res.status(200).json({
      sucesso: true,
      mensagem: "Checklist atualizada com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atualizar checklist:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar checklist."
    });
  }
}

export async function eliminarChecklist(req, res) {
  try {
    const { id_projeto, id_tarefa, id_checklist } = req.params;

    const [resultado] = await pool.query(
      `UPDATE checklists c
       INNER JOIN tarefas t ON c.id_tarefa = t.id_tarefa
       SET c.estado_registo = 'inativo'
       WHERE c.id_checklist = ?
       AND c.id_tarefa = ?
       AND t.id_projeto = ?
       AND c.estado_registo = 'ativo'
       AND t.estado_registo = 'ativo'`,
      [id_checklist, id_tarefa, id_projeto]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Checklist não encontrada ou já inativa."
      });
    }

    await registrarAlteracao({
  id_utilizador: req.utilizador.id,
  id_projeto: Number(id_projeto),
  id_tarefa: Number(id_tarefa),
  tipo_alteracao: "eliminacao_checklist",
  descricao: `Eliminou logicamente a checklist ${id_checklist}.`
    });

    return res.status(200).json({
      sucesso: true,
      mensagem: "Checklist eliminada com sucesso."
    });

  } catch (error) {
    console.error("Erro ao eliminar checklist:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao eliminar checklist."
    });
  }
}

export async function listarChecklistsInativas(req, res) {
  try {
    const { id_projeto, id_tarefa } = req.params;

    const [checklists] = await pool.query(
      `SELECT c.id_checklist, c.id_tarefa, c.titulo, c.data_criacao
       FROM checklists c
       INNER JOIN tarefas t ON c.id_tarefa = t.id_tarefa
       WHERE c.id_tarefa = ?
       AND t.id_projeto = ?
       AND c.estado_registo = 'inativo'
       AND t.estado_registo = 'ativo'
       ORDER BY c.data_criacao DESC`,
      [id_tarefa, id_projeto]
    );

    return res.status(200).json({
      sucesso: true,
      total: checklists.length,
      checklists
    });

  } catch (error) {
    console.error("Erro ao listar checklists inativas:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar checklists inativas."
    });
  }
}

export async function reativarChecklist(req, res) {
  try {
    const { id_projeto, id_tarefa, id_checklist } = req.params;

    const [resultado] = await pool.query(
      `UPDATE checklists c
       INNER JOIN tarefas t ON c.id_tarefa = t.id_tarefa
       SET c.estado_registo = 'ativo'
       WHERE c.id_checklist = ?
       AND c.id_tarefa = ?
       AND t.id_projeto = ?
       AND c.estado_registo = 'inativo'
       AND t.estado_registo = 'ativo'`,
      [id_checklist, id_tarefa, id_projeto]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Checklist inativa não encontrada."
      });
    }

    await registrarAlteracao({
  id_utilizador: req.utilizador.id,
  id_projeto: Number(id_projeto),
  id_tarefa: Number(id_tarefa),
  tipo_alteracao: "reativacao_checklist",
  descricao: `Reativou a checklist ${id_checklist}.`
});

    return res.status(200).json({
      sucesso: true,
      mensagem: "Checklist reativada com sucesso."
    });

  } catch (error) {
    console.error("Erro ao reativar checklist:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao reativar checklist."
    });
  }
}