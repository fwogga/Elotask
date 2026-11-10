// ============================================================================
// equipas.js — "As minhas equipas": lista de equipas, convites pendentes
// e entrada com código de convite.
// ============================================================================

import {
  getUtilizadorAtual,
  getEquipas,
  getConvites,
  responderConvite,
  entrarComConvite,
} from "../api/client.js";


// --- 1. Funções auxiliares --------------------------------------------------

// Escapa texto vindo da API antes de o meter no HTML (evita injeção de código)
const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const $ = (seletor) => document.querySelector(seletor);

// plural(1, "membro", "membros") → "1 membro"   |   plural(8, ...) → "8 membros"
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

// "Equipa EloTask" → "EE"   |   "Investigação" → "IN"
function iniciais(nome) {
  const palavras = nome.split(" ").filter(Boolean);
  const letras = palavras.length > 1
    ? palavras.map((p) => p[0]).slice(0, 2).join("")
    : nome.slice(0, 2);
  return letras.toUpperCase();
}


// --- 2. Estado da página ----------------------------------------------------

let equipas = [];
let convites = [];


// --- 3. Desenhar no HTML ----------------------------------------------------

function renderEquipas() {
  $("[data-total]").textContent = `· ${plural(equipas.length, "equipa", "equipas")}`;

  $("[data-equipas]").innerHTML = equipas.map((e) => `
    <li class="cartao equipa">
      <span class="equipa__avatar equipa__avatar--${esc(e.cor)}" aria-hidden="true">${esc(iniciais(e.nome))}</span>
      <div class="equipa__info">
        <p class="equipa__nome">${esc(e.nome)} <span class="papel">${esc(e.papel)}</span></p>
        <p class="equipa__dados">${plural(e.membros, "membro", "membros")} · ${plural(e.projetos, "projeto", "projetos")}</p>
      </div>
      ${e.ultima ? '<span class="marca-ultima">Última utilizada</span>' : ""}
      <button class="btn btn--pequeno" type="button" data-entrar="${esc(e.id)}"
              aria-label="Entrar na ${esc(e.nome)}">Entrar</button>
    </li>`).join("");
}

function renderConvites() {
  const caixa = $("[data-convites]");
  caixa.hidden = convites.length === 0;

  caixa.innerHTML = convites.map((c) => `
    <div>
      <span class="convite__etiqueta">1 convite pendente</span>
      <p class="convite__equipa">${esc(c.equipa)}</p>
      <p class="lateral__texto">${esc(c.convidadoPor)} convidou-o para esta equipa.</p>
      <div class="convite__botoes">
        <button class="btn btn--pequeno" type="button" data-aceitar="${esc(c.id)}">Aceitar</button>
        <button class="btn btn--contorno btn--pequeno" type="button" data-recusar="${esc(c.id)}">Recusar</button>
      </div>
    </div>`).join("");
}


// --- 4. Ações ---------------------------------------------------------------

function entrarNaEquipa(id) {
  try {
    localStorage.setItem("elotask_equipa", id);
  } catch {
    // Armazenamento indisponível: segue na mesma
  }
  location.href = "dashboard.html";
}

async function tratarConvite(id, aceitar) {
  const convite = convites.find((c) => String(c.id) === id);
  await responderConvite(id, aceitar);

  convites = convites.filter((c) => c !== convite);

  if (aceitar) {
    equipas.push({
      id: `convite-${id}`,
      nome: convite.equipa,
      papel: "Membro",
      membros: 1,
      projetos: 0,
      cor: "rosa",
    });
    renderEquipas();
  }
  renderConvites();
}

async function submeterCodigo(e) {
  e.preventDefault();
  const msg = $("[data-msg-convite]");
  const codigo = e.target.elements.codigo.value.trim();

  msg.classList.toggle("lateral__msg--erro", !codigo);

  if (!codigo) {
    msg.textContent = "Introduza um código ou ligação de convite.";
    return;
  }

  try {
    const equipa = await entrarComConvite(codigo);
    equipas.push(equipa);
    renderEquipas();
    e.target.reset();
    msg.textContent = `Entrou na ${equipa.nome}.`;
  } catch {
    msg.classList.add("lateral__msg--erro");
    msg.textContent = "Convite inválido ou expirado.";
  }
}


// --- 5. Arranque ------------------------------------------------------------

async function iniciar() {
  const [utilizador, listaEquipas, listaConvites] = await Promise.all([
    getUtilizadorAtual(),
    getEquipas(),
    getConvites(),
  ]);

  equipas = listaEquipas;
  convites = listaConvites;

  $("[data-nome]").textContent = utilizador.nome;
  $("[data-iniciais]").textContent = iniciais(utilizador.nome);
  renderEquipas();
  renderConvites();

  // Um só "ouvinte" por zona trata todos os botões lá dentro (delegação de eventos)
  $("[data-equipas]").addEventListener("click", (e) => {
    const botao = e.target.closest("[data-entrar]");
    if (botao) entrarNaEquipa(botao.dataset.entrar);
  });

  $("[data-convites]").addEventListener("click", (e) => {
    const aceitar = e.target.closest("[data-aceitar]");
    const recusar = e.target.closest("[data-recusar]");
    if (aceitar) tratarConvite(aceitar.dataset.aceitar, true);
    if (recusar) tratarConvite(recusar.dataset.recusar, false);
  });

  $("[data-form-convite]").addEventListener("submit", submeterCodigo);

  // Terminar sessão: apaga a sessão guardada (o link leva depois ao login)
  $("[data-sair]").addEventListener("click", () => {
    try {
      localStorage.removeItem("elotask_sessao");
      sessionStorage.removeItem("elotask_sessao");
    } catch {
      // ignora
    }
  });
}

iniciar().catch((erro) => {
  console.error(erro);
  $("main").insertAdjacentHTML(
    "beforeend",
    '<p class="erro-carregar" role="alert">Não foi possível carregar os dados. Tente novamente.</p>'
  );
});