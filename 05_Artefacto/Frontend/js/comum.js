
import { getUtilizadorAtual } from "./api/client.js";


// Formatação (datas, tamanhos, texto seguro)


const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_LONGOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Escapa texto vindo da API antes de o meter no HTML (evita injeção de código)
export const esc = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const iniciais = (nome) =>
  nome.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

// "2026-10-15" é lido como data local (new Date("2026-10-15") seria UTC)
export function paraData(valor) {
  if (valor instanceof Date) return valor;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [a, m, d] = valor.split("-").map(Number);
    return new Date(a, m - 1, d);
  }
  return new Date(valor);
}

// Data local no formato "AAAA-MM-DD"
export function chaveDia(valor) {
  const d = paraData(valor);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const mesAno = (d) => `${MESES_LONGOS[d.getMonth()]} ${d.getFullYear()}`;
export const dataCurta = (v) => { const d = paraData(v); return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]}`; };
export const dataCompleta = (v) => `${dataCurta(v)} ${paraData(v).getFullYear()}`;
export const hora = (v) => paraData(v).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

function diasAteHoje(v) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const d = paraData(v);
  const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((dia - hoje) / 86400000);
}

export function diaRelativo(v) {
  const dias = diasAteHoje(v);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  if (dias === -1) return "Ontem";
  return dataCurta(v);
}

export const intervalo = (inicio, fim) => `${diaRelativo(inicio)}, ${hora(inicio)} – ${hora(fim)}`;

export const estaAtrasada = (prazo) => diasAteHoje(prazo) < 0;

export function horaMensagem(v) {
  const dias = diasAteHoje(v);
  if (dias === 0) return hora(v);
  if (dias === -1) return "Ontem";
  return dataCurta(v);
}

export function tamanhoFicheiro(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function extensao(nome) {
  const partes = nome.split(".");
  return partes.length > 1 ? partes.pop().toUpperCase() : "";
}


// Interface (ícones, avatares, avisos, confirmação)


export const icone = (nome, tamanho, classe = "") =>
  `<img${classe ? ` class="${classe}"` : ""} src="../assets/icons/${nome}" alt="" width="${tamanho}" height="${tamanho}">`;

// tamanho: "sm" (38px), "md" (50px), "lg" (58px)
export function avatar(utilizador, tamanho = "md") {
  if (!utilizador) return "";
  const cor = utilizador.cor && utilizador.cor !== "primaria" ? ` avatar--${utilizador.cor}` : "";
  return `<span class="avatar avatar--${tamanho}${cor}" title="${esc(utilizador.nome)}" aria-hidden="true">${iniciais(utilizador.nome)}</span>`;
}

export const porId = (lista) => new Map(lista.map((x) => [x.id, x]));

export function aviso(texto) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("p");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.textContent = texto;
  el.classList.add("toast--visivel");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("toast--visivel"), 3000);
}

// Janela de confirmação com <dialog>; devolve true se o utilizador confirmar
export function confirmar(texto, rotuloConfirmar = "Confirmar") {
  const dialogo = document.createElement("dialog");
  dialogo.className = "dialogo dialogo--pequeno";
  dialogo.innerHTML = `
    <form method="dialog">
      <p class="dialogo__texto">${esc(texto)}</p>
      <div class="dialogo__acoes">
        <button class="botao botao--secundario" value="nao">Cancelar</button>
        <button class="botao botao--perigo" value="sim">${esc(rotuloConfirmar)}</button>
      </div>
    </form>`;
  document.body.append(dialogo);
  dialogo.showModal();
  return new Promise((resolver) => {
    dialogo.addEventListener("close", () => {
      resolver(dialogo.returnValue === "sim");
      dialogo.remove();
    });
  });
}


// Cartão de projeto (Início e Projetos)


export const ESTADOS_PROJETO = {
  em_andamento: { rotulo: "Em andamento", classe: "sucesso" },
  planeamento: { rotulo: "Planeamento", classe: "erro" },
  concluido: { rotulo: "Concluído", classe: "sucesso" },
};

export function cartaoProjeto(p) {
  const estado = ESTADOS_PROJETO[p.estado] ?? ESTADOS_PROJETO.em_andamento;
  const progresso = Number(p.progresso) || 0;
  const cor = p.cor ? ` icone-bloco--${p.cor}` : "";

  return `
    <li>
      <a class="cartao projeto" href="projetos.html?id=${encodeURIComponent(p.id)}">
        <div class="projeto__cabecalho">
          <span class="icone-bloco${cor}">${icone(p.icone, 28)}</span>
          <h3 class="projeto__nome">${esc(p.nome)}</h3>
        </div>
        <span class="etiqueta etiqueta--ponto etiqueta--${estado.classe}">${estado.rotulo}</span>
        <div class="progresso">
          <div class="progresso__trilho" role="progressbar" aria-valuenow="${progresso}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso de ${esc(p.nome)}">
            <div class="progresso__barra" style="width: ${progresso}%"></div>
          </div>
          <span>${progresso}%</span>
        </div>
        <p class="projeto__rodape">${icone("user.svg", 18)} ${p.tarefasPendentes} ${p.tarefasPendentes === 1 ? "tarefa pendente" : "tarefas pendentes"}</p>
      </a>
    </li>`;
}

// ==========================================================================
// Sidebar
// ==========================================================================

// Caminho relativo a este ficheiro, para funcionar em qualquer página
const asset = (caminho) => new URL(`../assets/${caminho}`, import.meta.url).href;

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
        <a class="sidebar__utilizador" href="perfil.html">
      <span class="avatar" aria-hidden="true">${iniciais(utilizador.nome)}</span>
      <span>${esc(utilizador.nome)}</span>
      <img src="${asset("icons/chevron-down.svg")}" alt="" width="16" height="20">
    </a>`;
}

// Desenha a sidebar em qualquer página que a tenha
const sidebar = document.querySelector("[data-sidebar]");
if (sidebar) {
  renderSidebar(sidebar);
}
