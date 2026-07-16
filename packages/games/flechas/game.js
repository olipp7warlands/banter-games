// Flechas — traducido de ArrowGame (prototype/banter.jsx líneas 691-741), vanilla JS + SDK.
// El bonus de fin de partida (corazones restantes) es parte del sistema de puntuación
// PROPIO del juego (como los +45 de Trivia), distinto del bonus de crono par/secs que
// calcula el shell — el juego siempre reporta score/secs en crudo vía BanterSDK.gameOver.
import { genArrows } from "./arrows.mjs";

const N = 8;
const CS = 40;
const START_HEARTS = 3;
const START_HINTS = 2;

const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  card: "#FFFFFF",
  linea: "rgba(26,26,26,0.12)",
  azul: "#1D5DEC",
  rojo: "#E63946",
  amarillo: "#F4C20D",
};

const DIR_GLYPH = new Map([
  ["0,1", "▶"],
  ["0,-1", "◀"],
  ["1,0", "▼"],
  ["-1,0", "▲"],
]);

let arrows = [];
let hearts = START_HEARTS;
let hints = START_HINTS;
let score = 0;
let t0 = 0;
let ended = false;
let hintArrowId = null;

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

function layout() {
  const root = document.getElementById("game");
  const live = arrows.filter((a) => !a.out).length;
  root.innerHTML = `
    <div style="padding:16px 16px 24px;color:${C.tinta};">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">Flechas</span>
        <div style="display:flex;gap:8px;align-items:center;font-family:'DM Mono',monospace;font-size:13px;">
          <span style="background:rgba(26,26,26,0.06);padding:4px 10px;border-radius:0;">➤ ${live}</span>
          <span>${Array.from({ length: START_HEARTS }).map((_, i) => `<span style="opacity:${i < hearts ? 1 : 0.18}">❤️</span>`).join("")}</span>
        </div>
      </div>
      <div id="board" style="position:relative;width:${N * CS}px;height:${N * CS}px;margin:16px auto;background:${C.card};border:1px solid ${C.linea};"></div>
      <div style="display:flex;justify-content:center;gap:10px;">
        <button id="hint" style="padding:9px 16px;border-radius:0;border:1px solid ${C.linea};background:${C.card};color:${C.tintaSuave};font-family:'Jost',system-ui;font-weight:700;font-size:13px;cursor:pointer;">💡 Pista (${hints})</button>
      </div>
      <div style="text-align:center;font-family:'Inter',system-ui;font-size:12px;color:${C.tintaSuave};margin-top:10px;">Toca una flecha con salida libre. Si está bloqueada, pierdes un corazón.</div>
    </div>
  `;
  const board = document.getElementById("board");
  for (const arrow of arrows) {
    if (arrow.out) continue;
    arrow.cells.forEach(([r, c], i) => {
      const isHead = i === arrow.cells.length - 1;
      const cell = document.createElement("button");
      cell.style.cssText = `position:absolute;left:${c * CS}px;top:${r * CS}px;width:${CS - 2}px;height:${CS - 2}px;border:none;cursor:pointer;background:${C.azul};display:grid;place-items:center;color:#fff;font-size:16px;font-family:'Jost',system-ui;`;
      if (arrow.id === hintArrowId) cell.style.background = C.amarillo;
      if (isHead) cell.textContent = DIR_GLYPH.get(`${arrow.dir[0]},${arrow.dir[1]}`) || "";
      cell.onclick = () => tap(arrow.id);
      board.appendChild(cell);
    });
  }
  document.getElementById("hint").onclick = hint;
}

function finish(finalScore) {
  if (ended) return;
  ended = true;
  setTimeout(() => {
    const secs = Math.round((Date.now() - t0) / 1000);
    window.BanterSDK.gameOver(finalScore, { secs });
  }, 400);
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
      layout();
      finish(score);
      return;
    }
    layout();
  } else {
    hearts -= 1;
    layout();
    const board = document.getElementById("board");
    board.classList.add("shake");
    setTimeout(() => board.classList.remove("shake"), 350);
    if (hearts <= 0) finish(score);
  }
}

function hint() {
  if (ended || hints <= 0) return;
  const free = arrows.find((a) => !a.out && rayFree(a, arrows));
  if (!free) return;
  hints -= 1;
  hintArrowId = free.id;
  layout();
  setTimeout(() => {
    hintArrowId = null;
    layout();
  }, 1400);
}

window.BanterSDK.onInit((cfg) => {
  arrows = genArrows(cfg.seed, N, 10);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  t0 = Date.now();
  hearts = START_HEARTS;
  hints = START_HINTS;
  score = 0;
  ended = false;
  hintArrowId = null;
  layout();
});
