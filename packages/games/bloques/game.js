// Bloques — traducido de BlockGame (prototype/banter.jsx líneas 379-433), vanilla JS +
// SDK. Math.random() sustituido por mulberry32(seed) vía engine.mjs: el rng se mantiene con
// estado durante toda la partida (igual que Merge) para que la mano inicial sea la misma
// para todo el grupo. Endless (par: null en manifest.json): crono ascendente sin barra ni
// bonus de velocidad, igual que Merge. Puntuación propia del juego (tamaño de pieza + 10
// por fila/columna despejada), como en el prototipo.
import { N, emptyGrid, rand3, canPlace, anyMove, place, mulberry32 } from "./engine.mjs";
import { chronoHtml, createChrono, renderBreakdown } from "../../games-sdk/hud.js";

const CELL = 34;
const PIECE_COLOR = "#E63946";

const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  linea: "rgba(26,26,26,0.12)",
  fondo2: "rgba(26,26,26,0.06)",
  rojo: "#E63946",
};

let rnd = null;
let grid = [];
let hand = [];
let sel = null;
let score = 0;
let par = null;
let chrono = null;
let finalSecs = 0;
let ended = false;

function renderShell() {
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:16px 16px 24px;color:${C.tinta};">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">Bloques</span>
        <span style="font-family:'DM Mono',monospace;font-size:13px;color:${C.tintaSuave};">encaja y limpia</span>
      </div>
      ${chronoHtml(par)}
      <div id="marcador" style="text-align:center;margin-bottom:10px;font-family:'DM Mono',monospace;font-size:26px;font-weight:500;color:${C.rojo};">0</div>
      <div id="area"></div>
    </div>
  `;
}

function pieceBounds(piece) {
  const rows = Math.max(...piece.map((p) => p[0])) + 1;
  const cols = Math.max(...piece.map((p) => p[1])) + 1;
  return { rows, cols };
}

function renderArea() {
  const area = document.getElementById("area");
  area.innerHTML = `
    <div id="grid" style="display:grid;grid-template-columns:repeat(${N},1fr);gap:3px;width:${N * CELL}px;margin:0 auto 14px;"></div>
    <div id="hand" style="display:flex;justify-content:center;gap:14px;"></div>
    <div style="text-align:center;font-family:'Inter',system-ui;font-size:12px;color:${C.tintaSuave};margin-top:12px;">Elige pieza y toca dónde va (esquina sup. izq.). Limpia filas y columnas.</div>
  `;
  const gridEl = document.getElementById("grid");
  grid.forEach((row, r) =>
    row.forEach((v, c) => {
      const btn = document.createElement("button");
      btn.style.cssText = `height:${CELL}px;border:none;background:${v ? PIECE_COLOR : C.fondo2};cursor:pointer;border-radius:0;`;
      btn.onclick = () => tapCell(r, c);
      gridEl.appendChild(btn);
    })
  );

  const handEl = document.getElementById("hand");
  hand.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.disabled = !p;
    btn.style.cssText = `padding:8px;border:${sel === i ? `2px solid ${C.rojo}` : `1px solid ${C.linea}`};background:${p ? "#FFFFFF" : "transparent"};cursor:${p ? "pointer" : "default"};opacity:${p ? 1 : 0.3};min-width:58px;min-height:58px;display:grid;place-items:center;border-radius:0;`;
    if (p) {
      const { rows, cols } = pieceBounds(p);
      const mini = document.createElement("div");
      mini.style.cssText = `display:grid;grid-template-columns:repeat(${cols},1fr);gap:2px;`;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const has = p.some(([dr, dc]) => dr === r && dc === c);
          const cell = document.createElement("div");
          cell.style.cssText = `width:11px;height:11px;background:${has ? PIECE_COLOR : "transparent"};`;
          mini.appendChild(cell);
        }
      }
      btn.appendChild(mini);
    }
    btn.onclick = () => { if (p) { sel = i; renderArea(); } };
    handEl.appendChild(btn);
  });
}

function tapCell(r, c) {
  if (ended || sel === null || !hand[sel] || !canPlace(grid, hand[sel], r, c, N)) return;
  const piece = hand[sel];
  const { grid: g, gained } = place(grid, piece, r, c, N);
  grid = g;
  score += gained;
  document.getElementById("marcador").textContent = String(score);
  hand[sel] = null;
  sel = null;
  if (hand.every((p) => !p)) hand = rand3(rnd);
  renderArea();
  if (!anyMove(grid, hand, N)) {
    ended = true;
    setTimeout(finish, 500);
  }
}

// chrono.stop() congela finalSecs UNA vez aquí — terminar() reutiliza el mismo valor
// (mismo patrón que Trivia/Flechas): el desglose no debe divergir del tiempo reportado.
function finish() {
  finalSecs = chrono.stop();
  renderBreakdown(document.getElementById("area"), { score, secs: finalSecs, par });
  setTimeout(terminar, 1800);
}

function terminar() {
  window.BanterSDK.gameOver(score, { secs: finalSecs });
}

window.BanterSDK.onInit((cfg) => {
  par = cfg.parSegundos ?? null;
  rnd = mulberry32(cfg.seed);
  grid = emptyGrid(N);
  hand = rand3(rnd);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  score = 0;
  sel = null;
  ended = false;
  finalSecs = 0;
  renderShell();
  renderArea();
  chrono = createChrono(par);
  chrono.start();
});
