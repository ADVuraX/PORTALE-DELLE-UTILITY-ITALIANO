# Contesto progetto

## Sorgente corretta

Apri in VS Code questa cartella:

`C:\Users\PC\Desktop\PORTALE DELLE UTILITY ITALIANO\portale-utility-italiano`

Questa e la root reale del repository Git. La cartella esterna `PORTALE DELLE UTILITY ITALIANO` contiene copie di alcuni file, ma non contiene `public/` e non va usata come root per VS Code, GitHub o Cloudflare.

## Stato attuale

- Repository Git attivo: `portale-utility-italiano`
- Branch: `main`
- Remote: `https://github.com/ADVuraX/PORTALE-DELLE-UTILITY-ITALIANO`
- Deploy target dichiarato: Cloudflare Workers con static assets
- Config Cloudflare: `wrangler.toml`
- Directory servita: `public/`
- Tool live: `calcolatore-stipendio-netto`

## Struttura importante

```text
portale-utility-italiano/
  wrangler.toml
  package.json
  README.md
  PROJECT_CONTEXT.md
  docs/
    tool-config-schema.md
  templates/
    tool-page.template.html
  public/
    index.html
    robots.txt
    _headers
    assets/
      css/tokens.css
      js/tool-engine.js
      js/calculators/stipendio-netto.js
    config/tools/calcolatore-stipendio-netto.json
    calcolatori/calcolatore-stipendio-netto/index.html
```

## Verifiche eseguite

- `node --check public/assets/js/tool-engine.js`: OK
- `node --check public/assets/js/calculators/stipendio-netto.js`: OK
- JSON config del tool: OK
- Homepage locale: caricata correttamente
- Pagina calcolatore locale: caricata correttamente
- Calcolo interattivo: funzionante
- Console browser: nessun errore o warning rilevante
- `npx wrangler deploy --dry-run` dalla root corretta: OK, legge 16 file da `public/`

## Errore principale trovato

Se lanci Cloudflare, Wrangler o Git dalla cartella esterna:

`C:\Users\PC\Desktop\PORTALE DELLE UTILITY ITALIANO`

Wrangler fallisce perche cerca:

`C:\Users\PC\Desktop\PORTALE DELLE UTILITY ITALIANO\public`

ma quella cartella non esiste.

La root corretta e:

`C:\Users\PC\Desktop\PORTALE DELLE UTILITY ITALIANO\portale-utility-italiano`

## Impostazioni Cloudflare consigliate

Se usi Cloudflare collegato a GitHub:

- Repository: `ADVuraX/PORTALE-DELLE-UTILITY-ITALIANO`
- Root directory: vuota solo se GitHub contiene direttamente `wrangler.toml` e `public/`
- Root directory: `portale-utility-italiano` solo se su GitHub carichi anche la cartella esterna
- Build command: vuoto oppure `npm install`
- Deploy command da CLI: `npm run deploy`
- Output directory per Pages statico: `public`

Per questo progetto, la via piu coerente con i file attuali e usare Cloudflare Workers static assets tramite `wrangler.toml`.

## Problemi non bloccanti ma da sistemare

- I link dei tool correlati puntano a pagine non ancora esistenti:
  - `/calcolatori/calcolatore-irpef/`
  - `/calcolatori/calcolatore-tfr/`
  - `/calcolatori/calcolatore-tredicesima/`
  - `/calcolatori/calcolatore-partita-iva-forfettario/`
- Il config richiede `relatedTools` esistenti, quindi al momento questa regola e violata.
- Gli esempi testuali non sono perfettamente allineati con il risultato calcolato dal codice.
- Non esiste `package-lock.json`; prima del deploy stabile conviene fare `npm install` dalla root corretta e committare il lockfile.

## Workflow consigliato

1. Apri VS Code sulla cartella `portale-utility-italiano`.
2. Esegui `npm install`.
3. Controlla `git status`.
4. Avvia preview locale con `npm run dev` oppure con un server statico da `public/`.
5. Verifica homepage e tool.
6. Fai commit e push.
7. Su Cloudflare controlla che la root punti alla cartella che contiene `wrangler.toml` e `public/`.

## Regola per nuovi tool

Ogni nuovo tool deve avere:

- una pagina reale in `public/{cluster}/{slug}/index.html`
- un config in `public/config/tools/{slug}.json`
- eventuale logica JS in `public/assets/js/calculators/`
- link interni solo verso pagine gia esistenti o create nello stesso commit

