/**
 * DATI FISCALI 2026 — fonte di verità versionata (anno d'imposta 2026).
 * Un cambio normativo si riflette QUI, in un solo file. Caricato in pagina
 * prima del calcolatore; disponibile anche in Node come globalThis.FISCO.
 *
 * FONTI:
 *  - IRPEF 2026: Legge di Bilancio 2026 (L. 199/2025) — 2° scaglione ridotto
 *    dal 35% al 33%. Agenzia delle Entrate, "Aliquote e calcolo dell'IRPEF".
 *  - Detrazioni lavoro dipendente: art. 13 TUIR (D.Lgs. 216/2023, conf. L. 207/2024).
 *  - Taglio del cuneo fiscale 2026 (strutturale, L. 199/2025): bonus esente
 *    per redditi ≤ 20.000 € + ulteriore detrazione 20.000–40.000 €.
 *  - Trattamento integrativo (ex Bonus Renzi): fino a 1.200 € per redditi ≤ 15.000 €.
 *  - Contributi INPS IVS: 9,19% (+1% oltre 56.224 €); apprendisti 5,84%.
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
      sogliaAggiuntiva: 56224,   // oltre questa quota: +1%
      aliquotaAggiuntiva: 0.01,
    },

    irpef: {
      scaglioni: [
        { fino: 28000, aliquota: 0.23 },
        { fino: 50000, aliquota: 0.33 },
        { fino: Infinity, aliquota: 0.43 },
      ],
    },

    // Detrazione per lavoro dipendente (art. 13 TUIR), su reddito imponibile.
    detrazioneLavoro: {
      fino15k: 1955,
      minimoDeterminato: 1380,   // minimo garantito per i rapporti a tempo determinato (art. 13 c.1)
      // 15.001–28.000: 1910 + 1190 * (28000 - R)/13000
      base2: 1910, quota2: 1190, sup2: 28000, ampiezza2: 13000,
      // maggiorazione +65 per reddito complessivo 25.001–35.000 (L. 207/2024)
      maggiorazione: 65, maggiorazioneDa: 25000, maggiorazioneA: 35000,
      // 28.001–50.000: 1910 * (50000 - R)/22000
      base3: 1910, sup3: 50000, ampiezza3: 22000,
    },

    // Taglio del cuneo fiscale 2026 (L. 199/2025).
    cuneo: {
      // Parte A — bonus ESENTE (% del reddito), redditi ≤ 20.000.
      bonus: [
        { fino: 8500, perc: 0.071 },
        { fino: 15000, perc: 0.053 },
        { fino: 20000, perc: 0.048 },
      ],
      // Parte B — ulteriore DETRAZIONE, redditi 20.001–40.000.
      detrazione: { importo: 1000, da: 20000, fissoFino: 32000, azzeraA: 40000 },
    },

    // Trattamento integrativo (ex Bonus Renzi).
    trattamentoIntegrativo: {
      importo: 1200,
      sogliaPiena: 15000,   // ≤ 15.000: 1.200 se IRPEF lorda > detrazione lavoro
      sogliaMax: 28000,     // 15.001–28.000: solo per capienza; oltre: nulla
    },

    // Detrazione figli a carico 21–29 anni (art. 12 TUIR, riforma L. 207/2024).
    // Gli under 21 → Assegno Unico (niente IRPEF). Formula decrescente col reddito.
    detrazioniFigli: {
      teorica: 950,
      denomBase: 95000,        // denominatore base
      denomPerFiglioExtra: 15000, // +15.000 per ogni figlio oltre il primo
      // maggiorazioni non gestite in v2 (disabilità, >3 figli): richiedono input dedicati.
    },

    // Detrazione altri familiari a carico: solo ascendenti conviventi (art. 12 TUIR).
    detrazioniAltriFamiliari: {
      teorica: 750,
      tettoReddito: 80000,     // spetta solo se reddito dichiarante ≤ 80.000
    },

    // Addizionale regionale IRPEF 2026. Applicazione a scaglioni = PROGRESSIVA per fascia.
    // Scaglioni: { fino: soglia € (null = ultimo), aliquota: decimale }.
    // esenzioneFino: se imponibile ≤ soglia → addizionale 0, altrimenti si applica sull'intero.
    // affidabilita: "mef-2026" (verificata portale MEF) | "provvisoria" (MEF non pubblicato → fonti secondarie).
    // Fonte MEF: finanze.gov.it/.../addregirpef/  · vedi docs/research/stipendio-netto-brief.md §8.
    addizionaleRegionale: {
      // — Verificate MEF 2026 —
      "lombardia":     { tipo: "scaglioni", affidabilita: "mef-2026", scaglioni: [{ fino: 15000, aliquota: 0.0123 }, { fino: 28000, aliquota: 0.0158 }, { fino: 50000, aliquota: 0.0172 }, { fino: null, aliquota: 0.0173 }] },
      "marche":        { tipo: "scaglioni", affidabilita: "mef-2026", scaglioni: [{ fino: 15000, aliquota: 0.0123 }, { fino: 28000, aliquota: 0.0153 }, { fino: 50000, aliquota: 0.0170 }, { fino: null, aliquota: 0.0173 }] },
      "molise":        { tipo: "scaglioni", affidabilita: "mef-2026", scaglioni: [{ fino: 15000, aliquota: 0.0203 }, { fino: 28000, aliquota: 0.0223 }, { fino: 50000, aliquota: 0.0363 }, { fino: null, aliquota: 0.0363 }] },
      "piemonte":      { tipo: "scaglioni", affidabilita: "mef-2026", scaglioni: [{ fino: 15000, aliquota: 0.0162 }, { fino: 28000, aliquota: 0.0268 }, { fino: 50000, aliquota: 0.0331 }, { fino: null, aliquota: 0.0333 }] },
      "puglia":        { tipo: "scaglioni", affidabilita: "mef-2026", scaglioni: [{ fino: 15000, aliquota: 0.0133 }, { fino: 28000, aliquota: 0.0213 }, { fino: 50000, aliquota: 0.0323 }, { fino: null, aliquota: 0.0333 }] },
      "sardegna":      { tipo: "fissa", affidabilita: "mef-2026", aliquota: 0.0123 },
      "sicilia":       { tipo: "fissa", affidabilita: "mef-2026", aliquota: 0.0123 },
      "toscana":       { tipo: "scaglioni", affidabilita: "mef-2026", scaglioni: [{ fino: 15000, aliquota: 0.0142 }, { fino: 28000, aliquota: 0.0143 }, { fino: 50000, aliquota: 0.0332 }, { fino: null, aliquota: 0.0333 }] },
      "provincia-trento": { tipo: "scaglioni", affidabilita: "mef-2026", esenzioneFino: 30000, scaglioni: [{ fino: 50000, aliquota: 0.0123 }, { fino: null, aliquota: 0.0173 }] },
      "umbria":        { tipo: "scaglioni", affidabilita: "provvisoria", scaglioni: [{ fino: 28000, aliquota: 0.0123 }, { fino: 50000, aliquota: 0.0312 }, { fino: null, aliquota: 0.0333 }] },
      "valle-d-aosta": { tipo: "fissa", affidabilita: "mef-2026", esenzioneFino: 15000, aliquota: 0.0123 },
      "veneto":        { tipo: "fissa", affidabilita: "mef-2026", aliquota: 0.0123 },
      // — Provvisorie (MEF 2026 non ancora pubblicato — fonti secondarie) —
      "abruzzo":       { tipo: "fissa", affidabilita: "provvisoria", aliquota: 0.0173 },
      "basilicata":    { tipo: "fissa", affidabilita: "provvisoria", aliquota: 0.0123 },
      "provincia-bolzano": { tipo: "fissa", affidabilita: "provvisoria", aliquota: 0.0123 },
      "calabria":      { tipo: "fissa", affidabilita: "provvisoria", aliquota: 0.0203 },
      "campania":      { tipo: "scaglioni", affidabilita: "provvisoria", scaglioni: [{ fino: 15000, aliquota: 0.0203 }, { fino: 28000, aliquota: 0.0213 }, { fino: 50000, aliquota: 0.0233 }, { fino: null, aliquota: 0.0333 }] },
      "emilia-romagna":{ tipo: "scaglioni", affidabilita: "provvisoria", scaglioni: [{ fino: 15000, aliquota: 0.0133 }, { fino: 28000, aliquota: 0.0193 }, { fino: 50000, aliquota: 0.0203 }, { fino: null, aliquota: 0.0233 }] },
      "friuli-venezia-giulia": { tipo: "scaglioni", affidabilita: "provvisoria", scaglioni: [{ fino: 15000, aliquota: 0.0070 }, { fino: null, aliquota: 0.0123 }] },
      "lazio":         { tipo: "scaglioni", affidabilita: "provvisoria", scaglioni: [{ fino: 15000, aliquota: 0.0173 }, { fino: 28000, aliquota: 0.0273 }, { fino: 50000, aliquota: 0.0293 }, { fino: null, aliquota: 0.0333 }] },
      "liguria":       { tipo: "scaglioni", affidabilita: "provvisoria", scaglioni: [{ fino: 15000, aliquota: 0.0123 }, { fino: 28000, aliquota: 0.0181 }, { fino: 50000, aliquota: 0.0231 }, { fino: null, aliquota: 0.0233 }] },
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
