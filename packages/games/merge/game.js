// Merge (2048) — traducido de MergeGame (prototype/banter.jsx líneas 953-1021), vanilla JS
// + SDK. Es un juego "endless" (par: null en manifest.json): el crono se muestra ascendente
// igual que el resto (regla de oro, CLAUDE.md) pero sin barra ni bonus de velocidad — solo
// cuentan los 40 movimientos. Crono+desglose: packages/games-sdk/hud.js.
import { N, MOVES, emptyGrid, spawn, move, isStuck, mulberry32 } from "./engine.mjs";
import { chronoHtml, createChrono, renderBreakdown } from "../../games-sdk/hud.js";

const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  rojo: "#E63946",
};

const TILE_COLORS = {
  2: ["#F7F1E4", C.tinta],
  4: ["#F0E2C4", C.tinta],
  8: ["#F5B87A", "#fff"],
  16: ["#F09A5C", "#fff"],
  32: ["#EE7F55", "#fff"],
  64: ["#E85F3B", "#fff"],
  128: ["#F2D26B", "#fff"],
  256: ["#F0C94F", "#fff"],
  512: ["#EEC043", "#fff"],
  1024: ["#ECB72F", "#fff"],
  2048: ["#F5A623", "#fff"],
};

let rnd = null;
let grid = [];
let score = 0;
let left = MOVES;
let par = null;
let chrono = null;
let finalSecs = 0;
let ended = false;
let pointerStart = null;

function renderShell() {
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:16px 16px 24px;color:${C.tinta};">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">2048</span>
        <span id="movs" style="font-family:'DM Mono',monospace;font-size:13px;color:${C.tintaSuave};"></span>
      </div>
      <div style="font-family:'Inter',system-ui;font-size:13px;color:${C.tintaSuave};margin-top:2px;">Desliza (o usa las flechas) para unir iguales. ${MOVES} movimientos.</div>
      ${chronoHtml(par)}
      <div id="marcador" style="text-align:center;margin-bottom:10px;font-family:'DM Mono',monospace;font-size:26px;font-weight:500;color:${C.rojo};">0</div>
      <div id="area"></div>
    </div>
  `;
}

function renderBoard() {
  document.getElementById("movs").textContent = `${left} movs`;
  const area = document.getElementById("area");
  area.innerHTML = `
    <div id="tablero" style="position:relative;width:300px;margin:0 auto;max-width:100%;background:rgba(26,26,26,0.06);padding:8px;box-sizing:border-box;touch-action:none;user-select:none;">
      <div style="display:grid;grid-template-columns:repeat(${N},1fr);gap:8px;">
        ${grid
          .map((row) =>
            row
              .map((v) => {
                const [bg, fg] = v ? TILE_COLORS[v] || TILE_COLORS[2048] : ["rgba(255,255,255,0.6)", "transparent"];
                return `<div style="height:62px;display:grid;place-items:center;background:${bg};color:${fg};font-family:'Jost',system-ui;font-weight:800;font-size:${v >= 1024 ? 19 : v >= 128 ? 23 : 27}px;">${v || ""}</div>`;
              })
              .join("")
          )
          .join("")}
      </div>
    </div>
  `;
  const tablero = document.getElementById("tablero");
  tablero.onpointerdown = (e) => { pointerStart = [e.clientX, e.clientY]; };
  tablero.onpointerup = (e) => {
    if (!pointerStart) return;
    const dx = e.clientX - pointerStart[0];
    const dy = e.clientY - pointerStart[1];
    pointerStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : dy > 0 ? "D" : "U");
  };
}

function doMove(dir) {
  if (ended) return;
  const result = move(grid, dir, N);
  if (!result.changed) return;
  grid = spawn(result.grid, rnd, N);
  score += result.gain;
  left -= 1;
  document.getElementById("marcador").textContent = String(score);
  renderBoard();
  if (left <= 0 || isStuck(grid, N)) {
    ended = true;
    setTimeout(finish, 900);
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
  grid = spawn(spawn(emptyGrid(N), rnd, N), rnd, N);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  score = 0;
  left = MOVES;
  ended = false;
  finalSecs = 0;
  pointerStart = null;
  renderShell();
  renderBoard();
  document.addEventListener("keydown", onKey);
  chrono = createChrono(par);
  chrono.start();
});

function onKey(e) {
  const map = { ArrowLeft: "L", ArrowRight: "R", ArrowUp: "U", ArrowDown: "D" };
  if (map[e.key]) doMove(map[e.key]);
}
