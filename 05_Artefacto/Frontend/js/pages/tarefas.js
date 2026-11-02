import {
  getTarefas,
  getProjetos,
  getUtilizadores,
  criarTarefa,
  atualizarTarefa,
  apagarTarefa,
} from "../api/client.js";
import { esc, dataCurta, estaAtrasada, chaveDia, icone, avatar, porId, aviso, confirmar } from "../comum.js";

const PRIORIDADES = {
  alta: { rotulo: "Alta", classe: "erro" },
  media: { rotulo: "Média", classe: "aviso" },
  baixa: { rotulo: "Baixa", classe: "sucesso" },
};

const estado = { tarefas: [], projetos: new Map(), pessoas: new Map(), editarId: null };
const filtros = { texto: "", projeto: "", responsavel: "", prioridade: "" };

const dialogo = document.querySelector("[data-dialogo-tarefa]");
const form = document.querySelector("[data-form-tarefa]");

// --- Quadro ---------------------------------------------------------------

function passaFiltros(t) {
  return (!filtros.texto || t.titulo.toLowerCase().includes(filtros.texto))
    && (!filtros.projeto || t.projetoId === Number(filtros.projeto))
    && (!filtros.responsavel || t.responsaveis.includes(Number(filtros.responsavel)))
    && (!filtros.prioridade || t.prioridade === filtros.prioridade);
}

function cartao(t) {
  const prioridade = PRIORIDADES[t.prioridade] ?? PRIORIDADES.media;
  const atrasada = t.estado !== "concluida" && estaAtrasada(t.prazo);
  const pessoas = t.responsaveis.map((id) => avatar(estado.pessoas.get(id), "sm")).join("");

  return `
    <li class="cartao tarefa-cartao" draggable="true" data-id="${t.id}">
      <h3 class="tarefa-cartao__titulo">
        <button class="tarefa-cartao__abrir" type="button" data-abrir="${t.id}">${esc(t.titulo)}</button>
      </h3>
      <p class="tarefa-cartao__projeto">${icone("folder.svg", 20)} ${esc(estado.projetos.get(t.projetoId)?.nome ?? "Sem projeto")}</p>
      <div class="tarefa-cartao__rodape">
        <span class="pilha-avatares">${pessoas}</span>
        <span class="tarefa-cartao__prazo${atrasada ? " tarefa-cartao__prazo--atrasada" : ""}">
          ${icone("calendar-plain.svg", 20)} ${dataCurta(t.prazo)}${atrasada ? '<span class="sr-only"> (atrasada)</span>' : ""}
        </span>
        <span class="etiqueta etiqueta--${prioridade.classe}">${prioridade.rotulo}</span>
      </div>
    </li>`;
}

function renderQuadro() {
  const visiveis = estado.tarefas
    .filter(passaFiltros)
    .sort((a, b) => a.prazo.localeCompare(b.prazo));

  for (const coluna of document.querySelectorAll(".coluna")) {
    const daColuna = visiveis.filter((t) => t.estado === coluna.dataset.estado);
    coluna.querySelector("[data-contagem]").textContent = `(${daColuna.length})`;
    coluna.querySelector("[data-lista]").innerHTML = daColuna.length
      ? daColuna.map(cartao).join("")
      : '<li class="coluna__vazia">Sem tarefas. Arrasta uma para aqui.</li>';
  }
}

async function mudarEstado(id, novoEstado) {
  const tarefa = estado.tarefas.find((t) => t.id === id);
  if (!tarefa || tarefa.estado === novoEstado) return;
  Object.assign(tarefa, await atualizarTarefa(id, { estado: novoEstado }));
  renderQuadro();
  aviso(`"${tarefa.titulo}" movida.`);
}

// --- Arrastar entre colunas ------------------------------------------------

