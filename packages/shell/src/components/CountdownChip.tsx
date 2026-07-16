import { useEffect, useState } from "react";
import { color, font, radius } from "../theme";
import { formatCountdownLabel, msUntilNextUTCMidnight } from "../lib/daily";

// Cuenta atrás hasta que cambia el reto del día (medianoche UTC). Granularidad de
// minuto es suficiente a escala de horas — no hace falta tick por segundo.
export function CountdownChip() {
  const [ms, setMs] = useState(() => msUntilNextUTCMidnight());

  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextUTCMidnight()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      style={{
        fontFamily: font.mono,
        fontSize: 12,
        color: color.blanco,
        background: color.scrim,
        padding: "4px 9px",
        borderRadius: radius,
        whiteSpace: "nowrap",
      }}
    >
      {formatCountdownLabel(ms)}
    </span>
  );
}
