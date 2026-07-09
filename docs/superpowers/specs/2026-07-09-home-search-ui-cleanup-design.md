# Design — Ricerca home, home a catalogo e pulizia UI

Data: 2026-07-09
Stato: approvato (design), in attesa di piano di implementazione.

## Obiettivo

Ripulire l'interfaccia dei tool, rendere i tool correlati più raggiungibili e
trasformare la home da "card categoria che linkano un solo tool" a un **catalogo
completo con ricerca**. Tutto resta SSG: nessun contenuto renderizzato a runtime,
i link dei tool sono sempre nell'HTML (SEO-first).

## Ambito

File toccati:

- `public/assets/css/tokens.css` — ads laterali, hover box, pulizia CSS chip/badge, stili ricerca+catalogo home.
- `scripts/lib/template.mjs` — rendering pagina tool (chip, ordine sezioni) e `renderHome`.

**Non toccati:** logica dei calcolatori (`public/assets/js/calculators/*`), config
fiscali (`public/assets/js/data/*`), contratto/validazione, config JSON dei tool.

## Modifiche

### 1. Pubblicità laterali centrate

`.ad-rail` in `tokens.css` (attualmente `position:fixed; top:120px`) → centrata
verticalmente: `top:50%; transform:translateY(-50%)`. Guard per viewport bassi:
`max-height:100vh; overflow:hidden` sul rail così il creativo 160×600 non deborda.

### 2. Rimozione hover sui box dati/risultato

Rimuovere la regola `.card-in:hover,.card-out:hover{...}` (tokens.css:133). Gli
hover sui controlli (`.control input:hover`, `select:hover`, radio) **restano** —
sono controlli, non i box contenitori.

### 3. Rimozione tag dai box

In `template.mjs`, smettere di rendere:

- `cardNote` come `.chip` nel box "I tuoi dati" (`card-top` del `card-in`).
- `cardChip` (`stima` / `pronto`) nel box "Risultato" (`card-top` del `card-out`).
- `.status-badge` "live" nelle card della home.

I campi `cardNote` restano nei JSON dei tool (innocui, non renderizzati). Il `ltag`
"in arrivo" nelle righe del ledger **resta**: è contenuto informativo, non un tag
decorativo. Le pill dell'hero (Fonti citate / Aggiornato / Gratuito) **restano**:
non sono tag "nei box".

Pulizia CSS: rimuovere le regole ora inutilizzate `.card-top .chip`,
`.card-top .chip:hover`, `.card-top .chip-soft`, `.card-top .chip-soft:hover`,
`.status-badge`.

### 4. Tool correlati più in alto

Spostare la `<section>` "Tool correlati" **subito dopo** la sezione `.tool` (il box
calcolatore), prima di spiegazione / esempi / FAQ / fonti. Solo riordino del markup
in `renderToolPage`; nessun cambio ai dati né agli stili `.related`/`.rel`.

### 5. Home a catalogo con ricerca

Riscrivere `renderHome`:

- **Barra di ricerca** sotto l'hero: `<form role="search">` con `<label>` (visivamente
  nascosta ma presente), `<input type="search">` con `aria-label` e focus visibile.
- **Per ogni categoria** (`site.clusters`, nell'ordine del config):
  - Titolo `<h2>` **non cliccabile**.
  - Se ha tool: `<ul>` con **tutti** i tool della categoria, ognuno link
    `<a href="/{slug}/">` con nome pulito (`toolName`) + attributo dati per il filtro
    (es. `data-name`).
  - Se non ha tool: titolo + nota "in arrivo", nessun elenco.
- **Filtro client-side** (script inline, zero dipendenze, coerente con lo stile del
  sito — vedi script inline di tema e ad-anchor):
  - Su input, normalizza la query (lowercase, trim) e confronta con nome tool +
    etichetta categoria.
  - Nasconde gli `<li>` che non matchano.
  - Nasconde l'intestazione+lista di una categoria se tutti i suoi tool sono nascosti
    (le categorie "in arrivo" restano visibili solo a query vuota).
  - Mostra un messaggio "Nessuno strumento trovato" quando nessun tool matcha.
  - I link restano **sempre** nel DOM (display:none, non rimossi) → nessun impatto
    SEO: i crawler vedono tutti i link.

### 6. JSON-LD ItemList nella home

Aggiungere ai blocchi JSON-LD di `renderHome` un `ItemList` con tutti i tool
(posizione + nome + URL assoluto), oltre al `WebSite` esistente. Aiuta i motori a
comprendere il catalogo.

## SEO / accessibilità

- La home passa da 1 link-per-categoria a **N link (tutti i tool)**: più link interni
  diretti dalla home, migliore crawlability. Prima molti tool erano orfani dalla home.
- Filtro solo client-side: HTML completo per i crawler.
- Ricerca accessibile: `role="search"`, label, `type="search"`, focus visibile.
- Titoli categoria come veri heading `<h2>`.

## Verifica

- `npm run build` deve completare senza errori (contratto invariato).
- `node --check` non applicabile (nessun calcolatore modificato).
- Controllo manuale dell'HTML generato: assenza dei chip/badge, ordine sezioni,
  presenza di tutti i link tool nella home, blocco JSON-LD ItemList.
- Smoke test del filtro: query nota → categorie/tool giusti mostrati/nascosti;
  query senza match → messaggio "nessun risultato".

## Fuori scope

Ricerca globale nell'header (solo home per ora), modifiche ai calcolatori o ai
config fiscali, nuove pagine categoria (gli URL restano piatti `/{slug}/`).
