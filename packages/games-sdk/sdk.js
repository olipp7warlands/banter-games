/* Banter Games SDK v1 — contrato shell <-> juego (iframe/postMessage). CONGELADO: cambios = v2. */
(function () {
  const listeners = { init: [], start: [], pause: [], resume: [], end: [] };
  let parentOrigin = "*"; // el shell fija origin real en produccion
  window.addEventListener("message", (e) => {
    const m = e.data || {};
    if (!m.banter) return;
    if (m.type === "INIT") { parentOrigin = e.origin; listeners.init.forEach((f) => f(m.payload)); }
    if (m.type === "START") listeners.start.forEach((f) => f());
    if (m.type === "PAUSE") listeners.pause.forEach((f) => f());
    if (m.type === "RESUME") listeners.resume.forEach((f) => f());
    if (m.type === "END") listeners.end.forEach((f) => f());
  });
  const send = (type, payload) => parent.postMessage({ banter: 1, v: 1, type, payload }, parentOrigin);
  window.BanterSDK = {
    /* payload INIT: { seed:number, tema:"classic|hero|pirate|space", dificultad:"facil|media|dificil", parSegundos:number|null, idioma:"es" } */
    onInit: (f) => listeners.init.push(f),
    onStart: (f) => listeners.start.push(f),
    onPause: (f) => listeners.pause.push(f),
    onResume: (f) => listeners.resume.push(f),
    onEnd: (f) => listeners.end.push(f),
    ready: () => send("READY"),
    scoreUpdate: (score) => send("SCORE_UPDATE", { score }),
    gameOver: (score, stats) => send("GAME_OVER", { score, stats: stats || {} }), // stats: { secs, aciertos, ... }
  };
})();
