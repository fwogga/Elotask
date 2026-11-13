// Perfil: dados do utilizador e separadores.
import { getUtilizadorAtual, getUtilizadores, terminarSessao, conversaCom } from "../api/client.js";
import { esc, iniciais, dataCompleta, confirmar } from "../comum.js";

const $ = (seletor) => document.querySelector(seletor);

function renderDados(u) {
  const campos = [
    ["Nome", u.nome],
    ["Email", u.email],
    ["Telefone", u.telefone || "—"],
    ["Data de nascimento", u.nascimento ? dataCompleta(u.nascimento) : "—"],
  ];
  return campos.map(([rotulo, valor]) => `<div><dt>${rotulo}</dt><dd>${esc(valor)}</dd></div>`).join("");
}

// Ao clicar num separador, mostra o painel certo e esconde os outros
function ligarSeparadores() {
  const separadores = [...document.querySelectorAll('[role="tab"]')];

  for (const tab of separadores) {
    tab.addEventListener("click", () => {
      for (const t of separadores) {
        const ativo = t === tab;
        t.setAttribute("aria-selected", String(ativo));
        document.getElementById(t.getAttribute("aria-controls")).hidden = !ativo;
      }
    });
  }
}

async function iniciar() {
  const eu = await getUtilizadorAtual();
  const outroId = Number(new URLSearchParams(location.search).get("id"));
  const outro = outroId && outroId !== eu.id ? (await getUtilizadores()).find((p) => p.id === outroId) : null;
  const u = outro ?? eu;

  $("[data-iniciais]").textContent = iniciais(u.nome);
  $("[data-nome]").textContent = u.nome;
  $("[data-funcao]").textContent = u.funcao;
  $("[data-email]").textContent = u.email;
  $("[data-dados]").innerHTML = renderDados(u);

  ligarSeparadores();

  // Perfil de outra pessoa: só os dados e o botão para conversar
  if (outro) {
    document.title = `${u.nome} · EloTask`;
    $(".titulo-pagina").textContent = "Perfil";
    $(".separadores").hidden = true;
    $(".perfil__acoes").innerHTML = '<button class="botao botao--compacto" type="button" data-conversar>Enviar mensagem</button>';
    $("[data-conversar]").addEventListener("click", async () => {
      location.href = `mensagens.html?c=${await conversaCom(u.id)}`;
    });
    return;
  }

  $("[data-sair]").addEventListener("click", async () => {
    if (await confirmar("Tem a certeza de que quer terminar a sessão?", "Terminar sessão")) {
      await terminarSessao();
      location.href = "login.html";
    }
  });
}

iniciar().catch((erro) => {
  console.error(erro);
  $("[data-conteudo]").insertAdjacentHTML(
    "beforeend",
    '<p class="erro-carregar" role="alert">Não foi possível carregar os dados. Tente novamente.</p>'
  );
});