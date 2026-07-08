# Brief di ricerca — Stipendio Netto (anno d'imposta 2026)

> Fonte di verità per i valori codificati in `public/assets/js/data/fisco-2026.js`.
> Convenzione progetto: **prima le fonti, poi il codice**. Ogni valore qui ha una fonte.
>
> **Aggiornamento sessione 2026-07-08:** riscritto per la v2 del tool (regione, tipo lavoratore,
> figli 21–29, altri familiari). Supera la precedente decisione "Opzione A" (che rimuoveva del
> tutto i figli): ora la detrazione figli **21–29 anni** rientra, mentre i figli **under 21**
> restano fuori (coperti dall'Assegno Unico). Voci marcate `⚠ DA VERIFICARE MEF` non ancora
> confrontate col portale ufficiale del Dipartimento Finanze.

## 1. Contributi INPS a carico del lavoratore

| Tipo lavoratore | Aliquota IVS lavoratore | Note |
|---|---|---|
| Dipendente privato (FPLD) | **9,19%** | +1% sulla quota oltre la soglia (art. 3-ter L. 438/92) |
| Dipendente pubblico | **8,80%** | quota lavoratore standard (range reale 8,80–9,15%); +1% oltre soglia |
| Apprendista | **5,84%** | per l'intera durata del contratto + 12 mesi dopo la qualifica |

- Soglia aliquota aggiuntiva (+1%) 2026: **56.224 €** (massimale I fascia); +1% sulla quota eccedente.
- Imponibile previdenziale ≈ RAL (semplificazione: nessun dettaglio minimali/massimali per fasce).

Fonti:
- Contributi INPS busta paga 2026 — https://centrofiscale.com/contributi-inps-busta-paga-2026/
- Apprendistato 5,84% — https://stipendionettocalcolatore.it/stipendio-netto-apprendistato-2026/
- Dipendenti pubblici — https://www.inps.it/it/it/dettaglio-approfondimento.schede-informative.49902.i-contributi-dei-dipendenti-pubblici.html

## 2. IRPEF 2026 (Legge di Bilancio 2026, L. 199/2025)

| Scaglione | Aliquota |
|---|---|
| fino a 28.000 € | 23% |
| 28.000 – 50.000 € | **33%** (ridotto dal 35%) |
| oltre 50.000 € | 43% |

Fonte: Agenzia Entrate — https://www.agenziaentrate.gov.it/portale/imposta-sul-reddito-delle-persone-fisiche-irpef-/aliquote-e-calcolo-dell-irpef

## 3. Detrazione per lavoro dipendente (art. 13 TUIR)

Invariata: max 1.955 € (≤15.000), decrescente; maggiorazione +65 tra 25.001–28.000; azzera a 50.000.
Fonte: https://fiscomania.com/detrazioni-per-redditi-da-lavoro-dipendente/

## 4. Detrazioni per figli a carico (art. 12 TUIR, riforma L. 207/2024)

**Post-Assegno Unico:** detrazione IRPEF solo per figli di età **21–29 anni** (≥21 e <30 al 31/12).
Figli **under 21** → Assegno Unico Universale INPS, **nessuna detrazione IRPEF**. Abolita per figli
≥30 anni (salvo disabili).

- Detrazione teorica: **950 € per figlio**.
- Formula: `950 × (denominatore − reddito) / denominatore`, azzerata se ≤ 0.
- Denominatore base **95.000 €**, **+15.000 € per ogni figlio oltre il primo**.
- Maggiorazioni: +400 € per figlio disabile; +200 € per figlio se più di 3 figli.
- "A carico": reddito figlio ≤ 2.840,51 € (≤ 4.000 € se ≤ 24 anni).

> **UX critica:** etichettare il campo "figli a carico di **età 21–29 anni**", altrimenti l'utente
> inserisce figli piccoli aspettandosi un effetto che (correttamente) non c'è.

Fonti:
- https://fiscomania.com/detrazione-figli-a-carico-come-cambiano/
- https://quifinanza.it/fisco-tasse/detrazioni-figli-carico-2026/962274/
- https://www.idealista.it/news/finanza/fisco/2026/04/29/360658-detrazioni-figli-a-carico-2026-calcolo-limiti-e-regole

## 5. Detrazione per altri familiari a carico (art. 12 TUIR)

- Solo **ascendenti** (genitori/nonni) **conviventi** col contribuente.
- Teorica **750 €**, spettante solo se reddito dichiarante ≤ **80.000 €**.
- Formula: `750 × (80.000 − reddito) / 80.000`, azzerata se ≤ 0.
- "A carico": reddito familiare ≤ 2.840,51 €.

Fonti:
- https://fiscomania.com/familiari-a-carico-limiti-detrazione/
- https://www.ticonsiglio.com/detrazioni-familiari-a-carico-2026/

## 5-bis. Coniuge a carico (art. 12 c.1 lett. a) — ⚪ OPZIONALE, da verificare

Detrazione base 800 € con formula a tre fasce di reddito (quirk maggiorazioni 29.000–35.200 €).
**Non incluso nella v2** salvo richiesta: formula complessa, non verificata questa sessione.
Se richiesto → brief dedicato prima di codificare.

## 6. Taglio del cuneo fiscale 2026 (strutturale, L. 199/2025)

Invariato: bonus esente % per redditi ≤ 20.000 (7,1/5,3/4,8%) + ulteriore detrazione fino a 1.000 €
per 20.000–40.000 €. Fonte: https://www.ticonsiglio.com/taglio-cuneo-fiscale-2026/

## 7. Trattamento integrativo (ex Bonus Renzi)

Invariato: fino a 1.200 € per redditi ≤ 15.000 € con capienza (imposta lorda > detrazione lavoro).
Fonte: https://fiscomania.com/trattamento-integrativo-come-funziona/

## 8. Addizionale regionale IRPEF 2026 — verifica MEF eseguita (2026-07-08)

Base = reddito imponibile. **Applicazione a scaglioni = progressiva per fascia** (come IRPEF:
ogni aliquota sulla porzione di reddito nella fascia). Aliquota base di legge 1,23%.

**Esito verifica portale ufficiale MEF** (`addregirpef.php?reg={1..21}`, il parametro anno è
ignorato → mostra sempre l'anno più recente): **12 regioni con delibera 2026 pubblicata**
(codici 10–21, da Lombardia a Veneto in ordine alfabetico); **9 regioni senza pubblicazione 2026
a oggi** (Abruzzo→Liguria). Per queste ultime uso valori da fonti secondarie con flag
`provvisoria` + nota dinamica nel tool ("dati regionali 2026 non ancora pubblicati").

### Verificate MEF 2026 (ufficiali)

| Regione | Tipo | Valori (fino→aliquota %) |
|---|---|---|
| Lombardia | scaglioni | 15k 1,23 · 28k 1,58 · 50k 1,72 · oltre 1,73 |
| Marche | scaglioni | 15k 1,23 · 28k 1,53 · 50k 1,70 · oltre 1,73 |
| Molise | scaglioni | 15k 2,03 · 28k 2,23 · 50k 3,63 · oltre 3,63 |
| Piemonte | scaglioni | 15k 1,62 · 28k 2,68 · 50k 3,31 · oltre 3,33 |
| Puglia | scaglioni | 15k 1,33 · 28k 2,13 · 50k 3,23 · oltre 3,33 |
| Sardegna | fissa | 1,23 |
| Sicilia | fissa | 1,23 |
| Toscana | scaglioni | 15k 1,42 · 28k 1,43 · 50k 3,32 · oltre 3,33 |
| Trento (P.A.) | scaglioni | ≤50k 1,23 · oltre 1,73 (deduzione 30k ≈ esente ≤30k) |
| Umbria | scaglioni | ≤28k 1,23 · 50k 3,12 · oltre 3,33 (⚠ nota MEF ambigua) |
| Valle d'Aosta | fissa | 1,23 (esente reddito ≤15k) |
| Veneto | fissa | 1,23 |

### Provvisorie (MEF 2026 non pubblicato → fonti secondarie, `affidabilita: "provvisoria"`)

| Regione | Tipo | Valori (fino→aliquota %) |
|---|---|---|
| Abruzzo | fissa | 1,73 |
| Basilicata | fissa | 1,23 |
| Bolzano (P.A.) | fissa | 1,23 |
| Calabria | fissa | 2,03 |
| Campania | scaglioni | 15k 2,03 · 28k 2,13 · 50k 2,33 · oltre 3,33 |
| Emilia-Romagna | scaglioni | 15k 1,33 · 28k 1,93 · 50k 2,03 · oltre 2,33 |
| Friuli-VG | scaglioni | ≤15k 0,70 · oltre 1,23 |
| Lazio | scaglioni | 15k 1,73 · 28k 2,73 · 50k 2,93 · oltre 3,33 |
| Liguria | scaglioni | 15k 1,23 · 28k 1,81 · 50k 2,31 · oltre 2,33 |

Fonti:
- Portale ufficiale MEF (per regione) — https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/sceltaregione.htm
- Secondarie (regioni provvisorie): https://centrofiscale.com/addizionali-regionali-comunali-irpef-2026/ · https://www.money.it/addizionali-comunali-regionali-2026-cosa-sono-come-si-calcolano

> **Da rifare:** ricontrollare le 9 regioni provvisorie sul portale MEF tra qualche settimana
> (le delibere 2026 vengono pubblicate progressivamente). Umbria: risolvere l'ambiguità della nota MEF.

## 9. Addizionale comunale — ESCLUSA

Non calcolata (migliaia di comuni). Dichiararlo nel disclaimer del tool.

## 10. Ordine di calcolo (definizione operativa)

1. Contributi INPS (per tipo lavoratore) → imponibile = RAL − INPS.
2. IRPEF lorda a scaglioni sull'imponibile.
3. Detrazioni totali = detrazione lavoro (art.13) + figli 21–29 + altri familiari.
   Base reddito per le detrazioni ≈ imponibile (semplificazione dichiarata).
4. IRPEF netta = max(0, IRPEF lorda − detrazioni totali − detrazione cuneo parte B).
   Detrazioni familiari **capienti**: non generano credito.
5. Cuneo parte A (bonus esente ≤20k) e trattamento integrativo: si sommano al netto.
   Capienza TI valutata (per norma) contro la sola detrazione lavoro dipendente.
6. Addizionale regionale sull'imponibile (fissa o scaglioni).
7. Netto annuo = imponibile − IRPEF netta − addizionale regionale + cuneo bonus + trattamento integrativo.
8. Netto mensile = netto annuo / mensilità.
