// El diferente — traducido de OddOneGame (prototype/banter.jsx líneas 284-324), vanilla JS
// + SDK. Math.random() sustituido por mulberry32(seed) vía build.mjs para que la misma
// seed produzca las mismas 5 rondas para todo el grupo. Crono ascendente + barra +
// desglose: delegados en packages/games-sdk/hud.js, igual que Trivia/Flechas.
import { buildRounds } from "./build.mjs";
import { ODD_PAIRS } from "./pairs.mjs";
import { chronoHtml, createChrono, renderBreakdown } from "../../games-sdk/hud.js";

const ROUNDS = 5;
const POINTS_PER_ROUND = 45;

// Tokens Bauhaus (ver packages/shell/src/theme.ts) — sin verde, radius 0.
const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  card: "#FFFFFF",
  linea: "rgba(26,26,26,0.12)",
  azul: "#1D5DEC",
  rojo: "#E63946",
};

const SIZE_FOR_COLS = { 3: 74, 4: 58, 5: 48 };

let rounds = [];
let round = 0;
let score = 0;
let par = null;
let chrono = null;
let finalSecs = 0;

function renderShell() {
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:18px 18px 26px;color:${C.tinta};">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">El diferente</span>
        <span id="ronda" style="font-family:'DM Mono',monospace;font-size:13px;color:${C.tintaSuave};">1/${ROUNDS}</span>
      </div>
      <div style="font-family:'Inter',system-ui;font-size:13px;color:${C.tintaSuave};margin-top:2px;">Toca el emoji que es distinto a los demás.</div>
      ${chronoHtml(par)}
      <div id="marcador" style="text-align:center;margin-bottom:10px;font-family:'DM Mono',monospace;font-size:26px;font-weight:500;color:${C.rojo};">0</div>
      <div id="area"></div>
    </div>
  `;
}

function renderRound() {
  const r = rounds[round];
  document.getElementById("ronda").textContent = `${round + 1}/${ROUNDS}`;
  const area = document.getElementById("area");
  const size = SIZE_FOR_COLS[r.cols];
  area.innerHTML = `
    <div id="grid" style="display:grid;grid-template-columns:repeat(${r.cols},1fr);gap:8px;justify-content:center;"></div>
  `;
  const grid = document.getElementById("grid");
  for (let i = 0; i < r.n; i++) {
    const btn = document.createElement("button");
    btn.textContent = i === r.oddIndex ? r.odd : r.common;
    btn.style.cssText = `height:${size}px;border:1px solid ${C.linea};background:${C.card};cursor:pointer;font-size:${size * 0.5}px;border-radius:0;`;
    btn.onclick = () => pick(i);
    grid.appendChild(btn);
  }
}

function shakeGrid() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  grid.classList.add("shake");
  setTimeout(() => grid.classList.remove("shake"), 320);
}

function pick(i) {
  const r = rounds[round];
  if (i !== r.oddIndex) {
    shakeGrid();
    return;
  }
  score += POINTS_PER_ROUND;
  document.getElementById("marcador").textContent = String(score);
  round += 1;
  if (round >= ROUNDS) mostrarDesglose();
  else renderRound();
}

// chrono.stop() congela finalSecs UNA vez aquí — terminar() reutiliza el mismo valor
// (mismo patrón que Trivia/Flechas): el desglose no debe divergir del tiempo reportado.
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
  rounds = buildRounds(ODD_PAIRS, cfg.seed, ROUNDS);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  round = 0;
  score = 0;
  finalSecs = 0;
  renderShell();
  renderRound();
  chrono = createChrono(par);
  chrono.start();
});
