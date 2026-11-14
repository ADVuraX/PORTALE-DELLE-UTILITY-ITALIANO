# Aggiornamento di gennaio 2027 — testi unici e anno d'imposta 2027

> Preparato il 14/11/2026. Corrispondenze lette su Normattiva nelle intestazioni
> degli articoli dei testi unici (ogni articolo indica fra parentesi le norme da
> cui deriva). Da completare con la legge di bilancio 2027, non ancora pubblicata.

## Da quando cambia

| Testo unico | Si applica dal | Fonte |
|---|---|---|
| IVA — D.Lgs. 19 gennaio 2026, n. 10 | 1° gennaio 2027 | art. 171 |
| Imposte sui redditi — D.Lgs. 19 giugno 2026, n. 117 | 1° gennaio 2027 | art. 377; abrogazioni art. 376 |
| Versamenti e riscossione — D.Lgs. 24 marzo 2025, n. 33 | 1° gennaio 2027 (data modificata dal D.L. 31/12/2025, n. 20) | art. 243 |

Fino al 31/12/2026 le norme citate dal sito restano quelle applicabili all'anno
d'imposta 2026; su Normattiva la vista «vigente» le mostra già abrogate, per questo
i link sono datati (`!vig=2026-01-30`) e `qualita.mjs` blocca quelli senza data.

## Corrispondenze per le norme citate dal sito

| Norma citata oggi | Nuovo articolo | Pagine che la citano |
|---|---|---|
| TUIR art. 11 (scaglioni) | D.Lgs. 117/2026 art. 11 | IRPEF, tredicesima, stipendio netto |
| TUIR art. 12 (familiari a carico) | D.Lgs. 117/2026 art. 12 | stipendio netto |
| TUIR art. 13 + L. 207/2024 c. 6 (ulteriore detrazione) | D.Lgs. 117/2026 art. 13 (le due norme confluiscono) | IRPEF, stipendio netto |
| TUIR art. 17 (tassazione separata) | D.Lgs. 117/2026 art. 19 | TFR |
| TUIR art. 19 (indennità di fine rapporto) | D.Lgs. 117/2026 art. 21 | TFR |
| TUIR art. 49 (redditi di lavoro dipendente) | D.Lgs. 117/2026 art. 51 | (testi) |
| TUIR art. 51 (determinazione del reddito di lavoro dipendente) | D.Lgs. 117/2026 art. 53 | (testi) |
| L. 190/2014 c. 54–56 (requisiti forfettario) | D.Lgs. 117/2026 art. 232 | forfettario |
| L. 190/2014 c. 57 (esclusioni) | art. 233 | forfettario |
| L. 190/2014 c. 58–63 (IVA nel forfettario) | art. 234 | forfettario, scorporo IVA |
| L. 190/2014 c. 64–68 (reddito e imposta sostitutiva) | art. 235 | forfettario |
| L. 190/2014 c. 71–72 (cessazione) | art. 238 | forfettario |
| L. 190/2014 c. 76–84 (contributi) | art. 241 | forfettario |
| DPR 633/1972 art. 16 (aliquote IVA) | D.Lgs. 10/2026 art. 34 (tabella A parti II, III, IV) | scorporo IVA |
| DPR 633/1972 art. 21 (fatturazione) | D.Lgs. 10/2026 art. 72 | scorporo IVA |
| DPR 633/1972 art. 35 (partita IVA) | D.Lgs. 10/2026 art. 68 | validatore partita IVA |
| DPR 600/1973 art. 23 (ritenute lavoro dipendente) | D.Lgs. 33/2025 art. 33 (stesso testo per le mensilità aggiuntive) | tredicesima |

Da verificare a gennaio: dove confluiscono L. 207/2024 c. 4 (somma esente del
cuneo), il trattamento integrativo (D.L. 3/2020) e l'addizionale regionale
(D.Lgs. 446/1997 art. 50, oggi non indicato come abrogato).

## Lista dei lavori (gennaio 2027)

1. Leggere la legge di bilancio 2027 in Gazzetta: scaglioni, detrazioni, cuneo,
   forfettario, eventuali novità su tredicesima e trattamento integrativo.
2. Creare `public/assets/js/data/fisco-2027.js` (e `forfettario-2027.js`, `tfr-2027.js`
   con il coefficiente ISTAT di dicembre 2026) e far leggere ai calcolatori l'anno 2027.
3. Aliquote INPS 2027 (circolare INPS di inizio anno: prima fascia, massimali).
4. Addizionali regionali 2027: escono fra gennaio e giugno, controllo mensile sul portale MEF.
5. Sostituire nelle pagine le citazioni con la tabella qui sopra e i link Normattiva ai
   nuovi testi unici; aggiornare `ABROGATI_2027` in `qualita.mjs` (a quel punto i link
   ai vecchi atti vanno rimossi, non solo datati).
6. Rifare la verifica completa (`npm test`, riferimenti indipendenti, esempi) e i registri.
