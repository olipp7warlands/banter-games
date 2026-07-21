// Copia el SDK, el HUD opcional y los bundles de juego a public/ para que Vite los sirva
// como estáticos. Preserva la misma estructura relativa que packages/ (games-sdk/ hermano
// de games/<id>/) porque index.html de cada juego referencia "../../games-sdk/sdk.js"
// (patrón _plantilla, congelado) y game.js puede importar "../../games-sdk/hud.js".
// Node puro (fs.cpSync), sin symlinks ni bash — el entorno de desarrollo es Windows.
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shellRoot = path.resolve(__dirname, "..");
const packagesRoot = path.resolve(shellRoot, "..");
const publicDir = path.join(shellRoot, "public");

const GAMES = ["trivia", "flechas", "math", "truefalse", "anagram", "acertijos", "oddone", "ordenar", "tornillos", "merge", "memoria", "bloques", "stack"];

fs.rmSync(path.join(publicDir, "games-sdk"), { recursive: true, force: true });
fs.rmSync(path.join(publicDir, "games"), { recursive: true, force: true });
fs.mkdirSync(path.join(publicDir, "games-sdk"), { recursive: true });
fs.mkdirSync(path.join(publicDir, "games"), { recursive: true });

fs.cpSync(path.join(packagesRoot, "games-sdk", "sdk.js"), path.join(publicDir, "games-sdk", "sdk.js"));
fs.cpSync(path.join(packagesRoot, "games-sdk", "hud.js"), path.join(publicDir, "games-sdk", "hud.js"));

for (const gameId of GAMES) {
  const src = path.join(packagesRoot, "games", gameId);
  const dest = path.join(publicDir, "games", gameId);
  fs.cpSync(src, dest, { recursive: true });
}

console.log(`copy-games: games-sdk + ${GAMES.join(", ")} -> public/`);
