// mulberry32 — mismo PRNG que packages/games/_plantilla/game.js. Se duplica a propósito
// en cada bundle de juego (no se comparte paquete) para que cada juego se pueda desplegar
// de forma independiente, tal y como pide docs/ARQUITECTURA.md.
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Baraja el orden de las preguntas y, dentro de cada una, el orden de las opciones,
// de forma determinista por seed — devuelve el índice de la opción correcta ya remapeado.
export function buildQuestions(questions, seed) {
  const rnd = mulberry32(seed);
  const order = shuffle(
    questions.map((_, i) => i),
    rnd
  );
  return order.map((qi) => {
    const src = questions[qi];
    const optOrder = shuffle(
      src.opts.map((_, i) => i),
      rnd
    );
    const opts = optOrder.map((oi) => src.opts[oi]);
    const a = optOrder.indexOf(src.a);
    return { q: src.q, opts, a };
  });
}
