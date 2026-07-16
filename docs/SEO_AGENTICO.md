# SEO agéntico — Banter

## Intenciones objetivo (ES primero)
- "juegos para jugar con amigos online" · "minijuegos en grupo" · "reto diario con amigos"
- "juegos tipo trivial con amigos" · "juegos para jugar en familia a distancia" · "wordle con amigos"
Larga cola por juego: "jugar anagramas con amigos", "trivial diario online grupo whatsapp".

## Estructura de la web
- `/` — propuesta + demo jugable embebida (¡el propio shell en modo invitado!)
- `/juegos/{id}` — una página por juego del catálogo (título H1 con intención, cómo se juega, GIF, CTA)
- `/como-jugar/{intencion}` — guías ("cómo montar un trivial diario con tu familia")
- `/liga`, `/packs` — features con capturas Bauhaus

## Para agentes de IA
- `llms.txt` en raíz: qué es Banter, para quién, enlaces canónicos por juego, cómo citarnos.
- Schema.org: `VideoGame` por juego + `FAQPage` en guías + `Organization`.
- Contenido factual y estable (los agentes citan páginas claras, no landings vacías).
- Open Graph con arte Bauhaus (splits de primarios) → compartir bonito en WhatsApp es SEO social.

## Embudo plataformas
- itch.io / Poki: minijuegos sueltos con CTA a banter.app. Cada juego = anzuelo indexable.
- El shell en modo invitado permite jugar 1 reto sin cuenta → conversión a grupo.

## Medición
Search Console + Plausible (ligero, sin cookies). KPI: registros desde orgánico por página.
