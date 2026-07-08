# Schema del Tool Config (contratto per ogni nuova pagina)

Ogni tool nasce da **UN** file `content/tools/{slug}.json` — unica fonte di verità. Il
generatore (`scripts/build.mjs`, comando `npm run build`) legge questi file, **valida** il
contratto e genera l'HTML statico in `public/{cluster}/{slug}/index.html` + la `sitemap.xml`.
Nessun contenuto è renderizzato a runtime nel browser: tutto il testo finisce nel markup per il
SEO. La build **fallisce** se un blocco richiesto manca o è sotto-standard.

```jsonc
{
  "slug": "calcolatore-stipendio-netto",
  "cluster": "calcolatori",              // calcolatori | generatori | convertitori | validatori
  "tema": "lavoro",                       // eyebrow visibile
  "updated": "2026-01",

  "seo": {
    "title": "...",                       // unico nel sito
    "metaDescription": "...",
    "primaryKeyword": "...",              // unica nel sito
    "canonical": "/{cluster}/{slug}/"     // deve combaciare con cluster+slug
  },

  "h1": "...",                            // titolo visibile della pagina (H1)
  "intro": "40-400 parole, above the fold",

  "tool": {
    "logicId": "stipendio-netto-v1",      // combacia con registerCalculator(...)
    "script": "stipendio-netto.js",       // file in public/assets/js/calculators/ (deve esistere)
    "cardNote": "Aggiornato 2026",        // opzionale, angolo scheda
    "inputs": [
      { "id": "ral", "label": "...", "type": "number", "min": 0, "step": 500, "default": 30000, "suffix": "€/anno" },
      { "id": "mensilita", "label": "...", "type": "select", "options": [12,13,14], "default": 13 },
      { "id": "tipoLavoratore", "label": "...", "type": "radio", "options": ["privato","pubblico"], "optionLabels": {"privato":"Privato","pubblico":"Pubblico"}, "default": "privato" },
      { "id": "regione", "label": "...", "type": "select", "options": ["lombardia","lazio"], "optionLabels": {"lombardia":"Lombardia","lazio":"Lazio"}, "default": "lombardia" },
      { "id": "conDettagli", "label": "Mostra dettagli", "type": "checkbox", "default": false },
      { "id": "note", "label": "...", "type": "text", "showIf": { "input": "conDettagli", "equals": true } },
      { "type": "group", "legend": "Famiglia", "inputs": [
          { "id": "figli", "label": "Figli a carico", "type": "number", "min": 0, "default": 0 }
      ] }
      // type: number | select | text | radio | checkbox | group
      // select/radio: opzioni STRINGA o numero; optionLabels mappa valore→etichetta.
      // showIf: { input, equals } → campo/gruppo visibile solo se quell'input vale `equals`.
      //   Un campo nascosto è ESCLUSO dal calcolo (non passato al calcolatore).
      // VALORI PASSATI AL CALCOLATORE: number→Number, checkbox→boolean, altri→stringa.
      //   (il calcolatore coerce da sé i numeri che arrivano come stringa, es. da un select)
    ],
    "outputPrimary": { "id": "...", "label": "...", "format": "currency" },
    "outputSecondary": [ { "id": "...", "label": "...", "format": "currency" } ]
    // format: currency | percent | number | text
  },

  "spiegazione": { "titolo": "...", "corpo": "min 150 parole" },
  "esempi": [ { "titolo": "...", "risultatoAtteso": "..." } ],   // min 2
  "faq": [ { "domanda": "...", "risposta": "..." } ],            // min 4
  "relatedTools": ["slug-1", "slug-2", "slug-3"],               // min 3
  "jsonLd": { "type": "SoftwareApplication", "applicationCategory": "FinanceApplication" }
}
```

## Regole di validazione (la build fallisce se violate)

1. `seo.title` e `seo.primaryKeyword` obbligatori e **unici** nel sito
2. `seo.canonical` deve essere esattamente `/{cluster}/{slug}/`
3. `h1` obbligatorio
4. `intro` tra 40 e 400 parole
5. `tool.inputs` ≥ 1; ogni input foglia con `id`, `label`, `type` valido (`number|select|text|radio|checkbox`); `select`/`radio` con `options`; i `group` con `inputs` non vuoto (validati ricorsivamente); ogni `showIf.input` deve puntare a un input esistente
6. `tool.outputPrimary` obbligatorio; ogni `format` in currency|percent|number|text
7. `tool.script` deve puntare a un file esistente in `public/assets/js/calculators/`
8. `spiegazione.corpo` ≥ 150 parole (anti thin-content)
9. `esempi` ≥ 2, `faq` ≥ 4
10. `relatedTools` ≥ 3

## Warning (non bloccanti)

- `relatedTools` che punta a un tool **non ancora costruito**: reso come card disabilitata
  (nessun link, nessun 404). Diventa link automaticamente quando quel tool viene creato.

## Il calcolatore

`public/assets/js/calculators/{script}` definisce una **funzione pura** `({input}) => {output}` e si
registra con `registerCalculator("{logicId}", fn)`. Il `runtime.js` la collega al form. La funzione
è portabile 1:1 a `.ts` per una futura migrazione a Next.js.

## Convenzione URL (obbligatoria)

Ogni tool vive a `/{cluster}/{slug}/`. La struttura del repo generato **È** la struttura del sito.
