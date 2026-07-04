# Portale Italiano delle Utility — Architettura di progetto

## 1. Stack di riferimento

```
Frontend:   Next.js 14+ (App Router) — SSG per pagine tool, ISR per varianti dinamiche
Styling:    CSS Modules / Tailwind su design tokens condivisi (vedi assets/css/tokens.css)
Backend:    Serverless functions (Vercel) solo dove serve calcolo lato server o API
DB:         SQLite (MVP) → PostgreSQL (V1+) — solo per contenuti/varianti, non per i calcoli
Hosting:    Vercel o Cloudflare Pages
Analytics:  GA4 + Plausible
```

Questo scaffold contiene la **struttura cartelle**, il **template HTML master** (i 9 blocchi
obbligatori), il **motore di rendering config-driven** e un **esempio di config tool** già
funzionante (Calcolatore Stipendio Netto), così puoi vedere subito il pattern end-to-end.

## 2. Perché "fabbrica di tool" e non pagine scritte a mano

Ogni tool = **un file di configurazione**, non una pagina scritta da zero. Questo è il cuore
della scalabilità (MVP 20-40 → V3 1000+ pagine): aggiungere un tool nuovo significa scrivere un
JSON, non del codice.

```
/portale-utility
├── config/
│   └── tools/
│       ├── calcolatore-stipendio-netto.json   ← 1 file = 1 pagina tool
│       ├── calcolatore-imu.json
│       └── generatore-password.json
├── templates/
│   └── tool-page.template.html                ← master template, 9 blocchi obbligatori
├── assets/
│   ├── css/tokens.css                         ← design tokens (colori, tipografia, spacing)
│   └── js/tool-engine.js                      ← legge il config e monta tool + contenuto + FAQ + JSON-LD
├── docs/
│   └── tool-config-schema.md                  ← spec del formato config (contratto per nuovi tool)
└── demo/
    └── calcolatore-stipendio-netto.html       ← output statico renderizzato, apribile nel browser
```

In produzione (Next.js) la stessa idea si traduce così:

```
/app/[cluster]/[slug]/page.tsx   → legge config/tools/{slug}.json, genera <head> SEO + JSON-LD
/lib/calculators/{slug}.ts       → funzione pura di calcolo, importata dal config via "logicId"
/components/ToolEngine.tsx       → renderizza input/output dal config
/components/FaqAccordion.tsx     → renderizza faq[] dal config
/components/RelatedTools.tsx     → renderizza relatedTools[] dal config (internal linking)
```

## 3. Il file di config: il "contratto" di ogni pagina

Vedi `docs/tool-config-schema.md` per lo schema completo. In sintesi, ogni config forza a
compilare tutti i 9 blocchi del template — se manca un campo, la pagina non genera thin content
perché semplicemente non può essere pubblicata (validazione a build time).

## 4. Roadmap di esecuzione consigliata

1. **Settimana 1** — chiudere lo schema config (docs/tool-config-schema.md) + motore di rendering
   in Next.js reale (porting di tool-engine.js in componenti React/Server Components)
2. **Settimana 2-3** — MVP: 20-40 tool più cercati (stipendio netto, IMU, mutuo, password, IBAN,
   valuta) usando cluster /calcolatori /generatori /convertitori /validatori
3. **Settimana 4** — internal linking automatico da `relatedTools[]`, sitemap.xml generata dai
   config, JSON-LD per ogni tool (schema `SoftwareApplication` o `HowTo` a seconda del tipo)
4. **Da V1 in poi** — generazione varianti long-tail (es. stipendio netto per RAL specifiche) da
   template parametrico, senza duplicare contenuto (canonical + contenuto realmente differenziato)

## 5. Cosa NON fare (promemoria dalle regole fondamentali del progetto)

- Nessuna pagina pubblicata senza tutti i 9 blocchi compilati nel config
- Nessun tool senza almeno 3 `relatedTools` (internal linking non opzionale)
- Nessuna variante long-tail che sia solo find&replace di un numero senza contesto reale
