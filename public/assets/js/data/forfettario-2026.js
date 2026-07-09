/**
 * DATI REGIME FORFETTARIO 2026 — costanti versionate. Un cambio normativo si
 * riflette QUI. Caricato prima del calcolatore; in Node come globalThis.FORFETTARIO.
 *
 * FONTI (vedi docs/research/partita-iva-forfettario-brief.md):
 *  - Soglia ricavi 85.000 € (permanenza); > 100.000 € fuoriuscita immediata.
 *  - Coefficienti di redditività per gruppo ATECO (L. 190/2014, all. 4).
 *  - Imposta sostitutiva 15%, ridotta al 5% per i primi 5 anni (nuove attività).
 *  - Contributi INPS 2026: gestione separata 26,07% (24% se altra copertura);
 *    artigiani 24% / commercianti 24,48% con minimale 18.808 € e contributo
 *    fisso; +1% oltre 56.224 €; massimale 122.295 €; riduzione 35% opzionale.
 */
(function (root) {
  root.FORFETTARIO = root.FORFETTARIO || {};
  root.FORFETTARIO["2026"] = {
    anno: 2026,
    sogliaRicavi: 85000,
    sogliaUscitaImmediata: 100000,
    impostaOrdinaria: 0.15,
    impostaStartup: 0.05,
    // Coefficienti di redditività per gruppo (chiave = coeff in %).
    coefficienti: {
      "40": "Commercio, alimentari/bevande, alloggio e ristorazione",
      "54": "Commercio ambulante di prodotti non alimentari",
      "62": "Intermediari del commercio",
      "67": "Altre attività economiche (catch-all)",
      "78": "Professionisti, attività scientifiche/tecniche/sanitarie, istruzione",
      "86": "Costruzioni e attività immobiliari",
    },
    inps: {
      sogliaAliquotaMaggiore: 56224, // oltre: +1%
      massimale: 122295,
      riduzione35: 0.35,
      gestioneSeparata: {
        aliquota: 0.2607,
        aliquotaAltraCopertura: 0.24, // pensionati / altra gestione previdenziale
      },
      artigiani: {
        aliquota: 0.24,
        aliquotaOltre: 0.25,
        minimaleReddito: 18808,
        contributoFisso: 4521.36,
      },
      commercianti: {
        aliquota: 0.2448,
        aliquotaOltre: 0.2548,
        minimaleReddito: 18808,
        contributoFisso: 4611.64,
      },
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
