// Escolher equipa: lista de equipas, convites pendentes, entrada com código e criar equipa.
import {
  getUtilizadorAtual,
  getEquipas,
  getConvites,
  escolherEquipa,
  responderConvite,
  entrarComConvite,
  criarEquipa,
  terminarSessao,
  getMembrosEquipa,
  conversaCom,
} from "../api/client.js";
import { esc, iniciais, aviso, confirmar, linkPerfil } from "../comum.js";

const $ = (seletor) => document.querySelector(seletor);
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

// "Equipa EloTask" → "EE"   |   "Investigação" → "IN"
function sigla(nome) {
  const palavras = nome.split(" ").filter(Boolean);
  const letras = palavras.length > 1 ? palavras[0][0] + palavras[1][0] : nome.slice(0, 2);
  return letras.toUpperCase();
}

// --- Desenhar ---------------------------------------------------------------

function renderEquipas(equipas) {
  $("[data-total]").textContent = `· ${plural(equipas.length, "equipa", "equipas")}`;
  $("[data-equipas]").innerHTML = equipas.map((e) => `
    <li class="cartao eq-item">
      <span class="eq-avatar eq-avatar--${esc(e.cor)}" aria-hidden="true">${esc(sigla(e.nome))}</span>
      <div class="eq-info">
        <p class="eq-nome">${esc(e.nome)} <span class="eq-papel">${esc(e.papel)}</span></p>
        <p class="eq-dados">${plural(e.membros, "membro", "membros")}${e.projetos == null ? "" : ` · ${plural(e.projetos, "projeto", "projetos")}`}</p>
      </div>
      ${e.ultima ? '<span class="eq-ultima">Última utilizada</span>' : ""}
      <button class="botao botao--compacto botao--secundario eq-btn" type="button" data-membros="${e.id}"
              data-nome-equipa="${esc(e.nome)}">Membros</button>
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

// Lista de membros: cada nome abre o perfil e "Mensagem" abre a conversa com a pessoa
async function mostrarMembros(equipaId, nomeEquipa) {
  const [membros, eu] = await Promise.all([getMembrosEquipa(equipaId), getUtilizadorAtual()]);
  const dialogo = document.createElement("dialog");
  dialogo.className = "dialogo dialogo--pequeno";
  dialogo.innerHTML = `
    <form method="dialog">
      <h2 class="dialogo__titulo">Membros · ${esc(nomeEquipa)}</h2>
      <ul class="eq-membros">
        ${membros.map((m) => `
          <li>
            ${linkPerfil(m)}
            <span class="eq-papel">${esc(m.funcao)}</span>
            ${m.id === eu.id ? "" : `<button class="botao-texto" type="button" data-conversar="${m.id}">Mensagem</button>`}
          </li>`).join("") || '<li class="vazio">Esta equipa ainda não tem membros.</li>'}
      </ul>
      <div class="dialogo__acoes">
        <button class="botao botao--secundario" value="fechar">Fechar</button>
      </div>
    </form>`;
  document.body.append(dialogo);
  dialogo.addEventListener("close", () => dialogo.remove());
  dialogo.addEventListener("click", async (e) => {
    const botao = e.target.closest("[data-conversar]");
    if (botao) location.href = `mensagens.html?c=${await conversaCom(Number(botao.dataset.conversar))}`;
  });
  dialogo.showModal();
}

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
    if (!equipa) return;
    e.target.reset();
    msg.textContent = `Entrou na ${equipa.nome}.`;
    msg.classList.remove("eq-msg--erro");
    await carregar();
  } catch {
    msg.textContent = "Convite inválido ou expirado.";
    msg.classList.add("eq-msg--erro");
  }
}

function ligarCriarEquipa() {
  const dialogo = $("[data-dialogo-criar]");
  const form = $("[data-form-criar]");

  $("[data-criar]").addEventListener("click", () => {
    form.reset();
    dialogo.showModal();
  });
  form.querySelector("[data-cancelar]").addEventListener("click", () => dialogo.close());
  form.addEventListener("submit", async () => {
    const equipa = await criarEquipa({ nome: form.nome.value.trim() });
    aviso(`Equipa "${equipa.nome}" criada.`);
    await carregar();
  });
}

// --- Arranque ---------------------------------------------------------------

async function iniciar() {
  const utilizador = await getUtilizadorAtual();
  $("[data-nome]").textContent = utilizador.nome;
  $("[data-iniciais]").textContent = iniciais(utilizador.nome);
  await carregar();

  $("[data-equipas]").addEventListener("click", async (e) => {
    const membros = e.target.closest("[data-membros]");
    if (membros) return mostrarMembros(Number(membros.dataset.membros), membros.dataset.nomeEquipa);
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
  ligarCriarEquipa();

  $("[data-sair]").addEventListener("click", async (e) => {
    e.preventDefault();
    if (await confirmar("Tem a certeza de que quer terminar a sessão?", "Terminar sessão")) {
      await terminarSessao();
      location.href = "login.html";
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
