// mulberry32 + buildTubes — traducido de init() en SortGame (prototype/banter.jsx líneas
// 438-446), sustituyendo Math.random() por mulberry32(seed) para que la misma seed
// produzca el mismo tablero para todo el grupo. Duplicado a propósito (mismo patrón que
// trivia/shuffle.mjs), ver docs/ARQUITECTURA.md.
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CAP = 4;

// Baraja CAP fichas de cada color y las reparte en tantos tubos como colores, más 2 tubos
// vacíos para maniobrar — mismo shuffle Fisher-Yates que el resto de juegos, con la misma
// seed para todo el grupo.
export function buildTubes(colors, seed, cap = CAP) {
  const rnd = mulberry32(seed);
  const balls = [];
  colors.forEach((c) => {
    for (let i = 0; i < cap; i++) balls.push(c);
  });
  for (let i = balls.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [balls[i], balls[j]] = [balls[j], balls[i]];
  }
  const tubes = [];
  for (let k = 0; k < colors.length; k++) tubes.push(balls.slice(k * cap, (k + 1) * cap));
  tubes.push([]);
  tubes.push([]);
  return tubes;
}

// ¿Todos los tubos están vacíos o llenos de un único color? Mismo criterio que win() en el
// prototipo.
export function isSolved(tubes, cap = CAP) {
  return tubes.every((t) => t.length === 0 || (t.length === cap && t.every((c) => c === t[0])));
}

// Mueve toda la racha superior de un mismo color de `from` a `to` si es un movimiento
// válido (destino vacío o con el mismo color arriba, y con hueco). Devuelve las nuevas
// tubes o null si el movimiento no es válido — misma lógica que tap() en el prototipo,
// separada de la interacción para poder testearla de forma determinista.
export function moveBall(tubes, from, to, cap = CAP) {
  if (from === to) return null;
  const src = tubes[from];
  const dst = tubes[to];
  if (!src.length) return null;
  const col = src[src.length - 1];
  if (dst.length >= cap || (dst.length && dst[dst.length - 1] !== col)) return null;
  const next = tubes.map((t) => t.slice());
  while (next[from].length && next[from][next[from].length - 1] === col && next[to].length < cap) {
    next[to].push(next[from].pop());
  }
  return next;
}
