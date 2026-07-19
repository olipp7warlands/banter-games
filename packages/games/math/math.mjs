// math.mjs — genera preguntas de aritmética deterministas por seed (traducido de
// makeMath() en prototype/banter.jsx, con Math.random() sustituido por mulberry32 para que
// la misma seed produzca las mismas preguntas para todo el grupo — regla de oro del reto
// diario, CLAUDE.md). Duplica mulberry32/shuffle a propósito (mismo patrón que
// trivia/shuffle.mjs y flechas/arrows.mjs): cada bundle se despliega de forma independiente.
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const OPS = [
  ["+", (a, b) => a + b],
  ["−", (a, b) => a - b],
  ["×", (a, b) => a * b],
];

export function buildMathQuestions(seed, count = 5) {
  const rnd = mulberry32(seed);
  const questions = [];
  for (let i = 0; i < count; i++) {
    const [sym, fn] = OPS[Math.floor(rnd() * OPS.length)];
    let a = 3 + Math.floor(rnd() * 9);
    let b = 2 + Math.floor(rnd() * 8);
    if (sym === "−" && b > a) [a, b] = [b, a]; // la resta nunca da negativo

    const ans = fn(a, b);
    const opts = new Set([ans]);
    while (opts.size < 4) {
      const d = ans + (Math.floor(rnd() * 11) - 5);
      if (d !== ans && d >= 0) opts.add(d);
    }
    const shuffled = shuffle([...opts], rnd);
    questions.push({ q: `${a} ${sym} ${b}`, opts: shuffled.map(String), a: shuffled.indexOf(ans) });
  }
  return questions;
}
