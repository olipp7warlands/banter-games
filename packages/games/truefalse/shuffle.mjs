// mulberry32 + buildStatements — mismo patrón que trivia/shuffle.mjs (duplicado a
// propósito, cada bundle se despliega de forma independiente, ver docs/ARQUITECTURA.md).
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

// Elige `count` afirmaciones del banco sin repetir, determinista por seed. A diferencia de
// Trivia no hay opciones que remapear (verdadero/falso es binario y fijo).
export function buildStatements(bank, seed, count = 5) {
  const rnd = mulberry32(seed);
  const order = shuffle(
    bank.map((_, i) => i),
    rnd
  );
  return order.slice(0, count).map((i) => bank[i]);
}
