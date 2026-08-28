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
public/{slug}/index.html        ← pagina tool     (19)
public/{cluster}/index.html     ← pagina area     (4: calcolatori, convertitori, generatori, validatori)
public/index.html + sitemap.xml ← home + sitemap
                                  GENERATI (servono da Cloudflare)
```

- **Hosting/deploy**: `wrangler.toml` → `[assets] directory = "./public"`. La struttura di cartelle **È** la struttura degli URL. Gli URL dei tool sono **piatti**: `public/{slug}/index.html` → `/{slug}/`. Le aree stanno allo stesso livello ma al plurale (`/convertitori/` vs `/convertitore-peso/`), quindi non collidono mai — `validate.mjs` fallisce la build se qualcuno crea un tool con lo slug di un'area.
- **Tre livelli di URL**: home → `/{cluster}/` → `/{slug}/`. Le pagine area sono hub interni reali (elenco completo + intro SEO + FAQ di categoria + JSON-LD `CollectionPage`), non redirect. Il loro contenuto sta in `content/site.json` sotto `clusters.{key}` (`label`, `hint`, `h1`, `seo`, `intro` ≥120 parole, `faq` ≥3): la build fallisce se manca.
- **Fonte di verità**: `content/tools/{slug}.json` (un file per tool) + `content/site.json`. **Mai** editare a mano `public/{slug}/`, `public/{cluster}/`, `public/index.html`, `public/sitemap.xml`: sono generati e sovrascritti a ogni build.
- **Generatore**: `scripts/build.mjs` orchestra; `scripts/lib/validate.mjs` applica il contratto (`docs/tool-config-schema.md`) e **fallisce la build** se violato (min parole, ≥2 esempi/≥4 faq, ≥3 related, title/keyword uniche, ecc.); `scripts/lib/template.mjs` emette l'HTML. I `relatedTools` non ancora costruiti → card disabilitate (nessun 404), diventano link da soli quando il tool viene creato.
- **Interattività**: contenuto testuale tutto nell'HTML (per SEO); `public/assets/js/runtime.js` (condiviso) legge un blocco inline `<script data-tool-config>` e collega form → calcolatore → output. Ogni calcolatore `public/assets/js/calculators/{script}.js` è una funzione pura che si registra con `registerCalculator("{logicId}", fn)`.
- **Dati normativi versionati**: costanti fiscali in `public/assets/js/data/{topic}-{anno}.js` (es. `fisco-2026.js` → `globalThis.FISCO["2026"]`), caricate in pagina via il campo config `tool.data: ["..."]` prima del calcolatore. **Un cambio di legge = questo solo file.** Fonti nei commenti in testa. I calcolatori leggono da qui, non hardcodano i valori.
- **Bilancio "dal lordo al netto"**: campo config `tool.breakdown` (righe con `kind` gross/out/in/total) → il runtime rende un ledger con entrate (+) e uscite (−). Voci non ancora pronte: `"provisional": true` → mostrate come "in arrivo". `tool.extras` = righe aggiuntive (es. aliquota). Vedi `docs/tool-config-schema.md`.
- **Documentazione fonti**: ogni calcolo fiscale nasce da un brief `docs/research/{slug}-brief.md` (l'utente ricerca da fonti ufficiali, Claude codifica). Il calcolo di `stipendio-netto` è verificato 2026 contro calcolatori pubblici; blocco `fonti` con link ufficiali. Manca ancora l'addizionale regionale (scelta regione).
- **Ricerca**: `public/assets/js/search.js`, condiviso da home e pagine area. Filtra il DOM già presente, non fa fetch. Contratto: `[data-search-input]`, `[data-search-scope]`, `[data-search-list]`, `li[data-search]`, `[data-search-count]`, `[data-search-empty]`. Il testo indicizzato (`data-search`) è generato da `searchIndex()` in `template.mjs` e normalizzato senza accenti; termini multipli in AND. `/` mette il fuoco, Invio su risultato unico apre il tool.
- **Troncamento della home**: ogni area mostra ~5,6 righe (`.cat-list.is-clip`), le altre sono **nascoste dalla maschera CSS, non dal DOM** — restano indicizzabili e la ricerca le riporta a galla (`body[data-searching="true"]` toglie clip e sfocatura). Soglia in `template.mjs` → `CLIP_OVER`; l'altezza dipende da `--row-h`, quindi le righe d'indice devono restare ad altezza fissa.
- **SEO**: ogni pagina tool ha 3 blocchi JSON-LD (SoftwareApplication + FAQPage + BreadcrumbList a 3 livelli); ogni pagina area ne ha 3 (CollectionPage con ItemList + BreadcrumbList + FAQPage); la home ha WebSite + ItemList. OpenGraph e canonical ovunque.
- **Design**: `public/assets/css/tokens.css`. Identità **"editoriale asimmetrica"**: carta calda + inchiostro bruno, un solo accento (petrolio `#0B5560`) riservato ai numeri-risultato e alle azioni; Fraunces per i titoli, IBM Plex Sans per il testo, IBM Plex Mono per numeri ed etichette. Tre regole: **niente centrato** (colonne 7/5 e 4/8, mai `text-align:center`), **filetti hairline al posto delle ombre**, **angoli tagliati** (`.notch`) solo su card risultato e bottone Esplora. Font **self-hosted** in `public/assets/fonts/` via `npm run fonts`; `public/assets/css/fonts.css` generato.

