# Portale Italiano delle Utility

Fabbrica di micro-tool SEO-first (calcolatori, generatori, convertitori, validatori) in italiano.
Sito **statico generato a build-time** da config JSON, servito da Cloudflare Workers static assets.

## Come funziona

```
content/site.json           configurazione globale (brand, dominio, cluster)
content/tools/{slug}.json    UN file per tool = fonte di verità (contratto: docs/tool-config-schema.md)
        │
        ▼   npm run build  →  node scripts/build.mjs  (valida + genera)
public/{cluster}/{slug}/index.html   pagine statiche
public/index.html                    homepage
public/sitemap.xml                   sitemap
```

**Non modificare a mano i file dentro `public/{cluster}/`**: sono generati e vengono sovrascritti a
ogni build. Si modifica il config in `content/tools/` e si rilancia `npm run build`.

## Comandi

```bash
npm install
npm run build     # genera public/ dai config (valida il contratto; fallisce se sotto-standard)
npm run dev       # build + npx wrangler dev → anteprima locale su http://localhost:8787
npm run deploy    # build + npx wrangler deploy
npm run fonts     # (una tantum) scarica e self-hosta i font in public/assets/fonts/
```

## Aggiungere un tool

1. Crea `content/tools/{slug}.json` conforme a `docs/tool-config-schema.md`.
2. Crea il calcolatore `public/assets/js/calculators/{script}.js`: funzione pura +
   `registerCalculator("{logicId}", fn)`.
3. `npm run build` — se il contratto è rispettato, la pagina e la sitemap si aggiornano da sole.
4. I `relatedTools` non ancora esistenti diventano card disabilitate (nessun 404); si attivano da
   soli quando crei quei tool.

## ⚠️ Checklist anti-errore deploy

L'errore `The directory specified by the "assets.directory" field ... does not exist` capita quando
`public/` non arriva su Cloudflare, o quando lanci i comandi dalla cartella sbagliata. La root
corretta è quella che contiene `wrangler.toml` e `public/`. Prima di ogni push:

```bash
npm run build
git status        # public/ deve apparire tra i file tracciati
git add -A && git commit -m "..." && git push
```

## Stack

```
Attuale:   HTML statico generato (scripts/build.mjs) + runtime JS minimo per l'interattività
Hosting:   Cloudflare Workers static assets (wrangler.toml → ./public)
Font:      self-hosted (public/assets/fonts/), nessuna dipendenza da Google in produzione
Futuro:    migrazione a Next.js oltre ~50 tool (i config JSON restano identici)
```

## Roadmap

1. **MVP (fatto)**: generatore end-to-end validato, 1 tool live (stipendio netto).
2. **V1**: completare cluster fiscali (irpef, tfr, tredicesima, forfettario) + generatori
   (password, qr, uuid); internal linking automatico dai `relatedTools`.
3. **V2+**: dominio reale, AdSense, `/llms.txt`, Search Console; poi Next.js per la generazione su scala.
