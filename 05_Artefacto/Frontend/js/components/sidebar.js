import { getUtilizadorAtual } from "../api/client.js";

// Caminhos relativos a este ficheiro, para funcionarem em qualquer página
const asset = (caminho) => new URL(`../../assets/${caminho}`, import.meta.url).href;

export const NAV_ITENS = [
  { id: "inicio", rotulo: "Início", pagina: "dashboard.html", icone: "nav-inicio.svg" },
  { id: "tarefas", rotulo: "Tarefas", pagina: "tarefas.html", icone: "nav-tarefas.svg" },
  { id: "projetos", rotulo: "Projetos", pagina: "projetos.html", icone: "nav-projetos.svg" },
  { id: "calendario", rotulo: "Calendário", pagina: "calendario.html", icone: "nav-calendario.svg" },
  { id: "mensagens", rotulo: "Mensagens", pagina: "mensagens.html", icone: "nav-mensagens.svg" },
  { id: "documentos", rotulo: "Documentos", pagina: "documentos.html", icone: "nav-documentos.svg" },
  { id: "reunioes", rotulo: "Reuniões", pagina: "reunioes.html", icone: "nav-reunioes.svg" },
  { id: "turnos", rotulo: "Turnos", pagina: "turnos.html", icone: "nav-turnos.svg" },
];

const iniciais = (nome) =>
  nome
    .split(" ")
    .filter(Boolean)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function itemNav(item, ativo, naoLidas) {
  const atual = item.id === ativo ? ' aria-current="page"' : "";
  const badge = naoLidas
    ? `<span class="nav-item__badge" aria-hidden="true"></span><span class="sr-only">(${naoLidas} não lidas)</span>`
    : "";

  return `
    <li>
      <a class="nav-item" href="${item.pagina}"${atual}>
        <img class="nav-item__icone" src="${asset("icons/" + item.icone)}" alt="" width="28" height="28">
        <span>${item.rotulo}</span>
        ${badge}
      </a>
    </li>`;
}

export async function renderSidebar(el) {
  const utilizador = await getUtilizadorAtual();
  const ativo = el.dataset.ativo;
  const itens = NAV_ITENS.map((item) => itemNav(item, ativo, utilizador.naoLidas?.[item.id])).join("");

  el.setAttribute("aria-label", "Navegação principal");
  el.innerHTML = `
    <a class="sidebar__marca" href="dashboard.html">
      <img class="sidebar__logo" src="${asset("img/logo-elotask.png")}" alt="" width="43" height="45">
      <span>EloTask</span>
    </a>
    <nav>
      <ul class="sidebar__nav">${itens}</ul>
    </nav>
    <button class="sidebar__utilizador" type="button" aria-haspopup="menu">
      <span class="avatar" aria-hidden="true">${iniciais(utilizador.nome)}</span>
      <span>${utilizador.nome}</span>
      <img src="${asset("icons/chevron-down.svg")}" alt="" width="16" height="20">
    </button>`;
}
