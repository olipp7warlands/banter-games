// mulberry32 + buildWords — mismo patrón que trivia/shuffle.mjs (duplicado a propósito,
// cada bundle se despliega de forma independiente, ver docs/ARQUITECTURA.md). El barajado
// de letras de cada palabra también sale de la MISMA seed (no de Math.random() como en el
// prototipo) para que el puzzle sea idéntico para todo el grupo — regla de oro del reto
// diario (CLAUDE.md).
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

// Elige `count` palabras del banco sin repetir y, para cada una, un orden de letras
// barajado (índices sobre la palabra original, no caracteres — así las letras repetidas no
// dan problemas). Todo con la misma seed, como buildQuestions() en trivia/shuffle.mjs.
export function buildWords(bank, seed, count = 5) {
  const rnd = mulberry32(seed);
  const order = shuffle(
    bank.map((_, i) => i),
    rnd
  );
  const picked = order.slice(0, count).map((i) => bank[i]);
  return picked.map((word) => ({
    word,
    letterOrder: shuffle(
      word.split("").map((_, i) => i),
      rnd
    ),
  }));
}
