// mulberry32 + motor puro de Bloques — traducido de BlockGame (prototype/banter.jsx líneas
// 379-433). Igual que en Merge (packages/games/merge/engine.mjs), el rng vive como
// instancia con estado a lo largo de toda la partida (mulberry32(seed) sustituye
// Math.random()): cada vez que se agota la mano de 3 piezas se pide una nueva terna al
// mismo generador, en el mismo orden de llamadas que el prototipo. Es un juego "endless"
// (par: null en manifest.json) — no hay una única "solución del día", pero la seed
// garantiza que el tablero inicial y la primera mano son iguales para todo el grupo.
// Duplicado a propósito (mismo patrón que trivia/shuffle.mjs), ver docs/ARQUITECTURA.md.
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const N = 8;

// Piezas — mismo set que PIECES en el prototipo (línea 84), como offsets [fila,col] desde
// la esquina superior izquierda de la pieza.
export const PIECES = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 1], [1, 0], [1, 1], [1, 2]],
];

export function emptyGrid(n = N) {
  return Array.from({ length: n }, () => Array(n).fill(0));
}

// Elige 3 piezas al azar del set — mismo criterio que rand3() en el prototipo (un índice
// uniforme por pieza, en orden).
export function rand3(rnd) {
  return Array.from({ length: 3 }, () => PIECES[Math.floor(rnd() * PIECES.length)]);
}

export function canPlace(grid, piece, r, c, n = N) {
  return piece.every(([dr, dc]) => {
    const rr = r + dr;
    const cc = c + dc;
    return rr >= 0 && cc >= 0 && rr < n && cc < n && !grid[rr][cc];
  });
}

export function hasSpot(grid, piece, n = N) {
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (canPlace(grid, piece, r, c, n)) return true;
    }
  }
  return false;
}

// ¿Alguna pieza de la mano (huecos = null ya usados) todavía cabe en algún sitio? Cuando
// esto da false, se acaba la partida — mismo criterio que anyMove() en el prototipo.
export function anyMove(grid, hand, n = N) {
  return hand.some((p) => p && hasSpot(grid, p, n));
}

// Coloca `piece` en (r,c), limpia filas/columnas completas y devuelve el resultado —
// reducer puro, separado del estado de React del prototipo (place() líneas 392-406) para
// poder testearlo de forma determinista. `gained` = tamaño de la pieza + 10 por cada
// fila/columna despejada (mismo cálculo que el prototipo).
export function place(grid, piece, r, c, n = N) {
  const g = grid.map((row) => row.slice());
  piece.forEach(([dr, dc]) => {
    g[r + dr][c + dc] = 1;
  });
  let gained = piece.length;
  const fullRows = [];
  const fullCols = [];
  for (let i = 0; i < n; i++) {
    if (g[i].every((v) => v)) fullRows.push(i);
    if (g.every((row) => row[i])) fullCols.push(i);
  }
  fullRows.forEach((i) => {
    for (let x = 0; x < n; x++) g[i][x] = 0;
  });
  fullCols.forEach((i) => {
    for (let x = 0; x < n; x++) g[x][i] = 0;
  });
  gained += (fullRows.length + fullCols.length) * 10;
  return { grid: g, gained, clearedRows: fullRows.length, clearedCols: fullCols.length };
}
