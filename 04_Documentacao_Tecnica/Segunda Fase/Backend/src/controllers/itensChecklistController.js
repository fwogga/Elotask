import pool from "../config/database.js";

// Criar item numa checklist
export async function criarItemChecklist(req, res) {
  try {
    const { id_projeto, id_tarefa, id_checklist } = req.params;
    const { descricao, ordem } = req.body;

    if (!descricao || typeof descricao !== "string" || !descricao.trim()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A descrição do item é obrigatória."
      });
    }

    if (descricao.trim().length > 255) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A descrição não pode ultrapassar 255 caracteres."
      });
    }

    if (
      ordem !== undefined &&
      (!Number.isInteger(Number(ordem)) || Number(ordem) <= 0)
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A ordem deve ser um número inteiro positivo."
      });
    }

    const [checklists] = await pool.query(
      `SELECT c.id_checklist
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

    const [resultado] = await pool.query(
      `INSERT INTO itens_checklist
       (id_checklist, descricao, ordem)
       VALUES (?, ?, ?)`,
      [id_checklist, descricao.trim(), ordem || 1]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Item adicionado à checklist com sucesso.",
      id_item: resultado.insertId
    });

  } catch (error) {
    console.error("Erro ao criar item:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar item da checklist."
    });
  }
}


// Listar itens ativos de uma checklist
export async function listarItensChecklist(req, res) {
  try {
    const { id_projeto, id_tarefa, id_checklist } = req.params;

    const [checklists] = await pool.query(
      `SELECT c.id_checklist
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

    const [itens] = await pool.query(
      `SELECT id_item, id_checklist, descricao,
              estado, ordem, data_conclusao
       FROM itens_checklist
       WHERE id_checklist = ?
       AND estado_registo = 'ativo'
       ORDER BY ordem ASC, id_item ASC`,
      [id_checklist]
    );

    return res.status(200).json({
      sucesso: true,
      total: itens.length,
      itens
    });

  } catch (error) {
    console.error("Erro ao listar itens:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar itens da checklist."
    });
  }
}


// Atualizar a descrição e a ordem de um item
export async function atualizarItemChecklist(req, res) {
  try {
    const { id_projeto, id_tarefa, id_checklist, id_item } = req.params;
    const { descricao, ordem } = req.body;

    if (descricao !== undefined &&
        (typeof descricao !== "string" || !descricao.trim() ||
         descricao.trim().length > 255)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A descrição deve conter entre 1 e 255 caracteres."
      });
    }

    if (
      ordem !== undefined &&
      (!Number.isInteger(Number(ordem)) || Number(ordem) <= 0)
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A ordem deve ser um número inteiro positivo."
      });
    }

    if (descricao === undefined && ordem === undefined) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Indica a descrição ou a ordem que pretendes atualizar."
      });
    }

    const [itens] = await pool.query(
      `SELECT i.id_item
       FROM itens_checklist i
       INNER JOIN checklists c ON i.id_checklist = c.id_checklist
       INNER JOIN tarefas t ON c.id_tarefa = t.id_tarefa
       WHERE i.id_item = ?
       AND c.id_checklist = ?
       AND c.id_tarefa = ?
       AND t.id_projeto = ?
       AND c.estado_registo = 'ativo'
       AND t.estado_registo = 'ativo'`,
      [id_item, id_checklist, id_tarefa, id_projeto]
    );

    if (itens.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Item não encontrado."
      });
    }

    const campos = [];
    const valores = [];

    if (descricao !== undefined) {
      campos.push("descricao = ?");
      valores.push(descricao.trim());
    }

    if (ordem !== undefined) {
      campos.push("ordem = ?");
      valores.push(Number(ordem));
    }

    valores.push(id_item);

    await pool.query(
      `UPDATE itens_checklist
       SET ${campos.join(", ")}
       WHERE id_item = ?`,
      valores
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Item atualizado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atualizar item:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar item da checklist."
    });
  }
}


