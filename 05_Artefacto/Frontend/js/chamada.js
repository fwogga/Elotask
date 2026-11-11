// ============================================================================
// chamada.js — Chamadas de voz e de vídeo (simuladas).
// Abre com:  chamada.html?tipo=voz|video&conversa=ID
//
// Reais: câmara, microfone e partilha de ecrã (só no teu computador).
// Simulados: os outros participantes, o "a falar" e o atender da chamada,
// porque ainda não há servidor (WebRTC) — ver ponto 12 do plano.
// ============================================================================

import { getUtilizadorAtual, getUtilizadores, getConversas } from "../api/client.js";
import { esc, iniciais, aviso } from "../comum.js";

const $ = (seletor) => document.querySelector(seletor);

// --- 1. Estado --------------------------------------------------------------

const params = new URLSearchParams(location.search);
const conversaId = Number(params.get("conversa")) || 1;

let tipo = params.get("tipo") === "video" ? "video" : "voz";
let fase = "a-chamar";            // "a-chamar" → "ligada" → "terminada"
let mudo = false;
let semCamara = tipo === "voz";   // em voz a câmara começa desligada
let segundos = 0;

let stream = null;                // câmara + microfone
let ecra = null;                  // partilha de ecrã
let atender = null, relogio = null, falante = null;   // temporizadores

let eu = null;
let outros = [];                  // participantes (sem mim)

const doisDigitos = (n) => String(n).padStart(2, "0");
const duracao = (s) => `${doisDigitos(Math.floor(s / 60))}:${doisDigitos(s % 60)}`;

// --- 2. Desenhar --------------------------------------------------------------

const classeCor = (u) => (u.cor && u.cor !== "primaria" ? ` avatar--${u.cor}` : "");

const tileAvatar = (u, nome = u.nome) => `
  <div class="tile" data-participante="${u.id}">
    <span class="avatar chamada__avatar${classeCor(u)}" aria-hidden="true">${esc(iniciais(u.nome))}</span>
    <p class="tile__nome">${esc(nome)}</p>
  </div>`;

function desenharPalco() {
  const palco = $("[data-palco]");
  palco.dataset.tipo = tipo;

  let html = "";
  if (ecra) {
    html += `<div class="tile tile--ecra"><video data-ecra-video autoplay muted playsinline></video><p class="tile__nome">O meu ecrã</p></div>`;
  }
  html += outros.map((u) => tileAvatar(u)).join("");

  // Em vídeo mostro-me a mim: com a câmara real se estiver ligada, senão com as iniciais
  if (tipo === "video") {
    html += stream && !semCamara
      ? `<div class="tile tile--eu"><video data-eu-video autoplay muted playsinline></video><p class="tile__nome">Eu</p></div>`
      : tileAvatar(eu, "Eu");
  }
  palco.innerHTML = html;

  // O srcObject não se pode escrever em HTML: liga-se depois de criar os elementos
  const videoEu = palco.querySelector("[data-eu-video]");
  if (videoEu) videoEu.srcObject = stream;
  const videoEcra = palco.querySelector("[data-ecra-video]");
  if (videoEcra) videoEcra.srcObject = ecra;
}

function atualizarCabecalho() {
  $("[data-chamada]").dataset.fase = fase;
  $("[data-estado]").textContent =
    fase === "a-chamar" ? "A chamar…" : tipo === "video" ? "Videochamada" : "Chamada de voz";
  $("[data-tempo]").hidden = fase !== "ligada";
}

function atualizarControlos() {
  const mic = $('[data-acao="mic"]');
  mic.setAttribute("aria-pressed", String(mudo));
  mic.setAttribute("aria-label", mudo ? "Ativar microfone" : "Silenciar microfone");
  mic.querySelector(".ctrl__rotulo").textContent = mudo ? "Mudo" : "Microfone";

  const cam = $('[data-acao="camara"]');
  cam.setAttribute("aria-pressed", String(semCamara));
  cam.setAttribute("aria-label", tipo === "voz" ? "Ligar vídeo" : semCamara ? "Ligar câmara" : "Desligar câmara");
  cam.querySelector(".ctrl__rotulo").textContent = tipo === "voz" ? "Ligar vídeo" : "Vídeo";

  const partilha = $('[data-acao="ecra"]');
  partilha.setAttribute("aria-pressed", String(Boolean(ecra)));
  partilha.setAttribute("aria-label", ecra ? "Parar de partilhar o ecrã" : "Partilhar ecrã");
}

// --- 3. Câmara, microfone e ecrã ------------------------------------------------

async function pedirMedia() {
  if (!navigator.mediaDevices?.getUserMedia) {
    aviso("Este navegador não permite aceder ao microfone ou à câmara.");
    return;
  }
  try {
    const novo = await navigator.mediaDevices.getUserMedia({ audio: true, video: tipo === "video" });
    stream?.getTracks().forEach((t) => t.stop());
    stream = novo;
    stream.getAudioTracks().forEach((t) => (t.enabled = !mudo));
  } catch {
    aviso(tipo === "video" ? "Não foi possível aceder à câmara ou ao microfone." : "Não foi possível aceder ao microfone.");
    if (tipo === "video") semCamara = true;
  }
}

