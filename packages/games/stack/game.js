// Stack — traducido de StackGame (prototype/banter.jsx líneas 772-880), vanilla JS + SDK.
// El prototipo dibujaba los cuboides isométricos con SVG (<polygon>); aquí se usa <canvas>
// (packages/games/_plantilla recomienda "Canvas/DOM ligero" para este tipo de juego en
// tiempo real, ver CLAUDE.md) — misma proyección isométrica y misma lógica de juego
// (engine.mjs), solo cambia la superficie de dibujo. Endless (par: null en manifest.json):
// crono ascendente sin barra ni bonus de velocidad, igual que Merge/Bloques. La seed solo
// fija el color inicial de la torre (initialHue) — el resto es tiempo real y depende de la
// puntería del jugador, como en el prototipo.
import { S0, BLK, VIS, axisOf, project, resolveDrop, nextSpeed, nextAmplitude, initialHue } from "./engine.mjs";
import { chronoHtml, createChrono, renderBreakdown } from "../../games-sdk/hud.js";

const SW = 340;
const SH = 380;
const CX = SW / 2;
const CY = 318;
const FRAG_MS = 750;

const C = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  linea: "rgba(26,26,26,0.12)",
  rojo: "#E63946",
};

let canvas = null;
let ctx = null;
let stack = [];
let fragments = [];
let score = 0;
let comboCount = 0;
let spd = 120;
let amp = S0 + 70;
let pos = -180;
let dir = 1;
let par = null;
let chrono = null;
let finalSecs = 0;
let over = false;
let rafId = null;
let lastT = null;

function renderShell() {
  const root = document.getElementById("game");
  root.innerHTML = `
    <div style="padding:16px 16px 24px;color:${C.tinta};">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:'Jost',system-ui;font-weight:800;font-size:24px;">Stack</span>
        <span id="altura" style="font-family:'DM Mono',monospace;font-size:13px;color:${C.tintaSuave};background:rgba(26,26,26,0.06);padding:4px 10px;">🧱 0</span>
      </div>
      <div style="font-family:'Inter',system-ui;font-size:13px;color:${C.tintaSuave};margin-top:2px;">Toca para soltar. Lo que sobresale, se corta.</div>
      ${chronoHtml(par)}
      <div id="marcador" style="text-align:center;margin-bottom:6px;font-family:'DM Mono',monospace;font-size:26px;font-weight:500;color:${C.rojo};">0</div>
      <div id="wrap" style="position:relative;width:${SW}px;max-width:100%;margin:8px auto 0;">
        <canvas id="cv" width="${SW}" height="${SH}" style="display:block;width:100%;height:auto;background:linear-gradient(180deg,#F3F0F9,#DAE4EE);border:1px solid ${C.linea};cursor:pointer;"></canvas>
      </div>
      <div style="text-align:center;font-family:'DM Mono',monospace;font-size:11px;color:${C.tintaSuave};margin-top:10px;">ejes alternos · 3 perfectos recuperan tamaño</div>
    </div>
  `;
  canvas = document.getElementById("cv");
  ctx = canvas.getContext("2d");
  canvas.onclick = drop;
}

function drawCuboid(x, y, w, d, z, h, hue, camOff, alpha = 1) {
  const p = (px, py, pz) => {
    const [sx, sy] = project(px, py, pz, CX, CY);
    return [sx, sy + camOff];
  };
  ctx.globalAlpha = alpha;

  // Cara derecha (x+w)
  ctx.fillStyle = `hsl(${hue},58%,40%)`;
  drawPoly([p(x + w, y, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x + w, y, z + h)]);

  // Cara frontal (y+d)
  ctx.fillStyle = `hsl(${hue},58%,50%)`;
  drawPoly([p(x, y + d, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x, y + d, z + h)]);

  // Cara superior
  ctx.fillStyle = `hsl(${hue},60%,64%)`;
  drawPoly([p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)]);

  ctx.globalAlpha = 1;
}

