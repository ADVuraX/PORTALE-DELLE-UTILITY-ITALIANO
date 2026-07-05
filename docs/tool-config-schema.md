# Schema del Tool Config (contratto per ogni nuova pagina)

Ogni tool nasce da UN file `public/config/tools/{slug}.json`. I campi non sono opzionali: il
motore di rendering deve rifiutare la build se manca un blocco richiesto dal template.

```jsonc
{
  "slug": "calcolatore-stipendio-netto",
  "cluster": "calcolatori",
  "tema": "lavoro",
  "seo": { "title": "...", "metaDescription": "...", "primaryKeyword": "...", "canonical": "/calcolatori/{slug}/" },
  "intro": "40-400 parole, above the fold",
  "tool": { "logicId": "...", "inputs": [...], "outputPrimary": {...}, "outputSecondary": [...] },
  "spiegazione": { "titolo": "...", "corpo": "min 150 parole" },
  "esempi": [ { "titolo": "...", "risultatoAtteso": "..." } ],
  "faq": [ { "domanda": "...", "risposta": "..." } ],
  "relatedTools": ["slug-1", "slug-2", "slug-3"],
  "guida": { "titolo": "...", "corpo": "..." },
  "jsonLd": { "type": "SoftwareApplication", "applicationCategory": "FinanceApplication" }
}
```

## Regole di validazione

1. `seo.title`, `seo.metaDescription`, `seo.primaryKeyword` obbligatori, no duplicati nel sito
2. `intro` minimo 40 parole, massimo 400
3. `tool.inputs` minimo 1, `tool.outputPrimary` obbligatorio
4. `spiegazione.corpo` minimo 150 parole (anti thin-content)
5. `esempi` minimo 2 elementi
6. `faq` minimo 4 elementi, ogni domanda con variante long-tail della keyword
7. `relatedTools` minimo 3 slug esistenti (no 404 interni)

## Convenzione URL (obbligatoria)

Ogni tool vive in `public/{cluster}/{slug}/index.html`, servito come `/{cluster}/{slug}/`.
Non usare cartelle generiche come `/demo/`: l'URL di produzione è la fonte di verità per SEO
e internal linking fin dal primo commit.
