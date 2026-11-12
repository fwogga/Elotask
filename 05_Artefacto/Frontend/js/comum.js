// Código partilhado por todas as páginas da aplicação.
// Basta incluir <script type="module" src="../js/comum.js"> para a sidebar
// aparecer; as páginas importam daqui as funções de que precisam.
import { getUtilizadorAtual, tempoReal, recusarChamada } from "./api/client.js";

// ==========================================================================
// Formatação (datas, tamanhos, texto seguro)
// ==========================================================================

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

// ==========================================================================
// Interface (ícones, avatares, avisos, confirmação)
// ==========================================================================

export const icone = (nome, tamanho, classe = "") =>
  `<img${classe ? ` class="${classe}"` : ""} src="../assets/icons/${nome}" alt="" width="${tamanho}" height="${tamanho}">`;

// tamanho: "sm" (38px), "md" (50px), "lg" (58px)
export function avatar(utilizador, tamanho = "md") {
  if (!utilizador) return "";
  const cor = utilizador.cor && utilizador.cor !== "primaria" ? ` avatar--${utilizador.cor}` : "";
  return `<span class="avatar avatar--${tamanho}${cor}" title="${esc(utilizador.nome)}" aria-hidden="true">${esc(iniciais(utilizador.nome))}</span>`;
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

// Formulário rápido numa janela. campos: [{ nome, rotulo, tipo, opcoes: [[valor, texto]], valor }]
// Devolve { nome: valor, ... } ou null se cancelar.
export function pedirDados(titulo, campos, rotuloBotao = "Guardar") {
  const campoHtml = ({ nome, rotulo, tipo = "text", opcoes = [], valor = "" }) => {
    const id = `campo-${nome}`;
    let controlo = `<input id="${id}" name="${nome}" type="${tipo}" value="${esc(valor)}">`;
    if (tipo === "select") {
      controlo = `<select id="${id}" name="${nome}">${opcoes.map(([v, t]) => `<option value="${esc(v)}"${v === valor ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
    }
    if (tipo === "textarea") controlo = `<textarea id="${id}" name="${nome}" rows="3">${esc(valor)}</textarea>`;
    return `<div class="campo formulario__total"><label for="${id}">${esc(rotulo)}</label>${controlo}</div>`;
  };

  const dialogo = document.createElement("dialog");
  dialogo.className = "dialogo dialogo--pequeno";
  dialogo.innerHTML = `
    <form class="formulario" method="dialog">
      <h2 class="dialogo__titulo formulario__total">${esc(titulo)}</h2>
      ${campos.map(campoHtml).join("")}
      <div class="dialogo__acoes formulario__total">
        <button class="botao botao--secundario" value="nao">Cancelar</button>
        <button class="botao" value="sim">${esc(rotuloBotao)}</button>
      </div>
    </form>`;
  document.body.append(dialogo);
  dialogo.showModal();
  return new Promise((resolver) => {
    dialogo.addEventListener("close", () => {
      const dados = Object.fromEntries(new FormData(dialogo.querySelector("form")));
      resolver(dialogo.returnValue === "sim" ? dados : null);
      dialogo.remove();
    });
  });
}

// ==========================================================================
// Cartão de projeto (Início e Projetos)
// ==========================================================================

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

// Ecrãs extra, numa lista mais compacta por baixo da principal
export const NAV_EXTRA = [
  { id: "notificacoes", rotulo: "Notificações", pagina: "notificacoes.html", icone: "nav-notificacoes.svg" },
  { id: "assistente", rotulo: "Assistente IA", pagina: "assistente.html", icone: "nav-assistente.svg" },
  { id: "historico", rotulo: "Histórico", pagina: "historico.html", icone: "clock.svg" },
  { id: "administracao", rotulo: "Administração", pagina: "administracao.html", icone: "nav-admin.svg" },
  { id: "estado", rotulo: "Estado do sistema", pagina: "estado.html", icone: "nav-estado.svg" },
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
  const extra = NAV_EXTRA.map((item) => itemNav(item, ativo, utilizador.naoLidas?.[item.id])).join("");

  el.setAttribute("aria-label", "Navegação principal");
  el.innerHTML = `
    <a class="sidebar__marca" href="dashboard.html">
      <img class="sidebar__logo" src="${asset("img/logo-elotask.png")}" alt="" width="43" height="45">
      <span>EloTask</span>
    </a>
    <nav>
      <ul class="sidebar__nav">${itens}</ul>
      <ul class="sidebar__nav sidebar__nav--extra">${extra}</ul>
    </nav>
    <a class="sidebar__utilizador" href="perfil.html"${ativo === "perfil" ? ' aria-current="page"' : ""}>
      <span class="avatar" aria-hidden="true">${esc(iniciais(utilizador.nome))}</span>
      <span>${esc(utilizador.nome)}</span>
      <img src="${asset("icons/chevron-down.svg")}" alt="" width="16" height="20">
    </a>`;
}

// Erros que nenhuma página tratou (ex.: sem permissão no backend) aparecem como aviso
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason?.message) aviso(e.reason.message);
});

// Chamada recebida: aparece em qualquer página, menos na própria página da chamada
async function avisarChamadas() {
  const socket = await tempoReal();
  if (!socket || location.pathname.endsWith("chamada.html")) return;
  socket.on("chamada:recebida", async ({ chamada }) => {
    const atender = await confirmar(`${chamada.nome_iniciador} está a ligar-te.`, "Atender");
    if (atender) location.href = `chamada.html?id=${chamada.id_chamada}`;
    else recusarChamada(chamada.id_chamada);
  });
}

// Desenha a sidebar em qualquer página que a tenha
const sidebar = document.querySelector("[data-sidebar]");
if (sidebar) {
  renderSidebar(sidebar);
  avisarChamadas().catch(() => {});
}
