// Banter HUD helper — crono ascendente + barra hacia el par + pantalla de desglose.
// NO forma parte del contrato SDK v1 (sdk.js sigue CONGELADO): es un helper OPCIONAL que
// cada bundle de juego copia igual que sdk.js (ver scripts/copy-games.mjs) e importa como
// módulo ES desde su propio game.js. Cualquier juego nuevo puede usarlo para heredar el
// mismo crono/barra/desglose que Trivia sin reimplementarlo.
//
// El bonus que calcula renderBreakdown() es SOLO visual (un instante antes de reportar
// GAME_OVER): el juego siempre reporta score/secs en crudo a BanterSDK.gameOver — el shell
// (vía la API, docs/DB_SCHEMA_M3.sql) recalcula y persiste el bonus real. Nunca se suma
// aquí al score que se reporta.

const TOKENS = {
  tinta: "#1A1A1A",
  tintaSuave: "#4A4A4A",
  card: "#FFFFFF",
  linea: "rgba(26,26,26,0.12)",
  azul: "#1D5DEC",
  rojo: "#E63946",
};

// HTML del bloque crono+barra (o solo un margen si el juego no tiene par) para insertar
// donde el juego quiera dentro de su propio render. IDs fijos: los consume createChrono().
export function chronoHtml(par) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;">
      <span id="banterHudCrono" style="font-family:'DM Mono',monospace;font-size:32px;font-weight:500;color:${TOKENS.azul};">⏱ 0s</span>
      ${par != null ? `<span style="font-family:'Inter',system-ui;font-size:11px;color:${TOKENS.tintaSuave};">bonus hasta ${par}s</span>` : ""}
    </div>
    ${
      par != null
        ? `<div style="height:6px;background:${TOKENS.linea};margin:6px 0 14px;overflow:hidden;">
             <div id="banterHudBarra" style="height:100%;width:0%;background:${TOKENS.azul};transition:width .2s linear;"></div>
           </div>`
        : `<div style="margin-bottom:14px;"></div>`
    }
  `;
}

// Crono in-place: no destruye el DOM del juego, busca sus propios nodos por id en cada
// tick — funciona incluso si el juego reconstruye su HTML en cada interacción (los ids
// persisten en el nuevo markup mientras siga usando chronoHtml()).
export function createChrono(par) {
  let t0 = 0;
  let interval = null;

  function elapsedSecs() {
    return Math.max(0, Math.floor((Date.now() - t0) / 1000));
  }

  function tick() {
    const cronoEl = document.getElementById("banterHudCrono");
    if (!cronoEl) return;
    const elapsed = elapsedSecs();
    const over = par != null && elapsed > par;
    const c = over ? TOKENS.rojo : TOKENS.azul;
    cronoEl.textContent = `⏱ ${elapsed}s`;
    cronoEl.style.color = c;
    const barraEl = document.getElementById("banterHudBarra");
    if (barraEl && par) {
      const pct = over ? 100 : Math.min(100, (elapsed / par) * 100);
      barraEl.style.width = `${pct}%`;
      barraEl.style.background = c;
    }
  }

  return {
    start() {
      t0 = Date.now();
      tick();
      if (interval) clearInterval(interval);
      interval = setInterval(tick, 1000);
    },
    // Para el intervalo y devuelve los segundos finales congelados (reutilizar ese valor,
    // no volver a leer el reloj después: si no, el tiempo mostrado y el reportado a
    // BanterSDK.gameOver divergirían por la pausa de la pantalla de desglose).
    stop() {
      if (interval) clearInterval(interval);
      interval = null;
      return elapsedSecs();
    },
  };
}

// Pantalla de desglose (mismo formato que usaba Trivia): se pinta dentro de `container` un
// instante antes de reportar GAME_OVER.
export function renderBreakdown(container, { score, secs, par }) {
  const bonus = par != null && secs != null ? Math.max(0, par - secs) * 2 : 0;
  const total = score + bonus;
  container.innerHTML = `
    <div style="text-align:center;padding:34px 10px;">
      <div style="font-family:'Jost',system-ui;font-weight:800;font-size:19px;color:${TOKENS.tinta};line-height:1.6;">
        ⏱ ${secs}s · Base ${score}${bonus > 0 ? ` + Bonus velocidad +${bonus}` : ""} = ${total}
      </div>
    </div>
  `;
}
