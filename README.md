# Portale Italiano delle Utility

## ⚠️ Checklist anti-errore deploy (leggere prima di ogni push)

L'errore `The directory specified by the "assets.directory" field ... does not exist` capita
quando `public/` non arriva su Cloudflare. Prima di ogni push:

```bash
git status                 # public/ deve apparire tra i file tracciati
git add -A
git commit -m "..."
git push
```

Se `public/` non compare in `git status` dopo `git add -A`, la cartella non esiste localmente
dove ti aspetti — verifica di essere nella root del repo (dove sta `wrangler.toml`).

## Struttura del repo (unica fonte di verità)

```
portale-utility-italiano/
├── wrangler.toml              ← [assets] directory = "./public"
├── package.json
├── docs/tool-config-schema.md ← contratto per ogni nuovo tool
├── templates/tool-page.template.html   ← pattern da copiare (non deployato)
└── public/                    ← TUTTO qui dentro è servito da Cloudflare
    ├── index.html
    ├── robots.txt
    ├── _headers
    ├── assets/
    │   ├── css/tokens.css
    │   └── js/
    │       ├── tool-engine.js
    │       └── calculators/stipendio-netto.js
    ├── config/tools/calcolatore-stipendio-netto.json
    └── calcolatori/
        └── calcolatore-stipendio-netto/
            └── index.html      ← URL reale: /calcolatori/calcolatore-stipendio-netto/
```

**Regola**: ogni nuovo tool = una cartella `public/{cluster}/{slug}/index.html`. Non usare mai
`/demo/` o cartelle fuori dal pattern URL reale — la struttura del repo È la struttura del sito.

## Stack di riferimento (target, non ancora implementato)

```
Frontend:   Next.js 14+ (App Router) — quando si supera ~50 tool, per generazione automatica
Attuale:    HTML statico + motore JS config-driven (assets/js/tool-engine.js)
Hosting:    Cloudflare Workers (assets statici) via wrangler.toml
```

## Deploy

```bash
npm install
npm run deploy    # = npx wrangler deploy
```

## Roadmap

1. **MVP (attuale)**: 1 tool live (stipendio netto), pattern validato end-to-end
2. **V1**: 20-40 tool nei cluster calcolatori/generatori/convertitori/validatori, internal linking da `relatedTools[]`, sitemap.xml generata dai config
3. **V2+**: migrazione a Next.js + `@cloudflare/next-on-pages` per generazione automatica da config JSON, ISR per varianti long-tail
