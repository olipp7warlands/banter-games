// Verdadero o Falso — traducido de TrueFalseGame (prototype/banter.jsx líneas 250-281),
// vanilla JS + SDK. Crono+barra+desglose vía packages/games-sdk/hud.js (igual que Trivia).
import { buildStatements } from "./shuffle.mjs";
import { STATEMENTS } from "./statements.mjs";
import { chronoHtml, createChrono, renderBreakdown } from "../../games-sdk/hud.js";

const STATEMENTS_PER_DAY = 5;

const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  card: "#FFFFFF",
  linea: "rgba(26,26,26,0.12)",
  azul: "#1D5DEC",
  rojo: "#E63946",
};

let statements = [];
let idx = 0;
let score = 0;
let picked = null;
let par = null;
let chrono = null;
let finalSecs = 0;

function renderShell() {
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:18px 18px 26px;color:${C.tinta};">
      <div style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">Verdadero o Falso</div>
      ${chronoHtml(par)}
      <div id="marcador" style="text-align:center;margin-bottom:10px;font-family:'DM Mono',monospace;font-size:26px;font-weight:500;color:${C.rojo};">0</div>
      <div id="area"></div>
    </div>
  `;
}

function renderStatement() {
  const s = statements[idx];
  const area = document.getElementById("area");
  area.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
      <span style="font-family:'DM Mono',monospace;font-size:13px;color:${C.tintaSuave};">${idx + 1}/${statements.length}</span>
    </div>
    <div style="background:${C.card};border:1px solid ${C.linea};padding:26px 16px;text-align:center;margin-bottom:14px;min-height:70px;display:flex;align-items:center;justify-content:center;">
      <div style="font-family:'Jost',system-ui;font-weight:800;font-size:19px;">${s.s}</div>
    </div>
    <div id="opts" style="display:flex;gap:10px;"></div>
  `;
  const optsEl = document.getElementById("opts");
  [
    { val: true, label: "✅ Verdadero" },
    { val: false, label: "❌ Falso" },
  ].forEach(({ val, label }) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.cssText = `flex:1;padding:18px 0;border-radius:0;border:1.5px solid ${C.linea};background:${C.card};cursor:pointer;font-family:'Jost',system-ui;font-weight:800;font-size:17px;color:${C.tinta};`;
    btn.onclick = () => pick(val);
    optsEl.appendChild(btn);
  });
}

function pick(val) {
  if (picked !== null) return;
  picked = val;
  const s = statements[idx];
  if (val === s.a) {
    score += 45;
    document.getElementById("marcador").textContent = String(score);
  }

  const optsEl = document.getElementById("opts");
  Array.from(optsEl.children).forEach((btn, bi) => {
    const btnVal = bi === 0;
    const correct = btnVal === s.a;
    const chosen = btnVal === val;
    btn.style.background = correct ? "rgba(29,93,236,0.15)" : chosen ? "rgba(230,57,70,0.15)" : C.card;
    btn.style.borderColor = correct ? C.azul : chosen ? C.rojo : C.linea;
    if (correct) btn.textContent += " ✓";
  });

  setTimeout(() => {
    idx += 1;
    picked = null;
    if (idx >= statements.length) mostrarDesglose();
    else renderStatement();
  }, 850);
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
  statements = buildStatements(STATEMENTS, cfg.seed, STATEMENTS_PER_DAY);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  idx = 0;
  score = 0;
  picked = null;
  finalSecs = 0;
  renderShell();
  renderStatement();
  chrono = createChrono(par);
  chrono.start();
});
