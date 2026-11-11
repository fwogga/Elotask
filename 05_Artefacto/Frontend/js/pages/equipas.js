// Escolher equipa: lista de equipas, convites pendentes e entrada com código.
// As janelas (criar equipa, terminar sessão) vêm de modais.js.
import {
  getUtilizadorAtual,
  getEquipas,
  getConvites,
  escolherEquipa,
  responderConvite,
  entrarComConvite,
} from "../api/client.js";
import { esc, iniciais, aviso } from "../comum.js";
import { sigla } from "../modais.js";

const $ = (seletor) => document.querySelector(seletor);
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

// --- Desenhar ---------------------------------------------------------------

function renderEquipas(equipas) {
  $("[data-total]").textContent = `· ${plural(equipas.length, "equipa", "equipas")}`;
  $("[data-equipas]").innerHTML = equipas.map((e) => `
    <li class="cartao eq-item">
      <span class="eq-avatar eq-avatar--${esc(e.cor)}" aria-hidden="true">${esc(sigla(e.nome))}</span>
      <div class="eq-info">
        <p class="eq-nome">${esc(e.nome)} <span class="eq-papel">${esc(e.papel)}</span></p>
        <p class="eq-dados">${plural(e.membros, "membro", "membros")} · ${plural(e.projetos, "projeto", "projetos")}</p>
      </div>
      ${e.ultima ? '<span class="eq-ultima">Última utilizada</span>' : ""}
      <button class="botao botao--compacto eq-btn" type="button" data-entrar="${e.id}"
              aria-label="Entrar na ${esc(e.nome)}">Entrar</button>
    </li>`).join("");
}

function renderConvites(convites) {
  const caixa = $("[data-convites]");
  caixa.hidden = convites.length === 0;
  if (!convites.length) return;

  caixa.innerHTML = `
    <span class="eq-pendente">${plural(convites.length, "convite pendente", "convites pendentes")}</span>
    ${convites.map((c) => `
      <div class="eq-convite">
        <p class="eq-convite__equipa">${esc(c.equipa)}</p>
        <p class="eq-bloco__texto">${esc(c.convidadoPor)} convidou-o para esta equipa.</p>
        <div class="eq-convite__botoes">
          <button class="botao botao--compacto eq-btn" type="button" data-aceitar="${c.id}">Aceitar</button>
          <button class="botao botao--compacto botao--secundario eq-btn" type="button" data-recusar="${c.id}">Recusar</button>
        </div>
      </div>`).join("")}`;
}

async function carregar() {
  const [equipas, convites] = await Promise.all([getEquipas(), getConvites()]);
  renderEquipas(equipas);
  renderConvites(convites);
}

// --- Ações ------------------------------------------------------------------

async function tratarConvite(id, aceitar) {
  await responderConvite(id, aceitar);
  aviso(aceitar ? "Convite aceite." : "Convite recusado.");
  await carregar();
}

async function submeterCodigo(e) {
  e.preventDefault();
  const msg = $("[data-msg-convite]");
  const codigo = e.target.elements.codigo.value.trim();

  if (!codigo) {
    msg.textContent = "Introduza um código ou ligação de convite.";
    msg.classList.add("eq-msg--erro");
    return;
  }

  try {
    const equipa = await entrarComConvite(codigo);
    e.target.reset();
    msg.textContent = `Entrou na ${equipa.nome}.`;
    msg.classList.remove("eq-msg--erro");
    await carregar();
  } catch {
    msg.textContent = "Convite inválido ou expirado.";
    msg.classList.add("eq-msg--erro");
  }
}

// --- Arranque ---------------------------------------------------------------

async function iniciar() {
  const utilizador = await getUtilizadorAtual();
  $("[data-nome]").textContent = utilizador.nome;
  $("[data-iniciais]").textContent = iniciais(utilizador.nome);
  await carregar();

  $("[data-equipas]").addEventListener("click", async (e) => {
    const botao = e.target.closest("[data-entrar]");
    if (!botao) return;
    await escolherEquipa(Number(botao.dataset.entrar));
    location.href = "dashboard.html";
  });

  $("[data-convites]").addEventListener("click", (e) => {
    const aceitar = e.target.closest("[data-aceitar]");
    const recusar = e.target.closest("[data-recusar]");
    if (aceitar) tratarConvite(Number(aceitar.dataset.aceitar), true);
    if (recusar) tratarConvite(Number(recusar.dataset.recusar), false);
  });

  $("[data-form-convite]").addEventListener("submit", submeterCodigo);

  // Depois de criar uma equipa na janela, atualiza a lista sem recarregar a página
  document.addEventListener("elotask:dados-alterados", (e) => {
    e.preventDefault();
    carregar();
  });
}

iniciar().catch((erro) => {
  console.error(erro);
  $("main").insertAdjacentHTML(
    "beforeend",
    '<p class="erro-carregar" role="alert">Não foi possível carregar os dados. Tente novamente.</p>'
  );
});