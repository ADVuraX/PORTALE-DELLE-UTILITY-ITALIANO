# Registro fiscale — verifica ottobre 2026

Ogni valore usato dai calcolatori fiscali, con le fonti che lo confermano.
Legenda stato: **V** verificato (≥1 primaria + ≥1 conferma) · **I** ipotesi del
modello, dichiarata in pagina · **C** corretto in questa verifica.

Fonti primarie consultate (sigle usate sotto):

- **GU-199**: L. 30/12/2025 n. 199, GU n. 301 del 30/12/2025 — [Normattiva](https://www.normattiva.it/eli/id/2025/12/30/25G00212/ORIGINAL)
- **AdE-4E**: Agenzia Entrate, circolare 4/E del 16/05/2025 (L. 207/2024 e D.Lgs. 192/2024) — [PDF](https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91)
- **AdE-2E-24**: Agenzia Entrate, circolare 2/E del 06/02/2024 — [PDF](https://www.agenziaentrate.gov.it/portale/documents/20143/5866239/Circolare_n_2_del_06_02_2024.pdf/4ec75f44-b2c0-3af7-a45a-2d971d6f3c19)
- **730-26**: Istruzioni Modello 730/2026, agg. 28/05/2026, tabelle 4–6 — [PDF](https://www.agenziaentrate.gov.it/portale/documents/20143/9764684/730_2026_istruzioni_+agg+28+05+2026.pdf/0965387c-8738-287a-9378-1d038b997833)
- **AdE-IRPEF**: scheda "Aliquote e calcolo dell'IRPEF" — [AdE](https://www.agenziaentrate.gov.it/portale/imposta-sul-reddito-delle-persone-fisiche-irpef-/aliquote-e-calcolo-dell-irpef)
- **INPS-6**: circolare INPS n. 6 del 30/01/2026 (minimali, massimali, 1ª fascia)
- **INPS-8**: circolare INPS n. 8 del 03/02/2026 (Gestione separata 2026)
- **INPS-14**: circolare INPS n. 14 del 09/02/2026 (artigiani e commercianti 2026)
- **MEF-ADD**: Dipartimento Finanze, addizionale regionale IRPEF, pagina per regione — [MEF](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/sceltaregione.htm)
- **DLgs-446**: D.Lgs. 446/1997 art. 50 (testo pubblicato dalle Regioni Toscana e FVG)
- **ISTAT-TFR**: nota ISTAT del 16/01/2026, coefficiente TFR dicembre 2025
- **AdE-TFR**: AdE, scheda "F24 imposta sostitutiva Tfr"; art. 19 TUIR (testo in GU)
- **COVIP**: "Disciplina delle prestazioni" e FAQ sul trattamento fiscale

## Stipendio netto (`fisco-2026.js`)

| ID | Valore | Fonti | Stato |
|---|---|---|---|
| F01 | Scaglioni IRPEF 2026: 23% fino a 28.000 · **33%** 28.000–50.000 · 43% oltre | GU-199 art. 1 c. 3; AdE-IRPEF; circ. RGS 4/2026 | V |
| F02 | Detrazione lavoro dipendente: 1.955 fino a 15.000; 1.910 + 1.190 × (28.000 − R)/13.000; 1.910 × (50.000 − R)/22.000; 0 oltre | AdE-4E par. 1; 730-26 tab. 6 | V |
| F03 | Maggiorazione +65 € per reddito complessivo 25.001–35.000 | 730-26 tab. 6 nota 4 | V |
| F04 | Minimi della detrazione: 690 € (indeterminato), 1.380 € (determinato), per R ≤ 15.000 | AdE-4E tabella p. 6; 730-26 tab. 6 nota 3 | V · **C** (non applicati) |
| F05 | Rapporti delle formule alle prime 4 cifre decimali | 730-26 tab. 6 nota 2 e tab. 2 nota 3 | V · **C** |
| F06 | Cuneo, somma esente: 7,1% fino a 8.500 · 5,3% fino a 15.000 · 4,8% fino a 20.000, sul reddito di lavoro dipendente, se reddito complessivo ≤ 20.000 | L. 207/2024 c. 4, testo in AdE-4E nota 11 | V |
| F07 | Cuneo, ulteriore detrazione: 1.000 € fra 20.000 e 32.000; 1.000 × (40.000 − R)/8.000 fino a 40.000 | L. 207/2024 c. 6, testo in AdE-4E nota 16 | V |
| F08 | Il cuneo deriva dalla L. 207/2024, senza termine finale (non dalla L. 199/2025, come scritto in precedenza) | AdE-4E | V · **C** (attribuzione) |
| F09 | Trattamento integrativo: 1.200 € se R ≤ 15.000 e imposta lorda > detrazione art. 13 **diminuita di 75 €** | AdE-4E par. 1.2 (L. 207/2024 c. 3); AdE-2E-24 | V · **C** (mancava −75 €) |
| F10 | Trattamento integrativo 15.000–28.000: solo per incapienza, importo = detrazioni − imposta lorda, max 1.200 € | DL 3/2020 art. 1 c. 1-bis; guide AdE | V |
| F11 | Detrazione figli 21–29 anni: 950 × (95.000 − R)/95.000; +15.000 al denominatore per ogni figlio oltre il primo; coefficiente troncato a 4 decimali | 730-26 tab. 4; AdE, art. 12 TUIR | V |
| F12 | Detrazione ascendenti conviventi: 750 × (80.000 − R)/80.000 | 730-26 tab. 5 | V |
| F13 | Contributi IVS lavoratore: privato 9,19% · pubblico 8,80% · apprendista 5,84% | circolari INPS; prassi paghe | V |
| F14 | +1% oltre la 1ª fascia di retribuzione pensionabile 2026: **56.224 €** | INPS-6; EcNews | V |
| F15 | L'addizionale regionale è dovuta solo se l'IRPEF netta è positiva | DLgs-446 art. 50 c. 2 | V · **C** (veniva sempre applicata) |
| F16 | Addizionali regionali 2026: 21 tabelle | MEF-ADD (date di pubblicazione in `fisco-2026.js`) | V · **C** (9 regioni errate) |

### F16 — dettaglio delle correzioni regionali

| Regione | Prima (dato errato) | Ora (MEF 2026) |
|---|---|---|
| Abruzzo | 1,73% fissa | 1,67% fino a 28.000 · 2,87% fino a 50.000 · 3,33% oltre |
| P.A. Bolzano | 1,23% fissa | 1,23% fino a 50.000 · 1,73% oltre; detrazione 430,50 € fino a 90.000; detrazione oltre 50.000 fino a 125 € |
| Calabria | 2,03% fissa | 1,73% fissa |
| Campania | 2,03 / 2,13 / 2,33 / 3,33 | 1,73 / 2,96 / 3,20 / 3,33 |
| Emilia-Romagna | 1,33 / 1,93 / 2,03 / 2,33 | 1,33 / 1,93 / 2,78 / 3,33 |
| Friuli Venezia Giulia | 0,70% sulla fascia fino a 15.000, poi 1,23% | 0,70% **sull'intero** se ≤ 15.000, altrimenti 1,23% sull'intero |
| Lazio | 1,73 / 2,73 / 2,93 / 3,33 | ≤ 28.000: 1,73% sull'intero; oltre: 1,73 / 3,33; detrazione 60 € fra 28.001 e 30.000 |
| Liguria | 1,23 / 1,81 / 2,31 / 2,33 | 1,23 fino a 28.000 · 3,18 · 3,23 |
| Umbria | 1,23 fino a 28.000 per tutti | ≤ 28.000: 1,23% sull'intero; oltre: 1,73 / 3,02 / 3,12 / 3,33; detrazione 150 € fra 28.001 e 50.000 |

Non modellate (dichiarato in pagina): detrazioni regionali per figli o disabilità
(Bolzano, Trento, Campania, Piemonte, Puglia, Sardegna, Marche, Veneto).

### Confronto esterno (RAL 30.000 €, 13 mensilità, privato)

| Fonte | IRPEF netta | Netto annuo | Scarto spiegato |
|---|---|---|---|
| Questo sito (Lombardia, solo addizionale regionale) | 3.221,63 | 23.643,43 | — |
| stipendionettocalcolatore.it (senza addizionali) | 3.287 | 23.956 | +65 € di IRPEF: non applica la maggiorazione F03. Senza addizionale il nostro netto è 24.021 € (24.021 − 23.956 = 65 €) |
| sum.money (con addizionali) | 3.287 | 23.442 | stessa maggiorazione F03 (65 €) + addizionale comunale, che qui non è inclusa |

Netto mensile: 1.818,73 € contro 1.803 € — scarto di 15,73 €/mese, interamente
spiegato da maggiorazione F03 ed addizionale comunale. Nessuno scarto non spiegato.

## TFR (`tfr-2026.js`)

| ID | Valore | Fonti | Stato |
|---|---|---|---|
| T01 | Quota annua = retribuzione / 13,5 | art. 2120 c.c.; AdE | V |
| T02 | Contributo 0,50% (L. 297/1982 art. 3) trattenuto dalla quota | messaggio INPS 413/2020 (L. 296/2006 c. 756); INPS msg. 1817/2019 | V |
| T03 | Non dovuto dagli apprendisti | prassi paghe (fonte secondaria) | I · non modellato, dichiarato |
| T04 | Rivalutazione = 1,5% fisso + 75% dell'aumento FOI | AdE (scheda imposta sostitutiva Tfr) | V |
| T05 | Coefficiente dicembre 2025: 2,311148% | ISTAT-TFR; EcNews; mySolution | V |
| T06 | Imposta sostitutiva 17% sulla rivalutazione | AdE (scheda imposta sostitutiva Tfr) | V |
| T07 | Tassazione separata: aliquota media IRPEF su reddito di riferimento = TFR × 12 / anni; riliquidazione AdE con media dei 5 anni precedenti | art. 19 TUIR (GU); circ. AdE 3/E 2012 | V |
| T08 | Fondo pensione: aliquota finale 15%, −0,30 punti per anno oltre il 15°, riduzione massima 6 punti (minimo 9%) | COVIP | V |
| T09 | Rendimenti del fondo tassati al 20% (12,5% sulla quota in titoli di Stato) | COVIP FAQ | V (il tool usa 20% su tutto: ipotesi dichiarata) |
| T10 | Al fondo pensione affluisce la quota intera (senza lo 0,50%) | non verificata su fonte primaria | I · dichiarata, effetto ≈ 7% della quota |
| T11 | RAL costante; coefficiente di dicembre 2025 applicato a ogni anno futuro | — | I · dichiarata |

## Regime forfettario (`forfettario-2026.js`)

| ID | Valore | Fonti | Stato |
|---|---|---|---|
| P01 | Soglia ricavi 85.000 €; oltre 100.000 € uscita immediata | L. 190/2014 c. 54 e 71 (mod. L. 197/2022) | V |
| P02 | Coefficienti di redditività 40 / 54 / 62 / 67 / 78 / 86 | L. 190/2014 all. 4 | V |
| P03 | Imposta sostitutiva 15%; 5% per i primi 5 anni alle condizioni del c. 65 | L. 190/2014 c. 64–65 | V |
| P04 | Gestione separata 2026: 26,07% (professionisti senza altra copertura), 24% (pensionati/altra copertura); massimale 122.295 € | INPS-8; EcNews; Orizzontescuola | V |
| P05 | Artigiani 24% / commercianti 24,48%, +1% oltre 56.224 €; minimale 18.808 €; contributo fisso 4.521,36 € / 4.611,64 € | INPS-14; partitaiva.it; fiscomania | V |
| P06 | Massimale art./comm.: 122.295 € (iscritti dal 1996), 93.707 € (con anzianità prima del 1996) | INPS-14 | V (il tool usa 122.295: dichiarato) |
| P07 | Riduzione contributiva 35% per forfettari artigiani/commercianti, su domanda | L. 190/2014 c. 77 | V |
| P08 | Contributi dedotti nell'anno stesso del reddito (nella realtà: per cassa, l'anno del pagamento) | — | I · dichiarata |
| P09 | Causa di esclusione: redditi di lavoro dipendente/pensione oltre 35.000 € nell'anno precedente — soglia **transitoria** per 2025 e 2026 (ordinaria: 30.000 €, L. 190/2014 c. 57 lett. d-ter) | L. 207/2024 art. 1 c. 12; prorogata da GU-199 art. 1 c. 27 ("gli anni 2025 e 2026"); Studio Pizzano, ItaliaOggi | V · non modellata, citata in pagina |

## Scorporo IVA (`iva.js`)

Letti su Normattiva il 26/10/2026, testo vigente al 30/01/2026 (`!vig=2026-01-30`).

| # | Valore / affermazione | Fonte primaria | Stato |
|---|---|---|---|
| I01 | Aliquota ordinaria 22%; ridotte 4%, 5%, 10% per tabella A parti II, II-bis, III | DPR 633/1972 art. 16 | V |
| I02 | Esempi: 4% latte fresco (II n. 3), pane (II), frutta (II n. 8); 5% basilico, rosmarino, salvia freschi (II-bis n. 1-bis), prestazioni socio-sanitarie di cooperative sociali (II-bis n. 1); 10% prestazioni ai clienti alloggiati nelle strutture ricettive (III n. 120), somministrazioni di alimenti e bevande (III n. 121) | DPR 633/1972 tabella A | V |
| I03 | Fattura: aliquota, imposta e imponibile con arrotondamento al centesimo di euro | DPR 633/1972 art. 21 c. 2 lett. l | V |
| I04 | Testo unico IVA: in vigore dal 31/01/2026, si applica dal 1° gennaio 2027 (art. 171); art. 34 = stesse aliquote, tabella A parti II, III, IV; abroga l'art. 16 DPR 633/1972 | D.Lgs. 10/2026 | V |
| I05 | Forfettari: niente rivalsa IVA per le operazioni nazionali | L. 190/2014 art. 1 c. 58 lett. a | V |
| I06 | Mezzo centesimo per eccesso; nello scorporo IVA = prezzo − imponibile arrotondato | — | I · convenzione dello strumento, dichiarata |
| I07 | Riferimento indipendente in centesimi interi: 4 aliquote × 2.000 importi, scorporo e aggiunta | `tests/fiscale.test.mjs` | V |

**Nota per il 2027.** Su Normattiva la vista «vigente» mostra già come abrogati
l'art. 16 DPR 633/1972 (D.Lgs. 10/2026) e i commi 54–89 della L. 190/2014
(D.Lgs. 117/2026, Testo unico delle imposte sui redditi, che si applica dal
1° gennaio 2027 — art. 377 — e abroga da quella data anche le norme dell'IRPEF
oggi nel TUIR, art. 376). Per l'anno d'imposta 2026 le norme citate restano
quelle applicabili; i link a Normattiva vanno datati (`!vig=`). Da gennaio 2027
tutte le citazioni normative del sito vanno riportate ai nuovi testi unici.

## Fuori perimetro (citati come esclusioni in pagina)

- Addizionale comunale; coniuge a carico; flat tax 2026 su aumenti contrattuali,
  premi di risultato e maggiorazioni (circ. AdE 2/E del 24/02/2026); riduzione
  delle detrazioni per oneri sopra 200.000 € (L. 199/2025 c. 4).
