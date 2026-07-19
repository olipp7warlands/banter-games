// Flechas — traducido de ArrowGame (prototype/banter.jsx líneas 691-741), vanilla JS + SDK.
// El bonus de fin de partida (corazones restantes) es parte del sistema de puntuación
// PROPIO del juego (como los +45 de Trivia), distinto del bonus de crono par/secs que
// calcula la API — el juego siempre reporta score/secs en crudo vía BanterSDK.gameOver.
// Sin Pista: es el reto diario COMPETITIVO (misma seed para todo el grupo) — una ayuda
// regalaría la solución de ese seed compartido a quien la usa. Crono+barra+desglose vía
// packages/games-sdk/hud.js, igual que Trivia (ver comentario ahí).
import { genArrows } from "./arrows.mjs";
import { chronoHtml, createChrono, renderBreakdown } from "../../games-sdk/hud.js";

const N = 8;
const CS = 40;
const START_HEARTS = 3;

const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  card: "#FFFFFF",
  linea: "rgba(26,26,26,0.12)",
  azul: "#1D5DEC",
  rojo: "#E63946",
};

const DIR_GLYPH = new Map([
  ["0,1", "▶"],
  ["0,-1", "◀"],
  ["1,0", "▼"],
  ["-1,0", "▲"],
]);

let arrows = [];
let hearts = START_HEARTS;
let score = 0;
let par = null;
let chrono = null;
let finalSecs = 0;
let ended = false;

function rayFree(arrow, list) {
  const occ = new Set();
  list.forEach((o) => {
    if (o.id !== arrow.id && !o.out) o.cells.forEach(([r, c]) => occ.add(`${r},${c}`));
  });
  const [hr, hc] = arrow.cells[arrow.cells.length - 1];
  let r = hr + arrow.dir[0];
  let c = hc + arrow.dir[1];
  while (r >= 0 && r < N && c >= 0 && c < N) {
    if (occ.has(`${r},${c}`)) return false;
    r += arrow.dir[0];
    c += arrow.dir[1];
  }
  return true;
}

// Se pinta UNA vez al arrancar (título + contador de flechas/corazones + HUD de crono);
// renderBoard() solo toca #hudArrows y #content en cada toque, así el crono de hud.js
// (que vive fuera de ambos) nunca se recrea ni parpadea a "0s" entre toques.
function renderShell() {
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:16px 16px 24px;color:${C.tinta};">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">Flechas</span>
        <span id="hudArrows" style="display:flex;gap:8px;align-items:center;font-family:'DM Mono',monospace;font-size:13px;"></span>
      </div>
      ${chronoHtml(par)}
      <div id="content"></div>
    </div>
  `;
}

function renderBoard() {
  const live = arrows.filter((a) => !a.out).length;
  const hudArrows = document.getElementById("hudArrows");
  if (hudArrows) {
    hudArrows.innerHTML = `
      <span style="background:rgba(26,26,26,0.06);padding:4px 10px;border-radius:0;">➤ ${live}</span>
      <span>${Array.from({ length: START_HEARTS }).map((_, i) => `<span style="opacity:${i < hearts ? 1 : 0.18}">❤️</span>`).join("")}</span>
    `;
  }
  const content = document.getElementById("content");
  content.innerHTML = `
    <div id="board" style="position:relative;width:${N * CS}px;height:${N * CS}px;margin:16px auto;background:${C.card};border:1px solid ${C.linea};"></div>
    <div style="text-align:center;font-family:'Inter',system-ui;font-size:12px;color:${C.tintaSuave};margin-top:10px;">Toca una flecha con salida libre. Si está bloqueada, pierdes un corazón.</div>
  `;
  const board = document.getElementById("board");
  for (const arrow of arrows) {
    if (arrow.out) continue;
    arrow.cells.forEach(([r, c], i) => {
      const isHead = i === arrow.cells.length - 1;
      const cell = document.createElement("button");
      cell.style.cssText = `position:absolute;left:${c * CS}px;top:${r * CS}px;width:${CS - 2}px;height:${CS - 2}px;border:none;cursor:pointer;background:${C.azul};display:grid;place-items:center;color:#fff;font-size:16px;font-family:'Jost',system-ui;`;
      if (isHead) cell.textContent = DIR_GLYPH.get(`${arrow.dir[0]},${arrow.dir[1]}`) || "";
      cell.onclick = () => tap(arrow.id);
      board.appendChild(cell);
    });
  }
}

// chrono.stop() congela finalSecs UNA vez aquí — terminar() reutiliza el mismo valor
// (mismo patrón que Trivia): el desglose no debe divergir del tiempo reportado al shell.
function finish(finalScore) {
  if (ended) return;
  ended = true;
  finalSecs = chrono.stop();
  setTimeout(() => mostrarDesglose(finalScore), 400);
}

// Reemplaza solo #content (tablero+ayuda) — el título y el crono congelado de hud.js
// siguen visibles arriba, igual que en Trivia.
function mostrarDesglose(finalScore) {
  renderBreakdown(document.getElementById("content"), { score: finalScore, secs: finalSecs, par });
  setTimeout(() => terminar(finalScore), 1800);
}

function terminar(finalScore) {
  window.BanterSDK.gameOver(finalScore, { secs: finalSecs });
}

function tap(arrowId) {
  if (ended) return;
  const arrow = arrows.find((a) => a.id === arrowId);
  if (!arrow || arrow.out) return;

  if (rayFree(arrow, arrows)) {
    arrow.out = true;
    score += 18;
    const remaining = arrows.filter((a) => !a.out).length;
    if (remaining === 0) {
      score += hearts * 40 + 60; // bonus de terminar el tablero, parte del scoring propio del juego
      renderBoard();
      finish(score);
      return;
    }
    renderBoard();
  } else {
    hearts -= 1;
    renderBoard();
    const board = document.getElementById("board");
    board.classList.add("shake");
    setTimeout(() => board.classList.remove("shake"), 350);
    if (hearts <= 0) finish(score);
  }
}

window.BanterSDK.onInit((cfg) => {
  par = cfg.parSegundos ?? null;
  arrows = genArrows(cfg.seed, N, 10);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  hearts = START_HEARTS;
  score = 0;
  ended = false;
  finalSecs = 0;
  renderShell();
  renderBoard();
  chrono = createChrono(par);
  chrono.start();
});
