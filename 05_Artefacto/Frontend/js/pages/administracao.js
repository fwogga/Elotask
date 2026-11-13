import { getUtilizadores } from "../api/client.js";
import { esc, linkPerfil } from "../comum.js";

const PERFIS = { admin: "Administrador", colaborador: "Colaborador" };
const ESTADOS = { ativo: "sucesso", inativo: "aviso", suspenso: "erro" };

async function iniciar() {
  const pessoas = await getUtilizadores();
  const numeros = [
    ["Utilizadores", pessoas.length],
    ["Administradores", pessoas.filter((p) => p.tipo === "admin").length],
    ["Ativos", pessoas.filter((p) => (p.estado ?? "ativo") === "ativo").length],
  ];
  document.querySelector("[data-numeros]").innerHTML = numeros
    .map(([rotulo, valor]) => `<div class="cartao"><dt>${rotulo}</dt><dd>${valor}</dd></div>`).join("");

  document.querySelector("[data-linhas]").innerHTML = pessoas.map((p) => {
    const estado = p.estado ?? "ativo";
    return `
      <tr>
        <td>${linkPerfil(p)}</td>
        <td>${esc(p.email)}</td>
        <td>${esc(p.funcao ?? "")}</td>
        <td>${PERFIS[p.tipo] ?? "Colaborador"}</td>
        <td><span class="etiqueta etiqueta--${ESTADOS[estado] ?? "aviso"}">${esc(estado)}</span></td>
      </tr>`;
  }).join("");
}

iniciar().catch((erro) => {
  console.error(erro);
  document.querySelector(".conteudo").insertAdjacentHTML(
    "beforeend",
    '<p class="erro-carregar" role="alert">Não foi possível carregar os utilizadores.</p>'
  );
});
