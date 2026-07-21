// mulberry32 + motor puro de Stack — traducido de StackGame (prototype/banter.jsx líneas
// 772-880). A diferencia del resto de juegos, la seed del día SOLO decide el color inicial
// de la torre (hue0) — el resto de la partida es tiempo real y depende de la puntería del
// jugador (oscilación por requestAnimationFrame), igual que en el prototipo. Es un juego
// "endless" (par: null en manifest.json): no hay una única "solución del día", pero la
// seed garantiza que todo el grupo empieza con el mismo color de torre. resolveDrop() es
// la lógica pura de qué pasa al soltar un bloque (líneas 797-840 del prototipo), separada
// del bucle de animación y del estado de React para poder testearla de forma determinista.
// Duplicado a propósito (mismo patrón que trivia/shuffle.mjs), ver docs/ARQUITECTURA.md.
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const S0 = 110;
export const TOL = 8;
export const BLK = 22;
export const VIS = 7;
export const PERFECT_POINTS = 25;
export const MISS_POINTS = 10;

// Color inicial de la torre — único uso de la seed en este juego (mismo hue0 para todo el
// grupo el mismo día).
export function initialHue(seed) {
  const rnd = mulberry32(seed);
  return Math.floor(rnd() * 360);
}

// Los bloques alternan el eje sobre el que se pueden desplazar: nivel impar -> eje X,
// nivel par -> eje Y (mismo criterio que axisOf() en el prototipo).
export function axisOf(level) {
  return level % 2 === 1 ? "x" : "y";
}

// Proyección isométrica: (x,y,z) del mundo -> (screenX, screenY) del canvas. Misma fórmula
// que P() en el prototipo.
export function project(x, y, z, cx, cy) {
  return [cx + (x - y) * 0.866, cy + (x + y) * 0.5 - z];
}

// Resuelve un intento de soltar el bloque en la posición oscilante `offset`, contra el
// bloque superior actual `top` ({x,y,w,d,hue}) en el nivel `level` (el nivel que se está
// construyendo, no el del top). `comboCount` = perfectos consecutivos acumulados hasta
// ahora. Devuelve { over: true } si el desbordamiento es total (fin de partida), o
// { over: false, block, points, perfect, fragment, comboCount } — `fragment` es la parte
// cortada que cae (o null si fue un acierto perfecto).
export function resolveDrop(top, level, offset, comboCount) {
  const ax = axisOf(level);
  const dim = ax === "x" ? top.w : top.d;
  if (Math.abs(offset) >= dim - 4) return { over: true };

  const perfect = Math.abs(offset) <= TOL;
  const block = { x: top.x, y: top.y, w: top.w, d: top.d, hue: (top.hue + 9) % 360 };
  let fragment = null;
  let points;
  let nextCombo = comboCount;

  if (perfect) {
    nextCombo = comboCount + 1;
    points = PERFECT_POINTS;
    if (nextCombo >= 3) {
      if (ax === "x") {
        const g = Math.min(10, S0 - block.w);
        block.x -= g / 2;
        block.w += g;
      } else {
        const g = Math.min(10, S0 - block.d);
        block.y -= g / 2;
        block.d += g;
      }
    }
  } else {
    nextCombo = 0;
    points = MISS_POINTS;
    const o = offset;
    if (ax === "x") {
      if (o > 0) {
        block.x = top.x + o;
        block.w = top.w - o;
        fragment = { x: top.x + top.w, y: top.y, w: o, d: top.d, hue: top.hue };
      } else {
        block.w = top.w + o;
        fragment = { x: top.x + o, y: top.y, w: -o, d: top.d, hue: top.hue };
      }
    } else {
      if (o > 0) {
        block.y = top.y + o;
        block.d = top.d - o;
        fragment = { x: top.x, y: top.y + top.d, w: top.w, d: o, hue: top.hue };
      } else {
        block.d = top.d + o;
        fragment = { x: top.x, y: top.y + o, w: top.w, d: -o, hue: top.hue };
      }
    }
  }

  return { over: false, block, points, perfect, fragment, comboCount: nextCombo };
}

// Velocidad/amplitud de la oscilación tras un drop — mismo esquema que el prototipo:
// la velocidad sube 7 por drop (tope 330), la amplitud pasa a depender del tamaño del
// nuevo bloque en el eje que le toca al siguiente nivel.
export function nextSpeed(spd) {
  return Math.min(330, spd + 7);
}

export function nextAmplitude(block, nextLevel) {
  const ax = axisOf(nextLevel);
  const dim = ax === "x" ? block.w : block.d;
  return dim + 70;
}