Migrazione a Next.js rimandata oltre ~50 tool (i config JSON e i calcolatori restano identici).

## Gotcha di deploy

Se Wrangler/Git vengono lanciati dalla cartella esterna `PORTALE DELLE UTILITY ITALIANO` invece che dalla root del repo `portale-utility-italiano`, il deploy fallisce con `assets.directory ... does not exist` perché `public/` non è lì. Root corretta = quella che contiene `wrangler.toml` e `public/`. Verificare sempre `git status` (public/ tracciato) prima del push.

## Regola per ogni nuovo tool

1. Crea `content/tools/{slug}.json` conforme a `docs/tool-config-schema.md`. Il campo `cluster` deve essere una chiave esistente in `site.json` (la build fallisce altrimenti) e `tool.cardNote` compare nelle righe d'indice: scrivilo con l'iniziale maiuscola.
2. Crea il calcolatore `public/assets/js/calculators/{script}.js`: funzione pura + `registerCalculator("{logicId}", fn)`.
3. `npm run build` — pagina tool, pagina area, home e sitemap si rigenerano da sole; la build fallisce se il contratto è violato.
4. Non scrivere HTML a mano: la pagina è output del generatore.

## Stato / priorità

- Live: **24 URL** = 19 tool + 4 pagine area + home. **Calcolatori**: stipendio-netto, tfr, partita-iva-forfettario. **Generatori**: password, qr-code, uuid. **Convertitori**: valuta (tassi BCE live via Frankfurter + fallback statico), lunghezza, peso, temperatura, area, volume, velocita, tempo, dati, pressione, energia. **Validatori**: codice-fiscale (checksum + decode data/sesso/Belfiore, gestione omocodia), iban (mod-97 + decode CIN/ABI/CAB/conto).
  - Dati versionati: `tfr-2026.js`, `forfettario-2026.js`, `valute-2026-07.js` (+ `valute-live.js` per il fetch client-side). Brief fonti in `docs/research/`.
  - I 10 convertitori unità condividono un solo calcolatore `convertitore-unita.js` (logicId `unita-v1`, tabella master di fattori); le pagine differiscono solo per le `options` del config.
  - Validatori e convertitori usano la **modalità calcolatore** (non serve una modalità dedicata): `outputPrimary` format `text` + `outputSecondary` per i campi decodificati.
- Dominio: non ancora registrato — sitemap/robots usano placeholder `TUO-DOMINIO.it`, canonical relativi. Non ancora deployato.
- Priorità contenuti: completare cluster **calcolatori fiscali/lavoro** (irpef, tredicesima, imu, mutuo).
- Monetizzazione prevista: AdSense (richiede dominio live + approvazione — non testabile in locale).
