// Acertijos — mismo componente lógico que Trivia (QuizGame en prototype/banter.jsx,
// líneas 206-247, dispatcher línea 1165), solo cambia el banco de preguntas y el par.
// Crono ascendente + barra + desglose: delegados en packages/games-sdk/hud.js. El juego
// reporta score base y secs en crudo (BanterSDK.gameOver(score, {secs})); la API
// (docs/DB_SCHEMA_M3.sql) calcula y persiste el bonus real.
import { buildQuestions } from "./shuffle.mjs";
import { QUESTIONS } from "./questions.mjs";
import { chronoHtml, createChrono, renderBreakdown } from "../../games-sdk/hud.js";

const QUESTIONS_PER_DAY = 5;

// Tokens Bauhaus (ver packages/shell/src/theme.ts) — sin verde, radius 0.
const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  card: "#FFFFFF",
  linea: "rgba(26,26,26,0.12)",
  azul: "#1D5DEC",
  rojo: "#E63946",
};

let questions = [];
let idx = 0;
let score = 0;
let picked = null;
let par = null;
let chrono = null;
let finalSecs = 0;

// Se pinta UNA vez al arrancar; el crono lo actualiza hud.js in-place (no destruye el
// estado de la pregunta en curso), y #area se reemplaza por pregunta.
function renderShell() {
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:18px 18px 26px;color:${C.tinta};">
      <div style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">Acertijos</div>
      ${chronoHtml(par)}
      <div id="marcador" style="text-align:center;margin-bottom:10px;font-family:'DM Mono',monospace;font-size:26px;font-weight:500;color:${C.rojo};">0</div>
      <div id="area"></div>
    </div>
  `;
}

function renderQuestion() {
  const q = questions[idx];
  const area = document.getElementById("area");
  area.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
      <span style="font-family:'DM Mono',monospace;font-size:13px;color:${C.tintaSuave};">${idx + 1}/${questions.length}</span>
    </div>
    <div style="background:${C.card};border:1px solid ${C.linea};padding:22px 16px;text-align:center;margin-bottom:14px;">
      <div style="font-family:'Jost',system-ui;font-weight:800;font-size:20px;">${q.q}</div>
    </div>
    <div id="opts" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"></div>
  `;
  const optsEl = document.getElementById("opts");
  q.opts.forEach((label, i) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.cssText = `padding:16px 8px;border-radius:0;border:1.5px solid ${C.linea};background:${C.card};cursor:pointer;font-family:'Jost',system-ui;font-weight:700;font-size:17px;color:${C.tinta};`;
    btn.onclick = () => pick(i);
    optsEl.appendChild(btn);
  });
}

function pick(i) {
  if (picked !== null) return;
  picked = i;
  const q = questions[idx];
  if (i === q.a) {
    score += 45;
    document.getElementById("marcador").textContent = String(score);
  }

  const optsEl = document.getElementById("opts");
  Array.from(optsEl.children).forEach((btn, bi) => {
    const correct = bi === q.a;
    const chosen = bi === i;
    btn.style.background = correct ? "rgba(29,93,236,0.15)" : chosen ? "rgba(230,57,70,0.15)" : C.card;
    btn.style.borderColor = correct ? C.azul : chosen ? C.rojo : C.linea;
    if (correct) btn.textContent += " ✓";
  });

  setTimeout(() => {
    idx += 1;
    picked = null;
    if (idx >= questions.length) mostrarDesglose();
    else renderQuestion();
  }, 850);
}

// chrono.stop() congela finalSecs UNA vez aquí — terminar() reutiliza el mismo valor, no
// recalcula tras la pausa de la pantalla de desglose (si no, el tiempo mostrado y el
// reportado al shell divergirían por los ~1.8s de la pausa).
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
  questions = buildQuestions(QUESTIONS, cfg.seed, QUESTIONS_PER_DAY);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  idx = 0;
  score = 0;
  picked = null;
  finalSecs = 0;
  renderShell();
  renderQuestion();
  chrono = createChrono(par);
  chrono.start();
});
