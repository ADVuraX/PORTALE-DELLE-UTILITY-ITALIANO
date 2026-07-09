/**
 * DATI TFR 2026 — costanti versionate per il calcolo del Trattamento di Fine
 * Rapporto. Un cambio normativo/indice si riflette QUI. Caricato prima del
 * calcolatore; disponibile in Node come globalThis.TFR.
 *
 * FONTI (vedi docs/research/tfr-brief.md):
 *  - Divisore 13,5 e quota annua: art. 2120 c.c.
 *  - Contributo 0,50% (fondo pensione/garanzia INPS): trattenuto dalla quota.
 *  - Rivalutazione = 1,5% fisso + 75% aumento indice ISTAT FOI, sul montante al
 *    31/12 dell'anno precedente. Coeff. indicativo dic. 2025 ≈ 2,311%.
 *  - Imposta sostitutiva 17% annua sulla rivalutazione.
 *  - Tassazione separata alla liquidazione: aliquota media IRPEF su reddito di
 *    riferimento = (imponibile / anni) × 12. Scaglioni IRPEF 2026.
 *  - Previdenza complementare: no rivalutazione FOI (rendimento di mercato),
 *    tassazione finale 15% che scende 0,30%/anno oltre il 15° anno, fino al 9%.
 */
(function (root) {
  root.TFR = root.TFR || {};
  root.TFR["2026"] = {
    anno: 2026,
    divisore: 13.5,
    contributoFap: 0.005,          // 0,50% trattenuto dalla quota annua
    rivalutazioneFissa: 0.015,     // 1,5% fisso
    rivalutazioneQuotaIstat: 0.75, // + 75% aumento FOI
    coeffRivalDefault: 0.02311,    // stima dic. 2025 (FOI 121,5 / 120,2)
    impostaSostitutiva: 0.17,      // sulla rivalutazione, annua
    irpefScaglioni: [
      { fino: 28000, aliquota: 0.23 },
      { fino: 50000, aliquota: 0.33 },
      { fino: Infinity, aliquota: 0.43 },
    ],
    fondoPensione: {
      aliquotaBase: 0.15,          // fino al 15° anno
      decrementoAnnuo: 0.003,      // -0,30% per ogni anno oltre il 15°
      aliquotaMinima: 0.09,        // pavimento
      annoInizioDecremento: 15,
      tassaRendimenti: 0.20,       // rendimenti del fondo tassati al 20%
      rendimentoDefault: 0.025,    // rendimento medio annuo ipotizzato
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
