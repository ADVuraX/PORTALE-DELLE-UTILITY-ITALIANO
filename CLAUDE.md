# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Cos'è

Portale delle Utility Italiano: fabbrica di micro-tool SEO-first (calcolatori, generatori, convertitori, validatori) in italiano. Ogni tool è una URL statica indicizzabile a sé — **niente SPA, niente fallback client-side**. Sito multi-pagina servito da Cloudflare Workers static assets.

## Comandi

```bash
npm install
npm run build    # node scripts/build.mjs — genera public/ dai config in content/ (valida il contratto)
npm run dev      # build + npx wrangler dev — anteprima locale http://localhost:8787
npm run deploy   # build + npx wrangler deploy
npm run fonts    # (una tantum) scarica e self-hosta i font in public/assets/fonts/
node --check public/assets/js/<file>.js   # sanity check sintassi di un calcolatore
```

`dev` e `deploy` eseguono sempre `build` prima, quindi `public/` è sempre rigenerato. Non esiste
ancora un test runner/linter: i calcolatori sono funzioni pure JS, verificabili con `node --check` e
input noti (smoke test: `registerCalculator=()=>{}; eval(src)` e chiama la funzione).

## Architettura (big picture)

Pipeline **generatore statico** (Fase 1 completata, luglio 2026):

```
content/site.json + content/tools/{slug}.json   ← FONTE DI VERITÀ (non serviti)
        │  npm run build → scripts/build.mjs (valida + template)
        ▼
public/{cluster}/{slug}/index.html + index.html + sitemap.xml   ← GENERATI (servono da Cloudflare)
```

- **Hosting/deploy**: `wrangler.toml` → `[assets] directory = "./public"`. La struttura di cartelle **È** la struttura degli URL: `public/{cluster}/{slug}/index.html` → `/{cluster}/{slug}/`.
- **Fonte di verità**: `content/tools/{slug}.json` (un file per tool) + `content/site.json`. **Mai** editare a mano `public/{cluster}/`, `public/index.html`, `public/sitemap.xml`: sono generati e sovrascritti a ogni build.
- **Generatore**: `scripts/build.mjs` orchestra; `scripts/lib/validate.mjs` applica il contratto (`docs/tool-config-schema.md`) e **fallisce la build** se violato (min parole, ≥2 esempi/≥4 faq, ≥3 related, title/keyword uniche, ecc.); `scripts/lib/template.mjs` emette l'HTML. I `relatedTools` non ancora costruiti → card disabilitate (nessun 404), diventano link da soli quando il tool viene creato.
- **Interattività**: contenuto testuale tutto nell'HTML (per SEO); `public/assets/js/runtime.js` (condiviso) legge un blocco inline `<script data-tool-config>` e collega form → calcolatore → output. Ogni calcolatore `public/assets/js/calculators/{script}.js` è una funzione pura che si registra con `registerCalculator("{logicId}", fn)`.
- **Dati normativi versionati**: costanti fiscali in `public/assets/js/data/{topic}-{anno}.js` (es. `fisco-2026.js` → `globalThis.FISCO["2026"]`), caricate in pagina via il campo config `tool.data: ["..."]` prima del calcolatore. **Un cambio di legge = questo solo file.** Fonti nei commenti in testa. I calcolatori leggono da qui, non hardcodano i valori.
- **Bilancio "dal lordo al netto"**: campo config `tool.breakdown` (righe con `kind` gross/out/in/total) → il runtime rende un ledger con entrate (+) e uscite (−). Voci non ancora pronte: `"provisional": true` → mostrate come "in arrivo". `tool.extras` = righe aggiuntive (es. aliquota). Vedi `docs/tool-config-schema.md`.
- **Documentazione fonti**: ogni calcolo fiscale nasce da un brief `docs/research/{slug}-brief.md` (l'utente ricerca da fonti ufficiali, Claude codifica). Il calcolo di `stipendio-netto` è verificato 2026 contro calcolatori pubblici; blocco `fonti` con link ufficiali. Manca ancora l'addizionale regionale (scelta regione).
- **SEO**: ogni pagina ha 3 blocchi JSON-LD (SoftwareApplication + FAQPage + BreadcrumbList) + OpenGraph, generati dal config.
- **Design**: `public/assets/css/tokens.css` (design token, identità "scheda tecnica civica" verde/ocra). Font **self-hosted** in `public/assets/fonts/` via `npm run fonts` (nessuna dipendenza Google in produzione); `public/assets/css/fonts.css` generato.

Migrazione a Next.js rimandata oltre ~50 tool (i config JSON e i calcolatori restano identici).

## Gotcha di deploy

Se Wrangler/Git vengono lanciati dalla cartella esterna `PORTALE DELLE UTILITY ITALIANO` invece che dalla root del repo `portale-utility-italiano`, il deploy fallisce con `assets.directory ... does not exist` perché `public/` non è lì. Root corretta = quella che contiene `wrangler.toml` e `public/`. Verificare sempre `git status` (public/ tracciato) prima del push.

## Regola per ogni nuovo tool

1. Crea `content/tools/{slug}.json` conforme a `docs/tool-config-schema.md`.
2. Crea il calcolatore `public/assets/js/calculators/{script}.js`: funzione pura + `registerCalculator("{logicId}", fn)`.
3. `npm run build` — la pagina e la sitemap si generano da sole; la build fallisce se il contratto è violato.
4. Non scrivere HTML a mano: la pagina è output del generatore.

## Stato / priorità

- Live: 1 tool (`calcolatore-stipendio-netto`).
- Dominio: non ancora registrato — sitemap/robots usano placeholder `TUO-DOMINIO.it`, canonical relativi.
- Priorità contenuti: cluster **calcolatori fiscali/lavoro** (irpef, tfr, tredicesima, forfettario) e **generatori** (password, qr, uuid).
- Monetizzazione prevista: AdSense (richiede dominio live + approvazione — non testabile in locale).
