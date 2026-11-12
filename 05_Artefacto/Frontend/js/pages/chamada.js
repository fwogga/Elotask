// Videochamada em malha: cada pessoa liga-se diretamente a todas as outras (WebRTC).
// O servidor só passa as mensagens de sinalização (oferta, resposta, candidatos ICE).
import {
  tempoReal,
  comecarChamada,
  entrarChamada,
  sairChamada,
  getConfigChamadas,
  enviarSinal,
  getUtilizadores,
  getUtilizadorAtual,
} from "../api/client.js";
import { esc, aviso, porId } from "../comum.js";

const grelha = document.querySelector("[data-videos]");
const textoEstado = document.querySelector("[data-estado]");
const ligacoes = new Map();
const dados = { chamada: null, socket: null, config: null, pessoas: new Map(), eu: null, meuVideo: new MediaStream() };

function caixaVideo(id) {
  let caixa = grelha.querySelector(`[data-pessoa="${id}"]`);
  if (!caixa) {
    const nome = id === dados.eu.id ? "Tu" : dados.pessoas.get(id)?.nome ?? "Colega";
    grelha.insertAdjacentHTML("beforeend", `
      <figure class="video" data-pessoa="${id}">
        <video autoplay playsinline${id === dados.eu.id ? " muted" : ""}></video>
        <figcaption>${esc(nome)}</figcaption>
      </figure>`);
    caixa = grelha.lastElementChild;
  }
  return caixa.querySelector("video");
}

function atualizarEstado() {
  textoEstado.textContent = ligacoes.size ? `${ligacoes.size + 1} pessoas na chamada` : "À espera que alguém atenda…";
}

function removerColega(id) {
  ligacoes.get(id)?.close();
  ligacoes.delete(id);
  grelha.querySelector(`[data-pessoa="${id}"]`)?.remove();
  atualizarEstado();
}

const sinal = (para, tipo, conteudo) =>
  enviarSinal(dados.socket, { id_chamada: dados.chamada.id_chamada, para, tipo_mensagem: tipo, conteudo });

function novaLigacao(id) {
  const pc = new RTCPeerConnection({ iceServers: dados.config.iceServers });
  pc.pendentes = [];
  ligacoes.set(id, pc);
  dados.meuVideo.getTracks().forEach((t) => pc.addTrack(t, dados.meuVideo));
  pc.ontrack = (e) => {
    caixaVideo(id).srcObject = e.streams[0];
  };
  pc.onicecandidate = (e) => {
    if (e.candidate) sinal(id, "candidato_ice", e.candidate.toJSON()).catch(() => {});
  };
  atualizarEstado();
  return pc;
}

// Os candidatos ICE só podem ser usados depois de a outra parte responder
async function usarPendentes(pc) {
  for (const c of pc.pendentes.splice(0)) await pc.addIceCandidate(c).catch(() => {});
}

// Quem já está na chamada é quem liga a quem acabou de entrar
async function ligarA(id) {
  const pc = novaLigacao(id);
  const oferta = await pc.createOffer();
  await pc.setLocalDescription(oferta);
  await sinal(id, "oferta", { type: oferta.type, sdp: oferta.sdp });
}

async function receberSinal({ id_chamada, de, tipo_mensagem, conteudo }) {
  if (id_chamada !== dados.chamada?.id_chamada) return;
  let pc = ligacoes.get(de);

  if (tipo_mensagem === "oferta") {
    pc ??= novaLigacao(de);
    await pc.setRemoteDescription(conteudo);
    const resposta = await pc.createAnswer();
    await pc.setLocalDescription(resposta);
    await sinal(de, "resposta", { type: resposta.type, sdp: resposta.sdp });
    await usarPendentes(pc);
  } else if (tipo_mensagem === "resposta" && pc) {
    await pc.setRemoteDescription(conteudo);
    await usarPendentes(pc);
  } else if (tipo_mensagem === "candidato_ice" && pc) {
    if (pc.remoteDescription) await pc.addIceCandidate(conteudo).catch(() => {});
    else pc.pendentes.push(conteudo);
  }
}

function terminar(mensagem) {
  for (const id of [...ligacoes.keys()]) removerColega(id);
  dados.meuVideo.getTracks().forEach((t) => t.stop());
  grelha.innerHTML = "";
  dados.chamada = null;
  textoEstado.textContent = mensagem;
  document.querySelector(".chamada__barra").hidden = true;
}

async function sair() {
  if (!dados.chamada) return;
  const id = dados.chamada.id_chamada;
  terminar("Saíste da chamada.");
  await sairChamada(id).catch(() => {});
  history.length > 1 ? history.back() : (location.href = "mensagens.html");
}

function ligarBotoes() {
  const alternar = (botao, tipo) => {
    const ligado = botao.getAttribute("aria-pressed") !== "true";
    botao.setAttribute("aria-pressed", String(ligado));
    dados.meuVideo.getTracks().filter((t) => t.kind === tipo).forEach((t) => (t.enabled = ligado));
  };
  document.querySelector("[data-microfone]").addEventListener("click", (e) => alternar(e.currentTarget, "audio"));
  document.querySelector("[data-camara]").addEventListener("click", (e) => alternar(e.currentTarget, "video"));
  document.querySelector("[data-sair]").addEventListener("click", sair);
  // Fechar o separador também sai da chamada
  addEventListener("pagehide", () => dados.chamada && sairChamada(dados.chamada.id_chamada));
}

async function iniciar() {
  const [config, pessoas, eu, socket] = await Promise.all([getConfigChamadas(), getUtilizadores(), getUtilizadorAtual(), tempoReal()]);
  if (!socket) throw new Error("As chamadas precisam do servidor de comunicação.");
  Object.assign(dados, { config, pessoas: porId(pessoas), eu, socket });

  try {
    dados.meuVideo = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch {
    aviso("Sem acesso à câmara ou ao microfone: os outros não te vão ver nem ouvir.");
  }
  caixaVideo(eu.id).srcObject = dados.meuVideo;

  socket.on("chamada:sinalizacao", (s) => receberSinal(s).catch(console.error));
  socket.on("chamada:participante_entrou", ({ id_chamada, id_utilizador }) => {
    if (id_chamada === dados.chamada?.id_chamada) ligarA(id_utilizador).catch(console.error);
  });
  socket.on("chamada:participante_saiu", ({ id_utilizador }) => removerColega(id_utilizador));
  socket.on("chamada:terminada", ({ id_chamada }) => {
    if (id_chamada === dados.chamada?.id_chamada) terminar("A chamada terminou.");
  });
  if (!socket.connected) await new Promise((r) => socket.once("connect", r));

  const params = new URLSearchParams(location.search);
  dados.chamada = params.get("id")
    ? await entrarChamada(Number(params.get("id")))
    : await comecarChamada({ conversaId: Number(params.get("conversa")) || null, reuniaoId: Number(params.get("reuniao")) || null });
  atualizarEstado();
  ligarBotoes();
}

iniciar().catch((erro) => {
  console.error(erro);
  terminar(erro.message || "Não foi possível entrar na chamada.");
});
