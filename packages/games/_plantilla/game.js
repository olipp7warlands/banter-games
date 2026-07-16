/* Plantilla de minijuego Banter. Sustituir la logica; el ciclo de vida ya esta cableado. */
let seed, par, score = 0, t0;
function mulberry32(a){return function(){let t=(a+=0x6d2b79f5);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
BanterSDK.onInit((cfg) => { seed = cfg.seed; par = cfg.parSegundos; /* generar nivel con mulberry32(seed) */ BanterSDK.ready(); });
BanterSDK.onStart(() => { t0 = Date.now(); /* arrancar loop */ });
function terminar() { const secs = Math.round((Date.now() - t0) / 1000); BanterSDK.gameOver(score, { secs }); }
