import { getHistorico } from "../api/client.js";
import { esc, diaRelativo, hora } from "../comum.js";

const lista = document.querySelector("[data-lista]");

getHistorico().then((alteracoes) => {
  lista.innerHTML = alteracoes.length ? alteracoes.map((a) => `
    <li>
      <div class="lista-simples__corpo">
        <p class="lista-simples__titulo">${esc(a.descricao)}</p>
        <p class="lista-simples__meta">${esc(a.pessoa)}${a.projeto ? ` · ${esc(a.projeto)}` : ""} · ${diaRelativo(a.quando)}, ${hora(a.quando)}</p>
      </div>
    </li>`).join("") : '<li class="vazio">Ainda não há alterações registadas.</li>';
}).catch((erro) => {
  console.error(erro);
  lista.innerHTML = '<li class="erro-carregar" role="alert">Não foi possível carregar o histórico.</li>';
});
