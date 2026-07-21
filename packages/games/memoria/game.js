// Memoria — traducido de MemoryGame (prototype/banter.jsx líneas 483-518), vanilla JS +
// SDK. Math.random() sustituido por mulberry32(seed) vía deck.mjs para que la misma seed
// reparta las mismas cartas para todo el grupo. Puntuación propia del juego
// (pool.length*30 + bonus por pocos fallos), como en el prototipo — el bonus de crono
// par/secs lo calcula la API. Crono+desglose: packages/games-sdk/hud.js.
import { buildDeck } from "./deck.mjs";
import { chronoHtml, createChrono, renderBreakdown } from "../../games-sdk/hud.js";

const POOL = ["🍎", "🍌", "🍇", "🍒", "🥝", "🍑"];

const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  card: "#FFFFFF",
  linea: "rgba(26,26,26,0.12)",
  rojo: "#E63946",
};

let deck = [];
let flipped = [];
let matched = [];
let moves = 0;
let mistakes = 0;
let lock = false;
let par = null;
let chrono = null;
let finalSecs = 0;

function renderShell() {
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:18px 16px 24px;color:${C.tinta};">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">Memoria</span>
        <span id="movs" style="font-family:'DM Mono',monospace;font-size:13px;color:${C.tintaSuave};">movs 0</span>
      </div>
      <div style="font-family:'Inter',system-ui;font-size:13px;color:${C.tintaSuave};margin-top:2px;">Encuentra las parejas.</div>
      ${chronoHtml(par)}
      <div id="area"></div>
    </div>
  `;
}

function renderCards() {
  const area = document.getElementById("area");
  area.innerHTML = `<div id="grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:6px;max-width:300px;margin-left:auto;margin-right:auto;"></div>`;
  const grid = document.getElementById("grid");
  deck.forEach((c, idx) => {
    const show = matched.includes(c.e) || flipped.includes(idx);
    const btn = document.createElement("button");
    btn.textContent = show ? c.e : "";
    btn.style.cssText = `height:66px;border:1px solid ${C.linea};background:${show ? C.card : C.rojo};cursor:pointer;font-size:30px;opacity:${matched.includes(c.e) ? 0.55 : 1};border-radius:0;`;
    btn.onclick = () => tap(idx);
    grid.appendChild(btn);
  });
}

function tap(idx) {
  if (lock) return;
  const c = deck[idx];
  if (matched.includes(c.e) || flipped.includes(idx)) return;
  flipped = [...flipped, idx];
  renderCards();
  if (flipped.length === 2) {
    moves += 1;
    lock = true;
    document.getElementById("movs").textContent = `movs ${moves}`;
    if (deck[flipped[0]].e === deck[flipped[1]].e) {
      setTimeout(() => {
        matched = [...matched, deck[flipped[0]].e];
        flipped = [];
        lock = false;
        if (matched.length === POOL.length) {
          const score = POOL.length * 30 + Math.max(0, 80 - mistakes * 8);
          finish(score);
        } else {
          renderCards();
        }
      }, 500);
    } else {
      mistakes += 1;
      setTimeout(() => {
        flipped = [];
        lock = false;
        renderCards();
      }, 750);
    }
  }
}

// chrono.stop() congela finalSecs UNA vez aquí — terminar() reutiliza el mismo valor
// (mismo patrón que Trivia/Flechas): el desglose no debe divergir del tiempo reportado.
function finish(score) {
  renderCards();
  finalSecs = chrono.stop();
  renderBreakdown(document.getElementById("area"), { score, secs: finalSecs, par });
  setTimeout(() => terminar(score), 1800);
}

function terminar(score) {
  window.BanterSDK.gameOver(score, { secs: finalSecs });
}

window.BanterSDK.onInit((cfg) => {
  par = cfg.parSegundos ?? null;
  deck = buildDeck(POOL, cfg.seed);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  flipped = [];
  matched = [];
  moves = 0;
  mistakes = 0;
  lock = false;
  finalSecs = 0;
  renderShell();
  renderCards();
  chrono = createChrono(par);
  chrono.start();
});
