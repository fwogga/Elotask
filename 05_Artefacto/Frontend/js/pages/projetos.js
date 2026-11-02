import {
  getProjetos,
  getProjeto,
  getUtilizadores,
  getTarefas,
  getDocumentos,
  getReunioes,
} from "../api/client.js";
import { cartaoProjeto, ESTADOS_PROJETO, esc, dataCurta, dataCompleta, intervalo, extensao, icone, avatar, porId } from "../comum.js";

const ESTADOS_TAREFA = {
  por_fazer: { rotulo: "Por fazer", classe: "aviso" },
  em_progresso: { rotulo: "Em progresso", classe: "aviso" },
  concluida: { rotulo: "Concluída", classe: "sucesso" },
};

const vazio = (texto) => `<li class="vazio">${texto}</li>`;

// --- Lista ----------------------------------------------------------------

async function mostrarLista() {
  document.querySelector('[data-vista="lista"]').hidden = false;
  const projetos = await getProjetos();
  document.querySelector("[data-lista-projetos]").innerHTML = projetos.length
    ? projetos.map(cartaoProjeto).join("")
    : vazio("Ainda não há projetos.");
}

// --- Detalhe --------------------------------------------------------------

function membro(u, gestorId) {
  const coroa = u.id === gestorId
    ? `<img src="../assets/icons/crown.svg" alt="Gestor do projeto" title="Gestor do projeto" width="24" height="24">`
    : "";
  return `
    <li>
      <div class="membro">
        ${avatar(u, "lg")}
        <div class="membro__texto">
          <p class="membro__nome">${esc(u.nome)}</p>
          <p class="membro__funcao">${esc(u.funcao)}</p>
        </div>
        ${coroa}
      </div>
    </li>`;
}

function linhaTarefa(t, pessoas) {
  const e = ESTADOS_TAREFA[t.estado];
  const nomes = t.responsaveis.map((id) => pessoas.get(id)?.nome).filter(Boolean).join(", ");
  return `
    <li class="linha">
      <div class="linha__principal">
        <p class="linha__titulo"><a href="tarefas.html?tarefa=${t.id}">${esc(t.titulo)}</a></p>
        <p class="linha__meta">${esc(nomes)} · até ${dataCurta(t.prazo)}</p>
      </div>
      <span class="etiqueta etiqueta--${e.classe}">${e.rotulo}</span>
    </li>`;
}

function linhaDocumento(d) {
  return `
    <li class="linha">
      <div class="linha__principal">
        <p class="linha__titulo">${esc(d.nome)}</p>
        <p class="linha__meta">${extensao(d.nome)} · modificado a ${dataCompleta(d.modificadoEm)}</p>
      </div>
    </li>`;
}

function linhaReuniao(r) {
  return `
    <li class="linha">
      ${icone("meeting.svg", 26)}
      <div class="linha__principal">
        <p class="linha__titulo">${esc(r.titulo)}</p>
        <p class="linha__meta">${intervalo(r.inicio, r.fim)}</p>
      </div>
      <span class="linha__meta">${r.participantes.length} participantes</span>
    </li>`;
}

function ativarSeparadores() {
  const separadores = [...document.querySelectorAll('[role="tab"]')];

  const escolher = (alvo) => {
    for (const s of separadores) {
      const ativo = s === alvo;
      s.setAttribute("aria-selected", String(ativo));
      s.tabIndex = ativo ? 0 : -1;
      document.getElementById(s.getAttribute("aria-controls")).hidden = !ativo;
    }
    alvo.focus();
  };

  for (const [i, s] of separadores.entries()) {
    s.addEventListener("click", () => escolher(s));
    // Setas esquerda/direita mudam de separador (padrão de acessibilidade para tabs)
    s.addEventListener("keydown", (e) => {
      const passo = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (passo) escolher(separadores[(i + passo + separadores.length) % separadores.length]);
    });
  }
}

async function mostrarDetalhe(id) {
  const [projeto, pessoasLista, tarefas, documentos, reunioes] = await Promise.all([
    getProjeto(id),
    getUtilizadores(),
    getTarefas(),
    getDocumentos(),
    getReunioes(),
  ]);
  const pessoas = porId(pessoasLista);
  const membros = projeto.membros.map((m) => pessoas.get(m)).filter(Boolean);
  const estado = ESTADOS_PROJETO[projeto.estado] ?? ESTADOS_PROJETO.em_andamento;

  document.title = `${projeto.nome} · EloTask`;
  document.querySelector('[data-vista="detalhe"]').hidden = false;
  document.querySelector("[data-nome]").textContent = projeto.nome;

  const etiqueta = document.querySelector("[data-estado]");
  etiqueta.className = `etiqueta etiqueta--${estado.classe} projeto-meta__estado`;
  if (estado.classe !== "sucesso") {
    etiqueta.classList.add("etiqueta--ponto");
    etiqueta.querySelector("img").remove();
  }
  document.querySelector("[data-estado-texto]").textContent = estado.rotulo;
  document.querySelector("[data-datas]").textContent = `${dataCompleta(projeto.inicio)} - ${dataCompleta(projeto.fim)}`;

  document.querySelector("[data-descricao]").textContent = projeto.descricao;
  document.querySelector("[data-objetivos]").innerHTML = projeto.objetivos.map((o) => `<li>${esc(o)}</li>`).join("");
  document.querySelector("[data-membros-resumo]").innerHTML = membros.map((u) => membro(u, projeto.gestorId)).join("");
  document.querySelector("[data-membros]").innerHTML = membros.map((u) => membro(u, projeto.gestorId)).join("");
  document.querySelector("[data-progresso]").innerHTML = `
    <div class="progresso__trilho" role="progressbar" aria-valuenow="${projeto.progresso}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso do projeto">
      <div class="progresso__barra" style="width: ${projeto.progresso}%"></div>
    </div>
    <span>${projeto.progresso}%</span>`;

  const doProjeto = (lista) => lista.filter((x) => x.projetoId === projeto.id);
  const tarefasProjeto = doProjeto(tarefas).sort((a, b) => a.prazo.localeCompare(b.prazo));
  document.querySelector("[data-tarefas]").innerHTML = tarefasProjeto.length
    ? tarefasProjeto.map((t) => linhaTarefa(t, pessoas)).join("")
    : vazio("Este projeto ainda não tem tarefas.");
  document.querySelector("[data-documentos]").innerHTML = doProjeto(documentos).map(linhaDocumento).join("") || vazio("Sem documentos neste projeto.");
  document.querySelector("[data-reunioes]").innerHTML = doProjeto(reunioes).map(linhaReuniao).join("") || vazio("Sem reuniões neste projeto.");

  document.querySelector("[data-link-quadro]").href = `tarefas.html?projeto=${projeto.id}`;
  document.querySelector("[data-link-agendar]").href = `reunioes.html?agendar=1&projeto=${projeto.id}`;
  ativarSeparadores();
}

const id = new URLSearchParams(location.search).get("id");

(id ? mostrarDetalhe(id) : mostrarLista()).catch((erro) => {
  console.error(erro);
  document.querySelector(".conteudo").insertAdjacentHTML(
    "beforeend",
    '<p class="erro-carregar" role="alert">Não foi possível carregar o projeto. <a class="link" href="projetos.html">Ver todos os projetos</a></p>'
  );
});
