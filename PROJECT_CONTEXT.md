# Contesto progetto

**Utility Italia** — https://utilityitalia.it

- Root del repository: la cartella che contiene `wrangler.toml` e `public/` (`portale-utility-italiano`).
  Non lanciare Git, Wrangler o npm dalla cartella esterna `PORTALE DELLE UTILITY ITALIANO`.
- Remote: `https://github.com/ADVuraX/PORTALE-DELLE-UTILITY-ITALIANO`
- Hosting: Cloudflare Workers con static assets (`wrangler.toml` → `public/`), dominio personalizzato `utilityitalia.it`.
- Contenuti: `content/` (tool, aree, pagine) → `npm run build` → `public/`.

Documenti di riferimento:

- `CLAUDE.md` — architettura e regole del progetto
- `docs/guida-pubblicazione.md` — dominio Aruba → Cloudflare, deploy, email, statistiche, Search Console, AdSense
- `docs/verifica/metodo.md` — metodo di verifica dei contenuti
- `docs/verifica/report-2026-10.md` — ultima verifica completa
- `docs/tool-config-schema.md` — contratto dei config dei tool
