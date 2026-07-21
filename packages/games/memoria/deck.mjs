// mulberry32 + buildDeck — traducido del useState inicial de MemoryGame
// (prototype/banter.jsx líneas 483-485), sustituyendo Math.random() por mulberry32(seed)
// para que la misma seed produzca el mismo reparto de cartas para todo el grupo. Duplicado
// a propósito (mismo patrón que trivia/shuffle.mjs), ver docs/ARQUITECTURA.md.
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Duplica cada emoji del pool (una carta por pareja) y las baraja — cada carta lleva un
// índice `i` estable (además del emoji `e`) para poder distinguir dos cartas idénticas al
// destaparlas, igual que en el prototipo.
export function buildDeck(pool, seed) {
  const rnd = mulberry32(seed);
  const cards = [...pool, ...pool].map((e, i) => ({ e, i }));
  for (let k = cards.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [cards[k], cards[j]] = [cards[j], cards[k]];
  }
  return cards;
}
