# Design — Stipendio Netto v2 + motore config universale + redesign

Data: 2026-07-08 · Stato: approvato (design), in implementazione.

## Obiettivo

Tre workstream su un unico obiettivo: trasformare il portale da "AI-slop" a strumento
civico autorevole, partendo dal tool `calcolatore-stipendio-netto`.

- **A — Fiscale:** calcolo esteso e verificato (regione, tipo lavoratore, figli 21–29, altri familiari).
- **B — Config/runtime universale:** lo schema JSON deve reggere qualsiasi tool futuro.
- **C — Redesign:** direzione visiva "documento fiscale editoriale".

Decisioni prese: accuratezza massima con fonti · addizionale solo regionale (comunale esclusa) ·
perimetro privato+pubblico+apprendista · coniuge a carico **fuori** da questa versione ·
verifica MEF di tutte le 20 regioni **sì**.

## Vincoli invarianti (non rompere)

- SSG puro: `content/tools/{slug}.json` → `scripts/build.mjs` → `public/{cluster}/{slug}/`.
- Testo tutto nel markup (SEO). `runtime.js` fa solo l'interattività.
- Dati normativi versionati in `public/assets/js/data/{topic}-{anno}.js`.
- Nessun valore fiscale hardcoded nel calcolatore. Nessuna dipendenza CDN.
- Build deve passare la validazione del contratto.

## Workstream B — Config/runtime universale (prima onda)

### Problema radice
`runtime.js` coerce ogni `select` a `Number` → una select "regione" (stringa) diventa `NaN`.
`renderInputs` supporta solo number/select/text. Niente checkbox, gruppi, campi condizionali.

### Modifiche
- **Tipi input nuovi:** `checkbox` (boolean), `radio`, `select` con valori stringa.
- **Raggruppamento:** `group` (fieldset con `legend`) che contiene `inputs[]`.
- **Condizionali:** `showIf: { input, equals }` — campo/gruppo mostrato solo se un altro input ha un valore.
- **runtime `readValues`:** legge per tipo — number→Number, checkbox→boolean, text/select/radio→string.
  Campi nascosti da `showIf` esclusi. I calcolatori coercono i numeri da soli (già fanno così).
- **`renderInputs`:** gestisce i nuovi tipi + fieldset + attributo `data-showif` per il toggle runtime.
- **`validate.mjs`:** ammette i nuovi tipi; `showIf.input` deve esistere; gruppi validati ricorsivamente;
  vecchi config restano validi.
- **Doc:** `docs/tool-config-schema.md` con un esempio per ogni tipo nuovo.

### Criterio di isolamento
Il runtime resta agnostico al dominio: conosce solo tipi di input/output, mai la fiscalità.
Retrocompatibilità verificata: il tool live continua a calcolare identico prima del workstream A.

## Workstream A — Motore fiscale (seconda onda)

### Input nuovi (config)
Raggruppati in fieldset: **Contratto** (`tipoLavoratore` radio: privato|pubblico|apprendista;
`ral`; `mensilita`), **Famiglia** (`figliACarico2129` number "figli a carico 21–29 anni";
`altriFamiliari` number "ascendenti conviventi a carico"), **Territorio** (`regione` select 20 voci).

### `fisco-2026.js` esteso
- `inps`: aliquote per tipo (privato 9,19% · pubblico 8,80% · apprendista 5,84%), +1% oltre 56.224 €.
- `addizionaleRegionale`: mappa regione → {tipo fissa|scaglioni, valori, fonte, affidabilità}.
  Valori dalla verifica MEF (agente dedicato); flag di affidabilità per regione.
- `detrazioniFigli`: teorica 950, denom 95.000 (+15.000/figlio oltre il primo), magg. +400/+200.
- `detrazioniAltriFamiliari`: 750, tetto reddito 80.000.

### Calcolo (funzione pura, ordine da brief §10)
INPS(tipo) → imponibile → IRPEF lorda → detrazioni (lavoro + figli + familiari, capienti) →
cuneo (bonus + detrazione) → trattamento integrativo → addizionale regionale → netto.
Base reddito per detrazioni ≈ imponibile (semplificazione dichiarata nel disclaimer).

### Ledger (config breakdown)
Aggiunge righe: addizionale regionale (valore reale, non più provisional), detrazioni figli/familiari
riflesse nell'IRPEF netta. Extra: aliquota effettiva.

### Verifica
Smoke test Node su ≥3 scenari + i 3 esempi del config, confrontati con un calcolatore pubblico.
Le 20 regioni verificate su portale MEF prima di codificare i valori.

## Workstream C — Redesign "documento fiscale editoriale" (terza onda)

Il tool deve leggersi come un estratto/certificato ufficiale, non un widget generico.
- Font display serif self-hosted per titoli + **numeri tabulari monospaziati** nel ledger.
- Palette ristretta, un solo accento forte; griglia netta; ledger protagonista.
- Dark/light, contrasto AA, mobile-first, zero CDN.
- Riscrittura `tokens.css` + sezioni `template.mjs` (hero, card con gruppi, ledger, prose, faq, fonti).

## Sequenza e gate

1. B → build verde, tool live intatto (verifica: netto identico a prima).
2. A → verifica MEF → dati → calcolatore → config → smoke test.
3. C → redesign su struttura funzionante.
4. Fine sessione: aggiorno `MEMORY.md` + file di memoria (stato, decisioni, prossimi passi).

## Fuori scope (YAGNI)

- Coniuge a carico (formula complessa, rimandata).
- Addizionale comunale (dataset comuni).
- Dipendente pubblico con gestioni speciali oltre la quota standard.
- Migrazione Next.js.