function ativarArrastar() {
  const quadro = document.querySelector(".quadro");

  quadro.addEventListener("dragstart", (e) => {
    const el = e.target.closest(".tarefa-cartao");
    if (!el) return;
    e.dataTransfer.setData("text/plain", el.dataset.id);
    e.dataTransfer.effectAllowed = "move";
    el.classList.add("tarefa-cartao--a-arrastar");
  });

  quadro.addEventListener("dragend", (e) => {
    e.target.closest(".tarefa-cartao")?.classList.remove("tarefa-cartao--a-arrastar");
    document.querySelectorAll(".coluna--alvo").forEach((c) => c.classList.remove("coluna--alvo"));
  });

  for (const coluna of document.querySelectorAll(".coluna")) {
    coluna.addEventListener("dragover", (e) => {
      e.preventDefault();
      coluna.classList.add("coluna--alvo");
    });
    coluna.addEventListener("dragleave", (e) => {
      if (!coluna.contains(e.relatedTarget)) coluna.classList.remove("coluna--alvo");
    });
    coluna.addEventListener("drop", (e) => {
      e.preventDefault();
      coluna.classList.remove("coluna--alvo");
      mudarEstado(Number(e.dataTransfer.getData("text/plain")), coluna.dataset.estado);
    });
  }
}

// --- Formulário (criar / editar) ------------------------------------------

function preencherOpcoes() {
  const projetos = [...estado.projetos.values()];
  const pessoas = [...estado.pessoas.values()];

  const opcoesProjeto = projetos.map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("");
  form.projetoId.innerHTML = `<option value="">Escolher projeto</option>${opcoesProjeto}`;
  document.querySelector('[data-filtro="projeto"]').insertAdjacentHTML(
    "beforeend",
    projetos.map((p) => `<option value="${p.id}">Projeto: ${esc(p.nome)}</option>`).join("")
  );
  document.querySelector('[data-filtro="responsavel"]').insertAdjacentHTML(
    "beforeend",
    pessoas.map((u) => `<option value="${u.id}">Responsável: ${esc(u.nome)}</option>`).join("")
  );
  document.querySelector("[data-responsaveis]").innerHTML = pessoas.map((u) => `
    <label class="escolha">
      <input type="checkbox" name="responsaveis" value="${u.id}">
      ${avatar(u, "sm")} ${esc(u.nome)}
    </label>`).join("");
}

function limparErros() {
  form.querySelectorAll(".campo__erro").forEach((p) => (p.textContent = ""));
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
}

function erro(campo, texto) {
  document.getElementById(`erro-tarefa-${campo}`).textContent = texto;
  form.querySelector(`[name="${campo === "projeto" ? "projetoId" : campo}"]`)?.setAttribute("aria-invalid", "true");
}

function abrirFormulario(tarefa = null) {
  estado.editarId = tarefa?.id ?? null;
  form.reset();
  limparErros();
  document.getElementById("dialogo-tarefa-titulo").textContent = tarefa ? "Editar tarefa" : "Nova tarefa";
  form.querySelector("[data-apagar]").hidden = !tarefa;

  if (tarefa) {
    form.titulo.value = tarefa.titulo;
    form.projetoId.value = tarefa.projetoId;
    form.prazo.value = tarefa.prazo;
    form.prioridade.value = tarefa.prioridade;
    form.estado.value = tarefa.estado;
    form.querySelectorAll('[name="responsaveis"]').forEach((c) => (c.checked = tarefa.responsaveis.includes(Number(c.value))));
  } else {
    form.prazo.value = chaveDia(new Date());
    if (filtros.projeto) form.projetoId.value = filtros.projeto;
  }

  dialogo.showModal();
  form.titulo.focus();
}

function lerFormulario() {
  limparErros();
  const dados = {
    titulo: form.titulo.value.trim(),
    projetoId: Number(form.projetoId.value) || null,
    prazo: form.prazo.value,
    prioridade: form.prioridade.value,
    estado: form.estado.value,
    responsaveis: [...form.querySelectorAll('[name="responsaveis"]:checked')].map((c) => Number(c.value)),
  };

  let valido = true;
  if (!dados.titulo) { erro("titulo", "Escreve um título."); valido = false; }
  if (!dados.projetoId) { erro("projeto", "Escolhe o projeto."); valido = false; }
  if (!dados.prazo) { erro("prazo", "Escolhe a data-limite."); valido = false; }
  if (!dados.responsaveis.length) { erro("responsaveis", "Escolhe pelo menos um responsável."); valido = false; }

  if (!valido) form.querySelector('[aria-invalid="true"], .campo__erro:not(:empty)')?.closest(".campo")?.querySelector("input, select")?.focus();
  return valido ? dados : null;
}

