/**
 * DATI FISCALI 2026 — fonte di verità versionata (anno d'imposta 2026).
 * Un cambio normativo si riflette QUI, in un solo file. Caricato in pagina
 * prima del calcolatore; disponibile anche in Node come globalThis.FISCO.
 *
 * Ogni valore è verificato su fonte primaria (registro completo in
 * docs/verifica/registro-fiscale.md). Verifica: ottobre 2026.
 *
 * FONTI PRIMARIE:
 *  - Scaglioni IRPEF: art. 11 TUIR; 2° scaglione al 33% da L. 199/2025, art. 1
 *    c. 3 (GU n. 301 del 30/12/2025). Agenzia Entrate, scheda "Aliquote e
 *    calcolo dell'IRPEF".
 *  - Detrazione lavoro dipendente (art. 13 TUIR): 1.955 € a regime da L. 207/2024
 *    c. 2 (circ. AdE 4/E del 16/05/2025); tabella, minimi 690/1.380 €,
 *    maggiorazione 65 € per 25.001–35.000 €, rapporti alle prime 4 cifre
 *    decimali: istruzioni Mod. 730/2026, tabella 6.
 *  - Taglio del cuneo: L. 207/2024 c. 4 (somma esente) e c. 6 (ulteriore
 *    detrazione), senza termine finale — circ. AdE 4/E/2025.
 *  - Trattamento integrativo: art. 1 DL 3/2020; condizione "imposta lorda >
 *    detrazione art. 13 diminuita di 75 €" a regime da L. 207/2024 c. 3
 *    (circ. AdE 4/E/2025, par. 1.2).
 *  - Detrazioni familiari (art. 12 TUIR, come modificato da L. 207/2024):
 *    istruzioni Mod. 730/2026, tabelle 4 e 5.
 *  - Contributi INPS 2026: circ. INPS n. 6 del 30/01/2026 (1ª fascia di
 *    retribuzione pensionabile 56.224 €, +1% oltre).
 *  - Addizionale regionale: art. 50 D.Lgs. 446/1997 (dovuta solo se l'IRPEF
 *    netta è positiva, c. 2); aliquote 2026 dal portale MEF Dipartimento
 *    Finanze, una pagina per regione (date di pubblicazione sotto).
 */
