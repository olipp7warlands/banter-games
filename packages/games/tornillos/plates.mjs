// mulberry32 + genPlates — traducido de genPlates() en prototype/banter.jsx líneas
// 883-896. La paleta original (PAL) incluía un verde (#7FB069), prohibido por el sistema
// Bauhaus fijado en CLAUDE.md ("Sin verde") — se sustituye por los tokens de marca (azul,
// rojo, amarillo) más tinta y un gris neutro, manteniendo 5 colores distintos para que
// placas apiladas se distingan bien. Duplicado a propósito (mismo patrón que
// trivia/shuffle.mjs), ver docs/ARQUITECTURA.md.
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PAL = ["#1D5DEC", "#E63946", "#F4C20D", "#1A1A1A", "#8A8A8A"];

// 3 niveles (z=0,1,2) con 2,2,1 placas respectivamente — mismo reparto [2,2,1] que el
// prototipo. Cada placa tiene entre 120-180 de ancho, 74-118 de alto, posición dentro del
// tablero (BW×BH) y 3 tornillos en posiciones aleatorias dentro de la placa — todo con la
// misma seed, en el mismo orden de llamadas a rnd() que el prototipo.
export function genPlates(seed, BW, BH) {
  const rnd = mulberry32(seed);
  const plates = [];
  let pid = 0;
  let sid = 0;
  [2, 2, 1].forEach((n, z) => {
    for (let k = 0; k < n; k++) {
      const w = 120 + Math.floor(rnd() * 60);
      const h = 74 + Math.floor(rnd() * 44);
      const x = 8 + Math.floor(rnd() * (BW - w - 16));
      const y = 8 + Math.floor(rnd() * (BH - h - 16));
      const screws = Array.from({ length: 3 }, () => ({
        id: sid++,
        px: 14 + Math.floor(rnd() * (w - 28)),
        py: 14 + Math.floor(rnd() * (h - 28)),
        out: false,
      }));
      plates.push({ id: pid++, z, x, y, w, h, col: PAL[Math.floor(rnd() * PAL.length)], screws, gone: false });
    }
  });
  return plates;
}

// ¿Este tornillo está tapado por una placa de un nivel superior (z mayor) que sigue en el
// tablero? Mismo criterio que blocked() en el prototipo: solo bloquea si el punto del
// tornillo cae dentro del rectángulo de la placa superior.
export function isBlocked(plates, plate, screw) {
  return plates.some(
    (q) =>
      !q.gone &&
      q.z > plate.z &&
      plate.x + screw.px >= q.x &&
      plate.x + screw.px <= q.x + q.w &&
      plate.y + screw.py >= q.y &&
      plate.y + screw.py <= q.y + q.h
  );
}

// Quita un tornillo de su placa (reducer puro, primer paso de la cascada de tap()). No
// marca la placa como "gone" todavía — eso es responsabilidad de markPlateGoneIfEmpty(),
// igual que el prototipo lo hace en un setTimeout separado.
export function withScrewRemoved(plates, plateId, screwId) {
  return plates.map((p) => (p.id === plateId ? { ...p, screws: p.screws.filter((s) => s.id !== screwId) } : p));
}

// Si la placa se quedó sin tornillos, márcala "gone" (sigue en la lista, para la animación
// de caída) — segundo paso de la cascada.
export function markPlateGoneIfEmpty(plates, plateId) {
  return plates.map((p) => (p.id === plateId && p.screws.length === 0 && !p.gone ? { ...p, gone: true } : p));
}

// Retira definitivamente una placa "gone" de la lista — tercer y último paso.
export function dropPlate(plates, plateId) {
  return plates.filter((p) => p.id !== plateId);
}