function drawPoly(points) {
  ctx.beginPath();
  points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, SW, SH);
  const camOff = Math.max(0, stack.length - VIS) * BLK;

  stack.forEach((b, i) => drawCuboid(b.x, b.y, b.w, b.d, i * BLK, BLK, b.hue, camOff));

  if (!over) {
    const lvlNow = stack.length;
    const axNow = axisOf(lvlNow);
    const top = stack[stack.length - 1];
    const mv = {
      x: top.x + (axNow === "x" ? pos : 0),
      y: top.y + (axNow === "y" ? pos : 0),
      w: top.w,
      d: top.d,
      hue: (top.hue + 9) % 360,
    };
    drawCuboid(mv.x, mv.y, mv.w, mv.d, lvlNow * BLK, BLK, mv.hue, camOff);
  }

  const now = performance.now();
  fragments = fragments.filter((f) => now - f.startTime < FRAG_MS);
  fragments.forEach((f) => {
    const t = (now - f.startTime) / FRAG_MS;
    const alpha = Math.max(0, 1 - t);
    const fall = t * t * 60;
    drawCuboid(f.x, f.y, f.w, f.d, f.lvl * BLK - fall, BLK, f.hue, camOff, alpha);
  });
}

function loop(t) {
  if (lastT == null) lastT = t;
  const dt = (t - lastT) / 1000;
  lastT = t;
  if (!over) {
    let p = pos + dir * spd * dt;
    if (p >= amp) {
      p = amp;
      dir = -1;
    }
    if (p <= -amp) {
      p = -amp;
      dir = 1;
    }
    pos = p;
  }
  draw();
  rafId = requestAnimationFrame(loop);
}

function drop() {
  if (over) return;
  const top = stack[stack.length - 1];
  const level = stack.length;
  const res = resolveDrop(top, level, pos, comboCount);

  if (res.over) {
    over = true;
    if (rafId) cancelAnimationFrame(rafId);
    setTimeout(finish, 1100);
    return;
  }

  stack.push(res.block);
  score += res.points;
  comboCount = res.comboCount;
  document.getElementById("marcador").textContent = String(score);
  document.getElementById("altura").textContent = `🧱 ${stack.length - 1}`;

  if (res.fragment) fragments.push({ ...res.fragment, lvl: level, startTime: performance.now() });

  spd = nextSpeed(spd);
  const nLvl = level + 1;
  amp = nextAmplitude(res.block, nLvl);
  pos = nLvl % 2 === 0 ? amp : -amp;
  dir = nLvl % 2 === 0 ? -1 : 1;
}

// chrono.stop() congela finalSecs UNA vez aquí — terminar() reutiliza el mismo valor
// (mismo patrón que Trivia/Flechas): el desglose no debe divergir del tiempo reportado.
function finish() {
  finalSecs = chrono.stop();
  const wrap = document.getElementById("wrap");
  const overlay = document.createElement("div");
  overlay.style.cssText = `position:absolute;inset:0;display:grid;place-items:center;background:rgba(20,8,10,.35);color:#fff;font-family:'Jost',system-ui;font-weight:800;font-size:24px;`;
  overlay.textContent = `Torre de ${stack.length - 1} 🧱`;
  wrap.appendChild(overlay);
  setTimeout(() => {
    renderBreakdown(document.getElementById("game"), { score, secs: finalSecs, par });
    setTimeout(terminar, 1800);
  }, 600);
}

function terminar() {
  window.BanterSDK.gameOver(score, { secs: finalSecs });
}

window.BanterSDK.onInit((cfg) => {
  par = cfg.parSegundos ?? null;
  stack = [{ x: -S0 / 2, y: -S0 / 2, w: S0, d: S0, hue: initialHue(cfg.seed) }];
  window.BanterSDK.ready();
});

window.BanterSDK.onStart(() => {
  fragments = [];
  score = 0;
  comboCount = 0;
  spd = 120;
  amp = S0 + 70;
  pos = -180;
  dir = 1;
  over = false;
  finalSecs = 0;
  lastT = null;
  renderShell();
  document.getElementById("altura").textContent = "🧱 0";
  chrono = createChrono(par);
  chrono.start();
  rafId = requestAnimationFrame(loop);
});
