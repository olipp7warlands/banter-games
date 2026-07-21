// mulberry32 + motor puro de 2048 — traducido de MergeGame (prototype/banter.jsx líneas
// 953-1021), que YA usaba mulberry32(seed) en el prototipo (a diferencia de la mayoría de
// los otros juegos, que usaban Math.random()). Aquí se separa la lógica pura (spawn,
// deslizar una línea, mover el tablero, detectar bloqueo) de la interacción/render para
// poder testearla de forma determinista. Duplicado a propósito (mismo patrón que
// trivia/shuffle.mjs), ver docs/ARQUITECTURA.md.
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const N = 4;
export const MOVES = 40;

export function emptyGrid(n = N) {
  return Array.from({ length: n }, () => Array(n).fill(0));
}

// Coloca un 2 (90%) o un 4 (10%) en una celda vacía aleatoria. Si no hay huecos, devuelve
// la rejilla sin cambios (mismo comportamiento que spawn() en el prototipo).
export function spawn(grid, rnd, n = N) {
  const empt = [];
  grid.forEach((row, r) => row.forEach((v, c) => { if (!v) empt.push([r, c]); }));
  if (!empt.length) return grid;
  const [r, c] = empt[Math.floor(rnd() * empt.length)];
  const next = grid.map((row) => row.slice());
  next[r][c] = rnd() < 0.9 ? 2 : 4;
  return next;
}

// Colapsa una línea hacia el principio, fusionando pares iguales consecutivos una sola vez
// cada uno (mismo criterio que slideLine() en el prototipo). Devuelve [línea rellenada con
// ceros al final, puntos ganados].
export function slideLine(line, n = N) {
  const a = line.filter(Boolean);
  let gain = 0;
  const out = [];
  for (let i = 0; i < a.length; i++) {
    if (i + 1 < a.length && a[i] === a[i + 1]) {
      out.push(a[i] * 2);
      gain += a[i] * 2;
      i++;
    } else {
      out.push(a[i]);
    }
  }
  while (out.length < n) out.push(0);
  return [out, gain];
}

// Aplica un movimiento completo (L/R/U/D) al tablero, sin generar la ficha nueva (eso lo
// decide el caller, que es quien tiene el rng con estado). Devuelve { grid, gain, changed }
// — changed=false si el movimiento no altera nada (para no gastar una ficha nueva en un
// movimiento nulo, igual que el prototipo).
export function move(grid, dir, n = N) {
  let g = grid.map((r) => r.slice());
  let gain = 0;
  let changed = false;
  const get = (i, j) => (dir === "L" ? g[i][j] : dir === "R" ? g[i][n - 1 - j] : dir === "U" ? g[j][i] : g[n - 1 - j][i]);
  const set = (i, j, v) => {
    if (dir === "L") g[i][j] = v;
    else if (dir === "R") g[i][n - 1 - j] = v;
    else if (dir === "U") g[j][i] = v;
    else g[n - 1 - j][i] = v;
  };
  for (let i = 0; i < n; i++) {
    const line = Array.from({ length: n }, (_, j) => get(i, j));
    const [out, gn] = slideLine(line, n);
    gain += gn;
    for (let j = 0; j < n; j++) {
      if (get(i, j) !== out[j]) changed = true;
      set(i, j, out[j]);
    }
  }
  return { grid: g, gain, changed };
}

// ¿Ya no quedan huecos ni fusiones posibles? Mismo criterio que `stuck` en el prototipo.
export function isStuck(grid, n = N) {
  return !grid.some(
    (row, r) =>
      row.some((v, c) => !v || (c + 1 < n && v === grid[r][c + 1]) || (r + 1 < n && v === grid[r + 1][c]))
  );
}
