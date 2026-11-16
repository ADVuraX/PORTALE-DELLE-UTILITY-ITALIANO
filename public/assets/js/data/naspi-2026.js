/**
 * DATI NASpI 2026 — costanti per l'indennità di disoccupazione. Un cambio
 * normativo o la circolare INPS di inizio anno si riflettono QUI. Caricato
 * prima del calcolatore; in Node è globalThis.NASPI.
 *
 * FONTI:
 *  - D.Lgs. 4 marzo 2015, n. 22: art. 3 (13 settimane di contribuzione negli
 *    ultimi 4 anni), art. 4 (base di calcolo × 4,33; 75% fino alla soglia, più
 *    25% dell'eccedenza; massimale; riduzione del 3% al mese dal 6° mese, dall'8°
 *    con 55 anni compiuti alla domanda), art. 5 (durata: metà delle settimane).
 *  - INPS, circolare n. 4 del 28/01/2026, § 6: retribuzione di riferimento
 *    1.456,72 € e importo massimo mensile 1.584,70 € per il 2026.
 *  - INPS, circolare n. 94 del 12/05/2015, § 2.3: valore giornaliero = importo
 *    mensile / 30 per le frazioni di mese.
 *  - INPS, circolare n. 2 del 04/01/2022, § 5: riduzione dal 151° giorno (dal
 *    211° con 55 anni), cioè mesi di fruizione di 30 giorni.
 *  - INPS, circolare n. 122 del 06/08/2021, § 2: ogni riduzione del 3% si
 *    applica all'importo già ridotto.
 */
(function (root) {
  root.NASPI = root.NASPI || {};
  root.NASPI["2026"] = {
    anno: 2026,
    soglia: 1456.72,         // retribuzione di riferimento (circ. INPS 4/2026)
    massimale: 1584.70,      // importo massimo mensile (circ. INPS 4/2026)
    coefficiente: 4.33,      // settimane in un mese (art. 4 c. 1)
    quotaFinoSoglia: 0.75,
    quotaOltreSoglia: 0.25,
    riduzione: 0.03,         // per mese, sull'importo già ridotto
    meseRiduzione: 6,        // primo mese ridotto (151° giorno)
    meseRiduzione55: 8,      // con 55 anni compiuti alla domanda (211° giorno)
    giorniMese: 30,          // divisore INPS per le frazioni di mese
    settimaneMinime: 13,     // art. 3 c. 1 lett. b
    settimaneQuadriennio: 208,
  };
})(typeof window !== "undefined" ? window : globalThis);
