// Usado por login.html e registro.html; o atributo data-form diz qual dos dois é.
// Por agora não há validações: qualquer valor (ou nenhum) deixa entrar e criar conta.
import { iniciarSessao, registar } from "../api/client.js";

const form = document.querySelector("[data-form]");
const erroGeral = form.querySelector("[data-erro-geral]");
const botaoSubmeter = form.querySelector("[type=submit]");

// --- Mostrar / esconder palavra-passe -------------------------------------

for (const botao of form.querySelectorAll("[data-alternar-senha]")) {
  botao.addEventListener("click", () => {
    const input = botao.parentElement.querySelector("input");
    const mostrar = input.type === "password";
    input.type = mostrar ? "text" : "password";
    botao.setAttribute("aria-pressed", String(mostrar));
    botao.setAttribute("aria-label", mostrar ? "Esconder palavra-passe" : "Mostrar palavra-passe");
  });
}

// Só aparece se o servidor devolver um erro (ex.: email sem conta)
async function submeter(acao) {
  botaoSubmeter.disabled = true;
  erroGeral.hidden = true;
  try {
    await acao();
  } catch (erro) {
    erroGeral.textContent = erro.message;
    erroGeral.hidden = false;
    botaoSubmeter.disabled = false;
  }
}

// --- Iniciar sessão -------------------------------------------------------

function iniciarLogin() {
  if (new URLSearchParams(location.search).get("registo")) {
    form.closest(".auth__cartao").querySelector("[data-aviso-registo]").hidden = false;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submeter(async () => {
      await iniciarSessao({
        identificador: form.identificador.value.trim(),
        palavra: form.palavra.value,
        manter: form.manter.checked,
      });
      location.href = "equipas.html";
    });
  });
}

// --- Registo --------------------------------------------------------------

function iniciarRegisto() {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submeter(async () => {
      await registar({
        nome: form.nome.value.trim(),
        email: form.email.value.trim().toLowerCase(),
        telefone: form.telefone.value.trim(),
        nascimento: form.nascimento.value,
        palavra: form.palavra.value,
      });
      location.href = "login.html?registo=1";
    });
  });
}

if (form.dataset.form === "login") iniciarLogin();
else iniciarRegisto();
