// mulberry32 + buildRounds — traducido de build(r) en OddOneGame (prototype/banter.jsx
// líneas 291-296), sustituyendo Math.random() por mulberry32(seed) para que la misma seed
// produzca las mismas 5 rondas para todo el grupo (regla de oro del reto diario, CLAUDE.md).
// Duplicado a propósito (mismo patrón que trivia/shuffle.mjs), ver docs/ARQUITECTURA.md.
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tamaño del tablero por ronda: 3x3 en las 2 primeras, 4x4 en las 2 siguientes, 5x5 en la
// última — mismo progresivo que el prototipo (cols = r<2?3:r<4?4:5).
function colsFor(round) {
  return round < 2 ? 3 : round < 4 ? 4 : 5;
}

// Elige, para cada ronda, un par [común, diferente] del banco y la celda donde va el
// diferente — todo con la misma seed, en el mismo orden en que el prototipo llamaba
// Math.random() (pareja primero, índice después) para que el resultado sea reproducible.
export function buildRounds(pairs, seed, rounds = 5) {
  const rnd = mulberry32(seed);
  const out = [];
  for (let r = 0; r < rounds; r++) {
    const cols = colsFor(r);
    const n = cols * cols;
    const [common, odd] = pairs[Math.floor(rnd() * pairs.length)];
    const oddIndex = Math.floor(rnd() * n);
    out.push({ cols, n, common, odd, oddIndex });
  }
  return out;
}
