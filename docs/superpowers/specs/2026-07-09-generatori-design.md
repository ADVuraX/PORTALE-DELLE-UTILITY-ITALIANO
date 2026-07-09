# Design — Cluster Generatori (password, UUID, QR code)

Data: 2026-07-09 · Stato: approvato

## Obiettivo
Aggiungere 3 tool al cluster `generatori` riusando la pipeline SSG esistente
(`content/tools/{slug}.json` → `npm run build` → `public/{slug}/`), estendendo il
sistema — oggi calcolatore-centrico — con una **modalità generatore**.

## Perché serve un'estensione
I generatori rompono 3 assunzioni del runtime attuale:
1. **Casualità** — i calcolatori sono funzioni pure; password/UUID usano `crypto.getRandomValues`.
2. **Nessun pulsante azione** — il runtime ricalcola solo su `change`; servono "Rigenera" e "Copia".
3. **Output non numerico** — testo monospace e matrice QR, non un numero animato.

## Estensione del contratto (retrocompatibile)
Nuovi campi opzionali in `tool`:
- `kind: "generator"` → il result card usa il layout generatore (output grande + barra azioni).
- `output: { id, label, format }` con nuovo formato `"qr"` (aggiunto a `FORMATS` nel validator, accanto a `text`).
- `actions: string[]` sottoinsieme di `["regenerate","copy","download"]` → decide i pulsanti.

I calcolatori esistenti (senza `kind`) restano identici.

## Runtime (`public/assets/js/runtime.js`)
- Modalità generatore rilevata da `cfg.kind === "generator"`.
- output `text` → `textContent` monospace in `[data-out-primary]`, niente count-up.
- output `qr` → il calcolatore (puro) ritorna `{ text, level, cell, margin }`; il runtime
  chiama `window.qrcode(0, level)` per produrre SVG e lo inietta nel container.
- **Rigenera** → re-invoca `fn()` (la funzione generatore è *impura* per design).
- **Copia** → `navigator.clipboard.writeText(ultimoValore)` + feedback "Copiato ✓".
- **Download** (QR) → PNG via `createDataURL` (canvas) + SVG diretto come blob.
- `prefers-reduced-motion` e assenza di `clipboard` degradano senza rompere.

**Doctrine:** i generatori sono l'eccezione documentata alla regola "funzione pura":
la casualità è il loro scopo; restano comunque portabili 1:1 a `.ts`.

## Libreria QR
`qrcode-generator` di Kazuhiko Arase (MIT) vendorizzata in
`public/assets/js/data/qrcode.js`, caricata via `tool.data: ["qrcode.js"]`
(riuso del loader esistente). Offline, zero rete, UTF-8 abilitato dal calcolatore.

## I 3 tool
| slug | opzioni | output | actions |
|---|---|---|---|
| `generatore-password` | lunghezza 4–128, maiuscole/minuscole/numeri/simboli, escludi ambigui | password `text` + robustezza (extra) | regenerate, copy |
| `generatore-uuid` | quantità 1–100, maiuscolo, trattini, graffe | N righe `text` (UUID v4) | regenerate, copy |
| `generatore-qr-code` | testo/URL, dimensione, correzione L/M/Q/H | QR `qr` | copy, download |

Ogni tool: pacchetto SEO completo (intro 40–400w, spiegazione ≥150w, ≥2 esempi,
≥4 FAQ, 3 related, disclaimer breve). Nessun blocco `fonti` (non pertinente → solo warning).

## Home
Card per cluster invariata: `generatori` diventa `live` e lista i 3 tool senza duplicati.
Breadcrumb/titoli già rimuovono il prefisso `generatore-`.

## Ordine di implementazione
1. Vendor lib QR (fatto).
2. `runtime.js` — generator mode.
3. `template.mjs` + `validate.mjs` — kind/format qr/actions.
4. `tokens.css` — stili generatore.
5. 3× config + 3× calcolatore.
6. `npm run build` + verifica.
