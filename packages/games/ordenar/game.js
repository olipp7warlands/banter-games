// Ordenar — traducido de SortGame (prototype/banter.jsx líneas 436-480), vanilla JS + SDK.
// Math.random() sustituido por mulberry32(seed) vía board.mjs para que la misma seed
// produzca el mismo tablero para todo el grupo. La puntuación (max(60, 280 - movs*10)) es
// del propio juego, como en el prototipo — el bonus de crono par/secs lo calcula la API.
import { buildTubes, isSolved, moveBall, CAP } from "./board.mjs";
import { chronoHtml, createChrono, renderBreakdown } from "../../games-sdk/hud.js";

const COLORS = ["#E63946", "#1D5DEC", "#F4C20D"];

const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  linea: "rgba(26,26,26,0.12)",
  fondo2: "#E8E3D8",
  rojo: "#E63946",
};

let tubes = [];
let sel = null;
let moves = 0;
let par = null;
let chrono = null;
let finalSecs = 0;
let ended = false;

function renderShell() {
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:18px 16px 24px;color:${C.tinta};">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">Ordenar</span>
        <span id="movs" style="font-family:'DM Mono',monospace;font-size:13px;color:${C.tintaSuave};">movs 0</span>
      </div>
      <div style="font-family:'Inter',system-ui;font-size:13px;color:${C.tintaSuave};margin-top:2px;">Agrupa cada color en su tubo. Toca origen y luego destino.</div>
      ${chronoHtml(par)}
      <div id="area"></div>
    </div>
  `;
}

function renderTubes() {
  const area = document.getElementById("area");
  area.innerHTML = `<div id="tubos" style="display:flex;justify-content:center;gap:12px;margin:24px 0;flex-wrap:wrap;"></div>`;
  const wrap = document.getElementById("tubos");
  tubes.forEach((t, i) => {
    const btn = document.createElement("button");
    btn.style.cssText = `width:44px;height:${CAP * 30 + 10}px;border:2px solid ${i === sel ? C.rojo : C.linea};border-top:none;border-radius:0;background:${C.fondo2};display:flex;flex-direction:column-reverse;padding:5px;gap:4px;cursor:pointer;`;
    t.forEach((col) => {
      const ball = document.createElement("div");
      ball.style.cssText = `height:26px;border-radius:0;background:${col};`;
      btn.appendChild(ball);
    });
    btn.onclick = () => tap(i);
    wrap.appendChild(btn);
  });
}

function tap(i) {
  if (ended) return;
  if (sel === null) {
    if (tubes[i].length) sel = i;
    renderTubes();
    return;
  }
  if (sel === i) {
    sel = null;
    renderTubes();
    return;
  }
  const next = moveBall(tubes, sel, i, CAP);
  sel = null;
  if (!next) {
    renderTubes();
    return;
  }
  tubes = next;
  moves += 1;
  document.getElementById("movs").textContent = `movs ${moves}`;
  renderTubes();
  if (isSolved(tubes, CAP)) {
    ended = true;
    const score = Math.max(60, 280 - moves * 10);
    setTimeout(() => finish(score), 400);
  }
}

// chrono.stop() congela finalSecs UNA vez aquí — terminar() reutiliza el mismo valor
// (mismo patrón que Trivia/Flechas): el desglose no debe divergir del tiempo reportado.
function finish(score) {
  finalSecs = chrono.stop();
  renderBreakdown(document.getElementById("area"), { score, secs: finalSecs, par });
  setTimeout(() => terminar(score), 1800);
}

function terminar(score) {
  window.BanterSDK.gameOver(score, { secs: finalSecs });
}

window.BanterSDK.onInit((cfg) => {
  par = cfg.parSegundos ?? null;
  tubes = buildTubes(COLORS, cfg.seed, CAP);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  sel = null;
  moves = 0;
  ended = false;
  finalSecs = 0;
  renderShell();
  renderTubes();
  chrono = createChrono(par);
  chrono.start();
});
