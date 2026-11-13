import { getEstadoSistema } from "../api/client.js";
import { esc } from "../comum.js";

async function verificar() {
  const lista = document.querySelector("[data-lista]");
  lista.innerHTML = '<li class="vazio">A verificar...</li>';
  const { modo, apiUrl, verificacoes } = await getEstadoSistema();
  const okCount = verificacoes.filter((v) => v.ok).length;

  document.querySelector("[data-resumo]").innerHTML = `
    <div class="cartao"><dt>Dados em uso</dt><dd>${modo === "api" ? "Servidor" : "Exemplo"}</dd></div>
    <div class="cartao"><dt>Serviços disponíveis</dt><dd>${okCount}/${verificacoes.length}</dd></div>`;

  lista.innerHTML = verificacoes.map((v) => `
    <li>
      <span class="estado-ponto${v.ok ? " estado-ponto--ok" : ""}" aria-hidden="true"></span>
      <div class="lista-simples__corpo">
        <p class="lista-simples__titulo">${esc(v.nome)} <span class="sr-only">${v.ok ? "disponível" : "indisponível"}</span></p>
        <p class="lista-simples__texto">${esc(v.detalhe)}</p>
      </div>
    </li>`).join("") + `
    <li>
      <div class="lista-simples__corpo">
        <p class="lista-simples__titulo">Endereço da API</p>
        <p class="lista-simples__texto">${esc(apiUrl)}${modo === "api" ? "" : " — sem resposta, usa os dados de exemplo"}</p>
      </div>
    </li>`;
}

document.querySelector("[data-verificar]").addEventListener("click", verificar);
verificar();
