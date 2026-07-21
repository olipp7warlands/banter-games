// Tornillos — traducido de ScrewGame (prototype/banter.jsx líneas 897-950), vanilla JS +
// SDK. genPlates(seed) reemplaza el fallback a Math.random() del prototipo: siempre usa la
// seed del día para que el puzzle sea idéntico para todo el grupo. Crono ascendente +
// barra + desglose: delegados en packages/games-sdk/hud.js, igual que Trivia/Flechas.
import { genPlates, isBlocked, withScrewRemoved, markPlateGoneIfEmpty, dropPlate } from "./plates.mjs";
import { chronoHtml, createChrono, renderBreakdown } from "../../games-sdk/hud.js";

const BW = 330;
const BH = 300;
const POINTS_PER_SCREW = 15;
const COMPLETE_BONUS = 60;

const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  linea: "rgba(26,26,26,0.12)",
  fondo2: "#E8E3D8",
  rojo: "#E63946",
};

let plates = [];
let score = 0;
let par = null;
let chrono = null;
let finalSecs = 0;
let ended = false;

function renderShell() {
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:16px 16px 24px;color:${C.tinta};">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">Tornillos</span>
        <span id="nScrews" style="font-family:'DM Mono',monospace;font-size:13px;color:${C.tintaSuave};background:${C.fondo2};padding:4px 10px;"></span>
      </div>
      <div style="font-family:'Inter',system-ui;font-size:13px;color:${C.tintaSuave};margin-top:2px;">Solo salen los tornillos que no tapa otra placa. Vacía una placa y caerá.</div>
      ${chronoHtml(par)}
      <div id="marcador" style="text-align:center;margin-bottom:10px;font-family:'DM Mono',monospace;font-size:26px;font-weight:500;color:${C.rojo};">0</div>
      <div id="area"></div>
    </div>
  `;
}

function renderBoard() {
  const nScrews = plates.reduce((a, p) => a + p.screws.length, 0);
  const nEl = document.getElementById("nScrews");
  if (nEl) nEl.textContent = `🔩 ${nScrews}`;

  const area = document.getElementById("area");
  area.innerHTML = `<div id="board" style="position:relative;width:${BW}px;height:${BH}px;margin:0 auto;max-width:100%;background:${C.fondo2};border:1px solid ${C.linea};overflow:hidden;"></div>`;
  const board = document.getElementById("board");

  [...plates]
    .sort((a, b) => a.z - b.z)
    .forEach((p) => {
      const plateEl = document.createElement("div");
      plateEl.style.cssText = `position:absolute;left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px;background:${p.col};border:2px solid rgba(0,0,0,0.18);border-radius:0;transition:opacity .3s,transform .3s;${p.gone ? "opacity:0;transform:scale(.85);" : ""}`;
      board.appendChild(plateEl);

      p.screws.forEach((s) => {
        const btn = document.createElement("button");
        btn.textContent = "✚";
        btn.style.cssText = `position:absolute;left:${p.x + s.px - 13}px;top:${p.y + s.py - 13}px;width:26px;height:26px;border-radius:50%;border:2px solid #6E7480;background:radial-gradient(circle at 35% 30%,#F2F3F6,#A9AEB8);cursor:pointer;display:grid;place-items:center;font-size:12px;font-weight:800;color:#5A616D;padding:0;`;
        btn.onclick = () => tap(p, s);
        board.appendChild(btn);
      });
    });
}

function shakeAt(plateId, screwId) {
  const board = document.getElementById("board");
  if (!board) return;
  board.classList.add("shake");
  setTimeout(() => board.classList.remove("shake"), 320);
}

function tap(plate, screw) {
  if (ended) return;
  if (isBlocked(plates, plate, screw)) {
    shakeAt(plate.id, screw.id);
    return;
  }
  score += POINTS_PER_SCREW;
  document.getElementById("marcador").textContent = String(score);
  plates = withScrewRemoved(plates, plate.id, screw.id);
  renderBoard();

  setTimeout(() => {
    plates = markPlateGoneIfEmpty(plates, plate.id);
    renderBoard();
    const pl = plates.find((p) => p.id === plate.id);
    if (pl && pl.gone) {
      setTimeout(() => {
        plates = dropPlate(plates, plate.id);
        renderBoard();
        if (plates.length === 0 && !ended) {
          ended = true;
          score += COMPLETE_BONUS;
          document.getElementById("marcador").textContent = String(score);
          setTimeout(finish, 350);
        }
      }, 430);
    }
  }, 340);
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
  plates = genPlates(cfg.seed, BW, BH);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  score = 0;
  ended = false;
  finalSecs = 0;
  renderShell();
  renderBoard();
  chrono = createChrono(par);
  chrono.start();
});
