import { getNotificacoes, marcarNotificacaoLida, marcarTodasLidas, apagarNotificacao, getLembretes } from "../api/client.js";
import { renderSidebar, esc, diaRelativo, hora } from "../comum.js";

const lista = document.querySelector("[data-lista]");

// Ícone conforme o tipo que vem da base de dados (prazo, reuniao, tarefa_atribuida, ...)
function iconeTipo(tipo) {
  if (tipo.includes("reuniao")) return "meeting.svg";
  if (tipo.includes("prazo") || tipo.includes("lembrete")) return "clock.svg";
  if (tipo.includes("mensagem")) return "task-chat.svg";
  return "calendar-check.svg";
}

async function render() {
  const notificacoes = await getNotificacoes();
  lista.innerHTML = notificacoes.length ? notificacoes.map((n) => `
    <li class="${n.lida ? "" : "notificacao--por-ler"}">
      <span class="notificacao__icone"><img src="../assets/icons/${iconeTipo(n.tipo)}" alt="" width="24" height="24"></span>
      <div class="lista-simples__corpo">
        <p class="lista-simples__titulo">${esc(n.titulo)}${n.lida ? "" : '<span class="sr-only"> (por ler)</span>'}</p>
        <p class="lista-simples__texto">${esc(n.mensagem)}</p>
        <p class="lista-simples__meta">${diaRelativo(n.criadaEm)}, ${hora(n.criadaEm)}</p>
      </div>
      <div class="lista-simples__acoes">
        ${n.lida ? "" : `<button class="botao-texto" type="button" data-lida="${n.id}">Marcar como lida</button>`}
        <button class="botao-texto" type="button" data-apagar="${n.id}">Apagar</button>
      </div>
    </li>`).join("") : '<li class="vazio">Não tens notificações.</li>';

  // Atualiza o ponto vermelho da barra lateral
  renderSidebar(document.querySelector("[data-sidebar]"));
}

lista.addEventListener("click", async (e) => {
  const lida = e.target.closest("[data-lida]");
  const apagar = e.target.closest("[data-apagar]");
  if (lida) await marcarNotificacaoLida(Number(lida.dataset.lida));
  if (apagar) await apagarNotificacao(Number(apagar.dataset.apagar));
  if (lida || apagar) await render();
});

document.querySelector("[data-todas-lidas]").addEventListener("click", async () => {
  await marcarTodasLidas();
  await render();
});

// Lembretes que o sistema cria sozinho quando um prazo se aproxima
async function renderLembretes() {
  const lembretes = await getLembretes();
  document.querySelector("[data-seccao-lembretes]").hidden = !lembretes.length;
  document.querySelector("[data-lembretes]").innerHTML = lembretes.map((l) => `
    <li>
      <span class="notificacao__icone"><img src="../assets/icons/clock.svg" alt="" width="24" height="24"></span>
      <div class="lista-simples__corpo">
        <p class="lista-simples__titulo">${esc(l.mensagem)}</p>
        <p class="lista-simples__meta">${diaRelativo(l.quando)}, ${hora(l.quando)}</p>
      </div>
      <a class="botao-texto" href="tarefas.html?tarefa=${l.tarefaId}">Ver tarefa</a>
    </li>`).join("");
}

renderLembretes().catch(console.error);

render().catch((erro) => {
  console.error(erro);
  lista.innerHTML = '<li class="erro-carregar" role="alert">Não foi possível carregar as notificações.</li>';
});
