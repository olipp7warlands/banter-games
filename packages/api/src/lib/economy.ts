// Monedas por intento válido (no solo el mejor del día): con 2 intentos/día + el regalo
// diario ponderado de abajo, un pack de 300 monedas cae en ~5-6 días de juego activo,
// dentro del objetivo "5-9 días" de CLAUDE.md.
export const COINS_PER_PARTIDA = 10;

interface GiftReward {
  amount: number;
  weight: number;
}

// Solo tipo "coins": el prototipo (prototype/banter.jsx::REWARDS) también sortea temas/
// marcos/escudos-de-racha, pero esos no tienen tabla/columna real en ningún schema —
// fingir esa recompensa sería deuda técnica invisible. Mismos pesos que el prototipo.
const GIFT_REWARDS: GiftReward[] = [
  { amount: 30, weight: 3 },
  { amount: 60, weight: 1 },
];

export function rollGiftReward(random: number = Math.random()): GiftReward {
  const total = GIFT_REWARDS.reduce((sum, r) => sum + r.weight, 0);
  let r = random * total;
  for (const reward of GIFT_REWARDS) {
    r -= reward.weight;
    if (r <= 0) return reward;
  }
  return GIFT_REWARDS[0];
}