(function (root) {
  root.FISCO = root.FISCO || {};
  root.FISCO["2026"] = {
    anno: 2026,
    giorniAnno: 365,           // base per il rapporto ai giorni (tempo determinato)

    inps: {
      // Quota IVS a carico del lavoratore, per tipo di rapporto.
      perTipo: {
        privato: 0.0919,      // dipendente privato standard (FPLD)
        pubblico: 0.0880,     // dipendente pubblico (quota lavoratore standard)
        apprendista: 0.0584,  // apprendistato
      },
      aliquota: 0.0919,          // default/legacy (privato)
      aliquotaApprendista: 0.0584,
      sogliaAggiuntiva: 56224,   // circ. INPS 6/2026: oltre questa quota +1%
      aliquotaAggiuntiva: 0.01,
    },

    irpef: {
      scaglioni: [
        { fino: 28000, aliquota: 0.23 },
        { fino: 50000, aliquota: 0.33 },
        { fino: Infinity, aliquota: 0.43 },
      ],
    },

    // Detrazione per lavoro dipendente (art. 13 TUIR), su reddito complessivo.
    detrazioneLavoro: {
      fino15k: 1955,
      minimoIndeterminato: 690,  // minimo dell'importo effettivamente spettante (R ≤ 15.000)
      minimoDeterminato: 1380,   // idem, rapporti a tempo determinato
      // 15.001–28.000: 1910 + 1190 * (28000 - R)/13000
      base2: 1910, quota2: 1190, sup2: 28000, ampiezza2: 13000,
      // maggiorazione +65 per reddito complessivo 25.001–35.000 (730/2026, tab. 6 nota 4)
      maggiorazione: 65, maggiorazioneDa: 25000, maggiorazioneA: 35000,
      // 28.001–50.000: 1910 * (50000 - R)/22000
      base3: 1910, sup3: 50000, ampiezza3: 22000,
      decimaliRapporto: 4,       // "si assume nelle prime 4 cifre decimali"
    },

    // Taglio del cuneo fiscale (L. 207/2024, commi 4 e 6).
    cuneo: {
      // Comma 4 — somma ESENTE (% del reddito di lavoro dipendente),
      // spetta se il reddito complessivo non supera 20.000 €.
      bonus: [
        { fino: 8500, perc: 0.071 },
        { fino: 15000, perc: 0.053 },
        { fino: 20000, perc: 0.048 },
      ],
      // Comma 6 — ulteriore DETRAZIONE, reddito complessivo 20.001–40.000.
      detrazione: { importo: 1000, da: 20000, fissoFino: 32000, azzeraA: 40000 },
    },

    // Trattamento integrativo (ex Bonus Renzi).
    trattamentoIntegrativo: {
      importo: 1200,
      sogliaPiena: 15000,   // ≤ 15.000: spetta se imposta lorda > detrazione art.13 − 75 €
      riduzioneCapienza: 75,
      sogliaMax: 28000,     // 15.001–28.000: solo per incapienza; oltre: nulla
    },

    // Detrazione figli a carico 21–29 anni (art. 12 TUIR, riforma L. 207/2024).
    // Gli under 21 → Assegno Unico (detrazione 0). Formula decrescente col reddito.
    detrazioniFigli: {
      teorica: 950,
      denomBase: 95000,           // denominatore base
      denomPerFiglioExtra: 15000, // +15.000 per ogni figlio oltre il primo
      decimaliRapporto: 4,        // coefficiente troncato alla 4ª cifra decimale
    },

    // Detrazione ascendenti conviventi a carico (art. 12 TUIR).
    detrazioniAltriFamiliari: {
      teorica: 750,
      tettoReddito: 80000,     // 750 × (80.000 − R) / 80.000
      decimaliRapporto: 4,
    },

    // Addizionale regionale IRPEF 2026 — tutte da portale MEF (pagina per regione).
    // Modello:
    //   tipo "fissa": aliquota unica sull'intero imponibile.
    //   tipo "scaglioni": progressiva per fascia ({ fino: soglia | null = ultimo }).
    //   esenzioneFino: imponibile ≤ soglia → addizionale 0.
    //   unicaFino: { fino, aliquota } → imponibile ≤ soglia: quell'aliquota
    //              sull'intero importo (sostituisce gli scaglioni).
    //   detrazioni: [{ oltre, fino, importo }] → detrazione fissa se
    //              oltre < imponibile ≤ fino (oltre assente = 0). Non genera credito.
    //   detrazioneOltre: { soglia, importo, ampiezza } → importo × (R − soglia)/ampiezza,
    //              massimo `importo` (P.A. Bolzano, lett. b).
    // Le detrazioni regionali legate ai figli o alla disabilità NON sono modellate.
    addizionaleRegionale: {
      "abruzzo":       { pubblicazione: "2026-01-28", tipo: "scaglioni", scaglioni: [{ fino: 28000, aliquota: 0.0167 }, { fino: 50000, aliquota: 0.0287 }, { fino: null, aliquota: 0.0333 }] },
      "basilicata":    { pubblicazione: "2026-01-29", tipo: "fissa", aliquota: 0.0123 },
      "provincia-bolzano": {
        pubblicazione: "2026-01-29", tipo: "scaglioni",
        scaglioni: [{ fino: 28000, aliquota: 0.0123 }, { fino: 50000, aliquota: 0.0123 }, { fino: null, aliquota: 0.0173 }],
        detrazioni: [{ fino: 90000, importo: 430.5 }],
        detrazioneOltre: { soglia: 50000, importo: 125, ampiezza: 25000 },
      },
      "calabria":      { pubblicazione: "2026-01-29", tipo: "fissa", aliquota: 0.0173 },
      "campania":      { pubblicazione: "2026-01-29", tipo: "scaglioni", scaglioni: [{ fino: 15000, aliquota: 0.0173 }, { fino: 28000, aliquota: 0.0296 }, { fino: 50000, aliquota: 0.0320 }, { fino: null, aliquota: 0.0333 }] },
      "emilia-romagna":{ pubblicazione: "2026-01-19", tipo: "scaglioni", scaglioni: [{ fino: 15000, aliquota: 0.0133 }, { fino: 28000, aliquota: 0.0193 }, { fino: 50000, aliquota: 0.0278 }, { fino: null, aliquota: 0.0333 }] },
      "friuli-venezia-giulia": { pubblicazione: "2026-01-19", tipo: "fissa", aliquota: 0.0123, unicaFino: { fino: 15000, aliquota: 0.0070 } },
      "lazio": {
        pubblicazione: "2026-01-22", tipo: "scaglioni",
        scaglioni: [{ fino: 15000, aliquota: 0.0173 }, { fino: 28000, aliquota: 0.0333 }, { fino: 50000, aliquota: 0.0333 }, { fino: null, aliquota: 0.0333 }],
        unicaFino: { fino: 28000, aliquota: 0.0173 },
        detrazioni: [{ oltre: 28000, fino: 30000, importo: 60 }],
      },
      "liguria":       { pubblicazione: "2026-01-28", tipo: "scaglioni", scaglioni: [{ fino: 28000, aliquota: 0.0123 }, { fino: 50000, aliquota: 0.0318 }, { fino: null, aliquota: 0.0323 }] },
      "lombardia":     { pubblicazione: "2026-01-28", tipo: "scaglioni", scaglioni: [{ fino: 15000, aliquota: 0.0123 }, { fino: 28000, aliquota: 0.0158 }, { fino: 50000, aliquota: 0.0172 }, { fino: null, aliquota: 0.0173 }] },
      "marche":        { pubblicazione: "2026-01-22", tipo: "scaglioni", scaglioni: [{ fino: 15000, aliquota: 0.0123 }, { fino: 28000, aliquota: 0.0153 }, { fino: 50000, aliquota: 0.0170 }, { fino: null, aliquota: 0.0173 }] },
      "molise":        { pubblicazione: "2026-06-19", tipo: "scaglioni", scaglioni: [{ fino: 15000, aliquota: 0.0203 }, { fino: 28000, aliquota: 0.0223 }, { fino: 50000, aliquota: 0.0363 }, { fino: null, aliquota: 0.0363 }] },
      "piemonte":      { pubblicazione: "2026-01-29", tipo: "scaglioni", scaglioni: [{ fino: 15000, aliquota: 0.0162 }, { fino: 28000, aliquota: 0.0268 }, { fino: 50000, aliquota: 0.0331 }, { fino: null, aliquota: 0.0333 }] },
      "puglia":        { pubblicazione: "2026-05-29", tipo: "scaglioni", scaglioni: [{ fino: 15000, aliquota: 0.0133 }, { fino: 28000, aliquota: 0.0213 }, { fino: 50000, aliquota: 0.0323 }, { fino: null, aliquota: 0.0333 }] },
      "sardegna":      { pubblicazione: "2026-01-29", tipo: "fissa", aliquota: 0.0123 },
      "sicilia":       { pubblicazione: "2026-01-29", tipo: "fissa", aliquota: 0.0123 },
      "toscana":       { pubblicazione: "2026-01-30", tipo: "scaglioni", scaglioni: [{ fino: 15000, aliquota: 0.0142 }, { fino: 28000, aliquota: 0.0143 }, { fino: 50000, aliquota: 0.0332 }, { fino: null, aliquota: 0.0333 }] },
      "provincia-trento": { pubblicazione: "2026-01-22", tipo: "scaglioni", esenzioneFino: 30000, scaglioni: [{ fino: 50000, aliquota: 0.0123 }, { fino: null, aliquota: 0.0173 }] },
      "umbria": {
        pubblicazione: "2026-01-19", tipo: "scaglioni",
        scaglioni: [{ fino: 15000, aliquota: 0.0173 }, { fino: 28000, aliquota: 0.0302 }, { fino: 50000, aliquota: 0.0312 }, { fino: null, aliquota: 0.0333 }],
        unicaFino: { fino: 28000, aliquota: 0.0123 },
        detrazioni: [{ oltre: 28000, fino: 50000, importo: 150 }],
      },
      "valle-d-aosta": { pubblicazione: "2026-01-19", tipo: "fissa", esenzioneFino: 15000, aliquota: 0.0123 },
      "veneto":        { pubblicazione: "2026-01-22", tipo: "fissa", aliquota: 0.0123 },
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
