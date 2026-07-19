import fs from "node:fs";
import path from "node:path";

interface ManifestGame {
  id: string;
  par: number | null;
}

// Lectura en runtime (no import estático de TS) a propósito: manifest.json vive en la raíz
// del repo, fuera de rootDir("src") de este paquete, y el servicio "api" en Railway usa la
// raíz del repo como Root Directory (ver RUNBOOK_PRODUCCION.md) — __dirname en runtime
// apunta al dist compilado (packages/api/dist/), así que la ruta relativa es estable tanto
// en local (tsx) como en producción.
const manifestPath = path.resolve(__dirname, "../../../manifest/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { juegos: ManifestGame[] };

// Único punto de acceso al catálogo de juegos desde la API. Cuando el catálogo se mueva a
// una tabla `games` en DB (milestone de backoffice), el swap se hace reescribiendo solo esta
// función.
export function getPar(gameId: string): number | null {
  const game = manifest.juegos.find((g) => g.id === gameId);
  return game?.par ?? null;
}
