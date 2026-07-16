// Trivia — traducido de QuizGame (prototype/banter.jsx líneas 206-247), vanilla JS + SDK.
// El bonus de crono NO se calcula aquí: el juego reporta score/secs en crudo
// (BanterSDK.gameOver(score, {secs})) y el shell calcula el bonus (fuente única de verdad).
import { buildQuestions } from "./shuffle.mjs";

const QUESTIONS = [
  { q: "¿Capital de Francia?", opts: ["Roma", "París", "Berlín", "Madrid"], a: 1 },
  { q: "¿Cuántos días tiene una semana?", opts: ["5", "6", "7", "8"], a: 2 },
  { q: "¿Cuál es el planeta rojo?", opts: ["Venus", "Marte", "Júpiter", "Saturno"], a: 1 },
  { q: "¿Quién escribió el Quijote?", opts: ["Lorca", "Cervantes", "Neruda", "Machado"], a: 1 },
  { q: "¿Océano más grande del mundo?", opts: ["Atlántico", "Índico", "Ártico", "Pacífico"], a: 3 },
];

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
let t0 = 0;

function render() {
  const q = questions[idx];
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:18px 18px 26px;color:${C.tinta};">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">Trivia</span>
        <span style="font-family:'DM Mono',monospace;font-size:13px;color:${C.tintaSuave};">${idx + 1}/${questions.length}</span>
      </div>
      <div style="text-align:center;margin:10px 0;font-family:'DM Mono',monospace;font-size:30px;font-weight:500;color:${C.rojo};">${score}</div>
      <div style="background:${C.card};border:1px solid ${C.linea};border-radius:0;padding:22px 16px;text-align:center;margin-bottom:14px;">
        <div style="font-family:'Jost',system-ui;font-weight:800;font-size:20px;">${q.q}</div>
      </div>
      <div id="opts" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"></div>
    </div>
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
  if (i === q.a) score += 45;

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
    if (idx >= questions.length) terminar();
    else render();
  }, 850);
}

function terminar() {
  const secs = Math.round((Date.now() - t0) / 1000);
  window.BanterSDK.gameOver(score, { secs });
}

window.BanterSDK.onInit((cfg) => {
  questions = buildQuestions(QUESTIONS, cfg.seed);
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  t0 = Date.now();
  idx = 0;
  score = 0;
  picked = null;
  render();
});