function alternarMicrofone() {
  mudo = !mudo;
  stream?.getAudioTracks().forEach((t) => (t.enabled = !mudo));
  atualizarControlos();
}

async function alternarCamara() {
  if (tipo === "voz") {
    // De voz passa a vídeo
    tipo = "video";
    semCamara = false;
    await pedirMedia();
  } else {
    semCamara = !semCamara;
    if (!semCamara && !stream?.getVideoTracks().length) await pedirMedia();
    stream?.getVideoTracks().forEach((t) => (t.enabled = !semCamara));
  }
  atualizarCabecalho();
  atualizarControlos();
  desenharPalco();
}

function pararEcra() {
  ecra?.getTracks().forEach((t) => t.stop());
  ecra = null;
  atualizarControlos();
  desenharPalco();
}

async function alternarEcra() {
  if (ecra) { pararEcra(); return; }
  try {
    ecra = await navigator.mediaDevices.getDisplayMedia({ video: true });
    // Se a pessoa parar a partilha pelo botão do navegador, limpamos aqui também
    ecra.getVideoTracks()[0].addEventListener("ended", pararEcra);
  } catch {
    ecra = null;
    aviso("Não foi possível partilhar o ecrã.");
    return;
  }
  atualizarControlos();
  desenharPalco();
}

// --- 4. Fases da chamada --------------------------------------------------------

// Destaca alguém ao acaso, para parecer uma conversa a decorrer (simulado)
function simularFala() {
  const tiles = [...document.querySelectorAll("[data-participante]")]
    .filter((t) => Number(t.dataset.participante) !== eu.id);
  tiles.forEach((t) => t.classList.remove("tile--fala"));
  tiles[Math.floor(Math.random() * tiles.length)]?.classList.add("tile--fala");
}

function ligar() {
  fase = "ligada";
  $("[data-tempo]").textContent = duracao(0);
  relogio = setInterval(() => {
    segundos += 1;
    $("[data-tempo]").textContent = duracao(segundos);
  }, 1000);
  falante = setInterval(simularFala, 2200);
  atualizarCabecalho();
}

function pararTudo() {
  clearTimeout(atender);
  clearInterval(relogio);
  clearInterval(falante);
  stream?.getTracks().forEach((t) => t.stop());
  ecra?.getTracks().forEach((t) => t.stop());
  stream = null;
  ecra = null;
}

function terminar() {
  const foiAtendida = fase === "ligada";
  pararTudo();
  fase = "terminada";

  $("[data-fim-texto]").textContent = foiAtendida
    ? `Duração: ${duracao(segundos)}`
    : "A chamada foi cancelada antes de ser atendida.";
  $("[data-chamada]").hidden = true;
  $("[data-fim]").hidden = false;
  $("[data-ligar-novamente]").focus();
}

// --- 5. Arranque ------------------------------------------------------------------

async function iniciar() {
  const [utilizador, utilizadores, conversas] = await Promise.all([
    getUtilizadorAtual(),
    getUtilizadores(),
    getConversas(),
  ]);
  eu = utilizador;

  const conversa = conversas.find((c) => c.id === conversaId) ?? conversas[0];
  outros = conversa.membros
    .filter((id) => id !== eu.id)
    .map((id) => utilizadores.find((u) => u.id === id))
    .filter(Boolean);

  const titulo = conversa.tipo === "grupo" ? conversa.nome : outros[0]?.nome ?? "Chamada";
  $("[data-titulo]").textContent = titulo;
  document.title = `${titulo} · EloTask`;

  atualizarCabecalho();
  atualizarControlos();
  desenharPalco();

  // A chamada "é atendida" ao fim de 2,5 s (simulado)
  atender = setTimeout(ligar, 2500);

  // O navegador pede permissão; quando a pessoa responde, volta a desenhar
  pedirMedia().then(() => {
    atualizarControlos();
    desenharPalco();
  });

  // Um só ouvinte para todos os botões, com data-acao a dizer qual é
  document.querySelector(".chamada__controlos").addEventListener("click", (e) => {
    const acao = e.target.closest("[data-acao]")?.dataset.acao;
    if (acao === "mic") alternarMicrofone();
    if (acao === "camara") alternarCamara();
    if (acao === "ecra") alternarEcra();
    if (acao === "terminar") terminar();
  });

  $("[data-ligar-novamente]").addEventListener("click", () => location.reload());

  // Se a pessoa fechar o separador, desliga a câmara
  window.addEventListener("pagehide", pararTudo);
}

iniciar().catch((erro) => {
  console.error(erro);
  $("[data-chamada]").insertAdjacentHTML(
    "beforeend",
    '<p class="erro-carregar" role="alert">Não foi possível iniciar a chamada. Tente novamente.</p>'
  );
});