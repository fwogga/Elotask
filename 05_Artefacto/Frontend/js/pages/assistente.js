import { getConversaIa, perguntarIa } from "../api/client.js";
import { esc } from "../comum.js";

const caixa = document.querySelector("[data-mensagens]");
const form = document.querySelector("[data-form]");
let conversaId = null;

function adicionar(autor, texto) {
  caixa.querySelector(".vazio")?.remove();
  caixa.insertAdjacentHTML("beforeend", `<li class="bolha${autor === "eu" ? " bolha--eu" : ""}">${esc(texto)}</li>`);
  caixa.scrollTop = caixa.scrollHeight;
}

async function perguntar(pergunta) {
  if (!pergunta) return;
  adicionar("eu", pergunta);
  form.pergunta.value = "";
  form.querySelector("[type=submit]").disabled = true;
  try {
    adicionar("ia", await perguntarIa(conversaId, pergunta));
  } catch (erro) {
    adicionar("ia", `Não consegui responder: ${erro.message}`);
  } finally {
    form.querySelector("[type=submit]").disabled = false;
    form.pergunta.focus();
  }
}

async function iniciar() {
  const conversa = await getConversaIa();
  conversaId = conversa.id;
  if (conversa.mensagens.length) conversa.mensagens.forEach((m) => adicionar(m.autor, m.texto));
  else caixa.innerHTML = '<li class="vazio">Pergunta sobre as tuas reuniões, decisões ou tarefas.</li>';

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    perguntar(form.pergunta.value.trim());
  });
  document.querySelector("[data-sugestoes]").addEventListener("click", (e) => {
    const botao = e.target.closest(".sugestao");
    if (botao) perguntar(botao.textContent);
  });
}

iniciar().catch((erro) => {
  console.error(erro);
  caixa.innerHTML = '<li class="erro-carregar" role="alert">Não foi possível abrir o assistente.</li>';
});
