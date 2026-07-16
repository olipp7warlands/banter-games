// mulberry32 + genArrows — traducido de ArrowGame (prototype/banter.jsx líneas 662-690).
// Duplicado a propósito respecto a trivia/shuffle.mjs: cada bundle de juego se despliega
// de forma independiente (docs/ARQUITECTURA.md), así que no comparten paquete.
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIRS = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

// Coloca `target` flechas (cadenas de 3-5 celdas conectadas) en un tablero NxN sin solapar,
// garantizando que la salida (rayo en línea recta desde la cabeza) esté libre al generarlas.
export function genArrows(seed, n, target) {
  const rnd = mulberry32(seed);
  const occ = new Map();
  const arrows = [];
  const key = (r, c) => r + "," + c;
  const rayHasOcc = (r, c, d) => {
    let rr = r + d[0];
    let cc = c + d[1];
    while (rr >= 0 && rr < n && cc >= 0 && cc < n) {
      if (occ.has(key(rr, cc))) return true;
      rr += d[0];
      cc += d[1];
    }
    return false;
  };

  let id = 0;
  let fails = 0;
  while (arrows.length < target && fails < 600) {
    const len = 3 + Math.floor(rnd() * 3);
    const sr = Math.floor(rnd() * n);
    const sc = Math.floor(rnd() * n);
    if (occ.has(key(sr, sc))) {
      fails++;
      continue;
    }
    const cells = [[sr, sc]];
    const used = new Set([key(sr, sc)]);
    let lastDir = null;
    for (let i = 1; i < len; i++) {
      const dirs = [...DIRS].sort(() => rnd() - 0.5);
      let moved = false;
      for (const d of dirs) {
        const [pr, pc] = cells[cells.length - 1];
        const nr = pr + d[0];
        const nc = pc + d[1];
        if (nr < 0 || nr >= n || nc < 0 || nc >= n || occ.has(key(nr, nc)) || used.has(key(nr, nc))) continue;
        cells.push([nr, nc]);
        used.add(key(nr, nc));
        lastDir = d;
        moved = true;
        break;
      }
      if (!moved) break;
    }
    if (cells.length < 3 || !lastDir) {
      fails++;
      continue;
    }
    const head = cells[cells.length - 1];
    if (rayHasOcc(head[0], head[1], lastDir)) {
      fails++;
      continue;
    }
    cells.forEach(([r, c]) => occ.set(key(r, c), id));
    arrows.push({ id: id++, cells, dir: lastDir, out: false });
  }
  return arrows;
}