// Alterar o estado de um item
export async function atualizarEstadoItemChecklist(req, res) {
  try {
    const { id_projeto, id_tarefa, id_checklist, id_item } = req.params;
    const { estado } = req.body;

    const estadosPermitidos = ["por_fazer", "a_fazer", "feito"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Estado inválido. Utiliza por_fazer, a_fazer ou feito."
      });
    }

    const [resultado] = await pool.query(
      `UPDATE itens_checklist i
       INNER JOIN checklists c ON i.id_checklist = c.id_checklist
       INNER JOIN tarefas t ON c.id_tarefa = t.id_tarefa
       SET i.estado = ?,
           i.data_conclusao = ${
             estado === "feito" ? "CURRENT_TIMESTAMP" : "NULL"
           }
       WHERE i.id_item = ?
       AND c.id_checklist = ?
       AND c.id_tarefa = ?
       AND t.id_projeto = ?
       AND c.estado_registo = 'ativo'
       AND t.estado_registo = 'ativo'`,
      [estado, id_item, id_checklist, id_tarefa, id_projeto]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Item não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Estado do item atualizado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao atualizar estado:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar estado do item."
    });
  }
}


// Eliminar um item
export async function eliminarItemChecklist(req, res) {
  try {
    const { id_projeto, id_tarefa, id_checklist, id_item } = req.params;

    const [resultado] = await pool.query(
      `UPDATE itens_checklist i
       INNER JOIN checklists c ON i.id_checklist = c.id_checklist
       INNER JOIN tarefas t ON c.id_tarefa = t.id_tarefa
       SET i.estado_registo = 'inativo'
       WHERE i.id_item = ?
       AND c.id_checklist = ?
       AND c.id_tarefa = ?
       AND t.id_projeto = ?
       AND i.estado_registo = 'ativo'
       AND c.estado_registo = 'ativo'
       AND t.estado_registo = 'ativo'`,
      [id_item, id_checklist, id_tarefa, id_projeto]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Item não encontrado ou já inativo."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Item eliminado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao eliminar item:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao eliminar item da checklist."
    });
  }
}

// Listar itens inativos de uma checklist
export async function listarItensInativos(req, res) {
  try {
    const { id_projeto, id_tarefa, id_checklist } = req.params;

    const [itens] = await pool.query(
      `SELECT i.id_item, i.id_checklist, i.descricao,
              i.estado, i.ordem, i.data_conclusao
       FROM itens_checklist i
       INNER JOIN checklists c ON i.id_checklist = c.id_checklist
       INNER JOIN tarefas t ON c.id_tarefa = t.id_tarefa
       WHERE c.id_checklist = ?
       AND c.id_tarefa = ?
       AND t.id_projeto = ?
       AND i.estado_registo = 'inativo'
       AND c.estado_registo = 'ativo'
       AND t.estado_registo = 'ativo'
       ORDER BY i.ordem ASC`,
      [id_checklist, id_tarefa, id_projeto]
    );

    return res.status(200).json({
      sucesso: true,
      total: itens.length,
      itens
    });

  } catch (error) {
    console.error("Erro ao listar itens inativos:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar itens inativos."
    });
  }
}

// Reativar um item
export async function reativarItemChecklist(req, res) {
  try {
    const { id_projeto, id_tarefa, id_checklist, id_item } = req.params;

    const [resultado] = await pool.query(
      `UPDATE itens_checklist i
       INNER JOIN checklists c ON i.id_checklist = c.id_checklist
       INNER JOIN tarefas t ON c.id_tarefa = t.id_tarefa
       SET i.estado_registo = 'ativo'
       WHERE i.id_item = ?
       AND c.id_checklist = ?
       AND c.id_tarefa = ?
       AND t.id_projeto = ?
       AND i.estado_registo = 'inativo'
       AND c.estado_registo = 'ativo'
       AND t.estado_registo = 'ativo'`,
      [id_item, id_checklist, id_tarefa, id_projeto]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Item inativo não encontrado."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Item reativado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao reativar item:", error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao reativar item."
    });
  }
}