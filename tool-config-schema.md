# Schema del Tool Config (contratto per ogni nuova pagina)

Ogni tool del portale nasce da UN file `config/tools/{slug}.json`. I campi non sono opzionali:
il motore di rendering deve rifiutare la build se manca un blocco richiesto dal template
(vedi `templates/tool-page.template.html`, sezione "9 blocchi obbligatori").

```jsonc
{
  "slug": "calcolatore-stipendio-netto",
  "cluster": "calcolatori",                    // calcolatori | generatori | convertitori | validatori | ai-tools
  "tema": "lavoro",                             // usato per cluster tematici interni (lavoro, casa, tasse, famiglia)

  // BLOCCO 1 — SEO
  "seo": {
    "title": "Calcolatore Stipendio Netto 2026 – da Lordo a Netto",
    "metaDescription": "Calcola il tuo stipendio netto mensile e annuo partendo dalla RAL. Aggiornato con aliquote IRPEF 2026. Gratuito, immediato, nessuna registrazione.",
    "primaryKeyword": "calcolatore stipendio netto",
    "canonical": "/calcolatori/calcolatore-stipendio-netto/"
  },

  // BLOCCO 2 — introduzione breve (2-4 frasi, above the fold, sopra o accanto al tool)
  "intro": "Testo breve: cos'è, a cosa serve, perché usarlo.",

  // BLOCCO 3 — tool interattivo (core value, above the fold su mobile)
  "tool": {
    "logicId": "stipendio-netto-v1",            // punta alla funzione di calcolo in /lib/calculators
    "inputs": [
      { "id": "ral", "label": "RAL annua (€)", "type": "number", "min": 0, "step": 100, "default": 30000 },
      { "id": "mensilita", "label": "Numero di mensilità", "type": "select", "options": [12, 13, 14], "default": 13 },
      { "id": "regione", "label": "Regione", "type": "select", "optionsSource": "regioni-italia" },
      { "id": "figliACarico", "label": "Figli a carico", "type": "number", "min": 0, "default": 0 }
    ],
    "outputPrimary": { "id": "nettoMensile", "label": "Netto mensile stimato", "format": "currency" },
    "outputSecondary": [
      { "id": "nettoAnnuo", "label": "Netto annuo", "format": "currency" },
      { "id": "irpefTotale", "label": "IRPEF versata", "format": "currency" },
      { "id": "aliquotaEffettiva", "label": "Aliquota effettiva", "format": "percent" }
    ]
  },

  // BLOCCO 4 — risultato immediato: gestito automaticamente dal motore (outputPrimary in evidenza)

  // BLOCCO 5 — spiegazione del calcolo/logica
  "spiegazione": {
    "titolo": "Come si calcola lo stipendio netto",
    "corpo": "Testo esteso con formula, scaglioni IRPEF, detrazioni..."
  },

  // BLOCCO 6 — esempi pratici (minimo 2, con numeri reali)
  "esempi": [
    { "titolo": "RAL 30.000€, 13 mensilità, no figli", "risultatoAtteso": "≈ 1.750€/mese" },
    { "titolo": "RAL 45.000€, 14 mensilità, 1 figlio", "risultatoAtteso": "≈ 2.380€/mese" }
  ],

  // BLOCCO 7 — FAQ long-tail (minimo 4, keyword-driven)
  "faq": [
    { "domanda": "Come si calcola lo stipendio netto da 30000 euro lordi?", "risposta": "..." },
    { "domanda": "Quali detrazioni riducono l'IRPEF sul lavoro dipendente?", "risposta": "..." }
  ],

  // BLOCCO 8 — tool correlati (internal linking, minimo 3)
  "relatedTools": [
    "calcolatore-tfr",
    "calcolatore-irpef",
    "calcolatore-tredicesima"
  ],

  // BLOCCO 9 — guida approfondita (opzionale ma raccomandato)
  "guida": {
    "titolo": "Guida completa alla busta paga italiana",
    "corpo": "Testo lungo-form opzionale, linkabile separatamente da /guide/"
  },

  // Schema.org — generato automaticamente dal motore in base a "cluster" + "tool.logicId"
  "jsonLd": {
    "type": "SoftwareApplication",
    "applicationCategory": "FinanceApplication"
  }
}
```

## Regole di validazione (da applicare a build time)

1. `seo.title`, `seo.metaDescription`, `seo.primaryKeyword` obbligatori, no duplicati nel sito
2. `intro` minimo 40 parole, massimo 400 (above the fold, non deve diventare un muro di testo)
3. `tool.inputs` minimo 1, `tool.outputPrimary` obbligatorio
4. `spiegazione.corpo` minimo 150 parole (anti thin-content)
5. `esempi` minimo 2 elementi
6. `faq` minimo 4 elementi, ogni domanda deve contenere una variante long-tail della keyword
7. `relatedTools` minimo 3 slug esistenti (linking interno verificato a build time, no 404 interni)