async function guardar(e) {
  e.preventDefault();
  const dados = lerFormulario();
  if (!dados) return;

  if (estado.editarId) {
    const atualizada = await atualizarTarefa(estado.editarId, dados);
    Object.assign(estado.tarefas.find((t) => t.id === estado.editarId), atualizada);
    aviso("Tarefa atualizada.");
  } else {
    estado.tarefas.push(await criarTarefa(dados));
    aviso("Tarefa criada.");
  }
  dialogo.close();
  renderQuadro();
}

async function apagar() {
  const tarefa = estado.tarefas.find((t) => t.id === estado.editarId);
  dialogo.close();
  if (!(await confirmar(`Apagar a tarefa "${tarefa.titulo}"?`, "Apagar"))) return;
  await apagarTarefa(tarefa.id);
  estado.tarefas = estado.tarefas.filter((t) => t.id !== tarefa.id);
  renderQuadro();
  aviso("Tarefa apagada.");
}

// --- Arranque -------------------------------------------------------------

function ligarEventos() {
  document.querySelector("[data-nova-tarefa]").addEventListener("click", () => abrirFormulario());
  document.querySelector(".quadro").addEventListener("click", (e) => {
    const botao = e.target.closest("[data-abrir]");
    if (botao) abrirFormulario(estado.tarefas.find((t) => t.id === Number(botao.dataset.abrir)));
  });

  form.addEventListener("submit", guardar);
  form.addEventListener("input", (e) => {
    const campo = e.target.closest(".campo");
    if (!campo) return;
    campo.querySelector(".campo__erro").textContent = "";
    campo.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  });
  form.querySelector("[data-cancelar]").addEventListener("click", () => dialogo.close());
  form.querySelector("[data-apagar]").addEventListener("click", apagar);

  document.querySelector("[data-pesquisa]").addEventListener("submit", (e) => e.preventDefault());
  document.getElementById("pesquisa").addEventListener("input", (e) => {
    filtros.texto = e.target.value.trim().toLowerCase();
    renderQuadro();
  });
  for (const select of document.querySelectorAll("[data-filtro]")) {
    select.addEventListener("change", () => {
      filtros[select.dataset.filtro] = select.value;
      renderQuadro();
    });
  }
  ativarArrastar();
}

async function iniciar() {
  const [tarefas, projetos, pessoas] = await Promise.all([getTarefas(), getProjetos(), getUtilizadores()]);
  estado.tarefas = tarefas;
  estado.projetos = porId(projetos);
  estado.pessoas = porId(pessoas);

  preencherOpcoes();
  ligarEventos();

  // Links vindos de outras páginas: ?projeto=1 filtra, ?tarefa=3 abre a tarefa, ?nova=1 abre o formulário
  const params = new URLSearchParams(location.search);
  if (params.get("projeto")) {
    filtros.projeto = params.get("projeto");
    document.querySelector('[data-filtro="projeto"]').value = filtros.projeto;
  }
  renderQuadro();
  if (params.get("tarefa")) {
    const tarefa = estado.tarefas.find((t) => t.id === Number(params.get("tarefa")));
    if (tarefa) abrirFormulario(tarefa);
  } else if (params.get("nova")) {
    abrirFormulario();
  }
}

iniciar().catch((erro) => {
  console.error(erro);
  document.querySelector(".conteudo").insertAdjacentHTML(
    "beforeend",
    '<p class="erro-carregar" role="alert">Não foi possível carregar as tarefas. Tenta novamente.</p>'
  );
});
