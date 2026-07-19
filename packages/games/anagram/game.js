// Palabras (anagrama) — traducido de AnagramGame (prototype/banter.jsx líneas 327-376),
// vanilla JS + SDK. Crono+barra+desglose vía packages/games-sdk/hud.js (igual que Trivia).
// A diferencia del prototipo (que barajaba letras con Math.random() en cada render), el
// orden de letras sale de shuffle.mjs::buildWords() con la seed del día — mismo puzzle para
// todo el grupo.
import { buildWords } from "./shuffle.mjs";
import { WORDS } from "./words.mjs";
import { chronoHtml, createChrono, renderBreakdown } from "../../games-sdk/hud.js";

const WORDS_PER_DAY = 5;

const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  card: "#FFFFFF",
  cardCalido: "#FBF9F4",
  linea: "rgba(26,26,26,0.12)",
  rojo: "#E63946",
};

let rounds = [];
let idx = 0;
let score = 0;
let tiles = [];
let guess = [];
let par = null;
let chrono = null;
let finalSecs = 0;

function renderShell() {
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:18px 18px 26px;color:${C.tinta};">
      <div style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">Palabras</div>
      ${chronoHtml(par)}
      <div id="marcador" style="text-align:center;margin-bottom:10px;font-family:'DM Mono',monospace;font-size:26px;font-weight:500;color:${C.rojo};">0</div>
      <div id="area"></div>
    </div>
  `;
}

function currentRound() {
  return rounds[idx];
}

// Nueva ronda: reconstruye las fichas a partir de letterOrder (ya barajado por seed).
function renderRound() {
  const { word, letterOrder } = currentRound();
  tiles = letterOrder.map((originalIndex) => ({ ch: word[originalIndex], used: false }));
  guess = [];
  paintRound();
}

function paintRound(shake) {
  const { word } = currentRound();
  const area = document.getElementById("area");
  area.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
      <span style="font-family:'DM Mono',monospace;font-size:13px;color:${C.tintaSuave};">${idx + 1}/${rounds.length}</span>
    </div>
    <div style="text-align:center;font-family:'Inter',system-ui;font-size:12px;color:${C.tintaSuave};margin-bottom:10px;">Ordena las letras para formar la palabra.</div>
    <div id="guessRow" style="display:flex;justify-content:center;gap:8px;margin-bottom:18px;"></div>
    <div id="tilesRow" style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:16px;"></div>
    <button id="resetBtn" style="display:block;margin:0 auto;padding:9px 20px;border:1px solid ${C.linea};background:${C.card};color:${C.tintaSuave};font-family:'Jost',system-ui;font-weight:700;font-size:13px;cursor:pointer;">↺ Borrar</button>
  `;

  const guessRow = document.getElementById("guessRow");
  for (let i = 0; i < word.length; i++) {
    const box = document.createElement("div");
    const bad = !!shake;
    box.style.cssText = `width:44px;height:52px;border:2px solid ${bad ? C.rojo : C.linea};background:${C.card};display:grid;place-items:center;font-family:'Jost',system-ui;font-weight:800;font-size:24px;color:${bad ? C.rojo : C.tinta};`;
    box.textContent = guess[i] ? guess[i].ch : "";
    guessRow.appendChild(box);
  }

  const tilesRow = document.getElementById("tilesRow");
  tiles.forEach((t) => {
    const btn = document.createElement("button");
    btn.textContent = t.ch;
    btn.disabled = t.used;
    btn.style.cssText = `width:44px;height:52px;border:1.5px solid ${C.linea};background:${t.used ? C.linea : C.cardCalido};opacity:${t.used ? 0.35 : 1};cursor:${t.used ? "default" : "pointer"};font-family:'Jost',system-ui;font-weight:800;font-size:24px;color:${C.tinta};`;
    btn.onclick = () => tap(t);
    tilesRow.appendChild(btn);
  });

  document.getElementById("resetBtn").onclick = resetGuess;
}

function tap(t) {
  if (t.used) return;
  guess.push(t);
  t.used = true;
  const { word } = currentRound();

  if (guess.length < word.length) {
    paintRound();
    return;
  }

  const made = guess.map((g) => g.ch).join("");
  if (made === word) {
    score += 50;
    document.getElementById("marcador").textContent = String(score);
    paintRound();
    setTimeout(() => {
      idx += 1;
      if (idx >= rounds.length) mostrarDesglose();
      else renderRound();
    }, 700);
  } else {
    paintRound(true);
    setTimeout(() => {
      tiles.forEach((x) => (x.used = false));
      guess = [];
      paintRound();
    }, 600);
  }
}

function resetGuess() {
  tiles.forEach((t) => (t.used = false));
  guess = [];
  paintRound();
}

function mostrarDesglose() {
  finalSecs = chrono.stop();
  renderBreakdown(document.getElementById("area"), { score, secs: finalSecs, par });
  setTimeout(terminar, 1800);
}

function terminar() {
  window.BanterSDK.gameOver(score, { secs: finalSecs });
}

window.BanterSDK.onInit((cfg) => {
  par = cfg.parSegundos ?? null;
  rounds = buildWords(WORDS, cfg.seed, WORDS_PER_DAY);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  idx = 0;
  score = 0;
  finalSecs = 0;
  renderShell();
  renderRound();
  chrono = createChrono(par);
  chrono.start();
});
