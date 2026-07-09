/**
 * CALCOLATORE TFR — stima del Trattamento di Fine Rapporto maturato e del netto
 * alla liquidazione. Funzione pura; costanti in /assets/js/data/tfr-2026.js
 * (globalThis.TFR["2026"]). Metodo in docs/research/tfr-brief.md.
 *
 * Due percorsi (destinazione del TFR):
 *  - "azienda": TFR lasciato in azienda o al Fondo Tesoreria INPS (≥50 dip.).
 *    Quota annua = RAL/13,5 − 0,50% RAL; rivalutazione annua (1,5% + 75% FOI)
 *    sul montante, tassata 17% ogni anno; alla liquidazione tassazione separata
 *    (aliquota media IRPEF sul reddito di riferimento) sul capitale versato.
 *  - "fondo-pensione": previdenza complementare. Nessuna rivalutazione FOI:
 *    rendimento di mercato (ipotizzato), tassato al 20%; liquidazione tassata
 *    15% → fino al 9% oltre il 15° anno. Stima semplificata.
 *
 * Ipotesi: RAL costante negli anni (stima). La riliquidazione reale è a cura
 * dell'Agenzia delle Entrate sulla media quinquennale.
 */
(function (root) {
  function aliquotaMediaIrpef(reddito, scaglioni) {
    if (reddito <= 0) return 0;
    var irpef = 0, prev = 0;
    for (var i = 0; i < scaglioni.length; i++) {
      var s = scaglioni[i];
      if (reddito > prev) {
        irpef += (Math.min(reddito, s.fino) - prev) * s.aliquota;
        prev = s.fino;
      }
    }
    return irpef / reddito;
  }

  function calcolaTfr(input) {
    var T = (typeof window !== "undefined" ? window : root).TFR["2026"];
    var ral = Math.max(0, Number(input.ral) || 0);
    var anni = Math.max(1, Math.floor(Number(input.anni) || 1));
    var destinazione = input.destinazione || "azienda";

    // Quota annua accantonata (netta del contributo 0,50%).
    var quotaAnnua = ral / T.divisore - ral * T.contributoFap;
    if (quotaAnnua < 0) quotaAnnua = 0;

    if (destinazione === "fondo-pensione") {
      // Previdenza complementare: rendimento di mercato ipotizzato, no FOI.
      var rendimento = input.rendimentoFondo != null
        ? Number(input.rendimentoFondo) / 100
        : T.fondoPensione.rendimentoDefault;
      if (!isFinite(rendimento)) rendimento = T.fondoPensione.rendimentoDefault;
      // Nel fondo pensione la quota versata è l'intero RAL/13,5 (senza 0,50%).
      var quotaFP = ral / T.divisore;
      var montanteFP = 0, rendimentiLordi = 0;
      for (var y = 0; y < anni; y++) {
        var rend = montanteFP * rendimento;
        rendimentiLordi += rend;
        montanteFP += rend * (1 - T.fondoPensione.tassaRendimenti); // rendimenti tassati 20%
        montanteFP += quotaFP;
      }
      var capitaleFP = quotaFP * anni;
      // Aliquota di tassazione finale: 15% → -0,30%/anno oltre il 15°, min 9%.
      var extra = Math.max(0, anni - T.fondoPensione.annoInizioDecremento);
      var aliqFinale = Math.max(
        T.fondoPensione.aliquotaMinima,
        T.fondoPensione.aliquotaBase - T.fondoPensione.decrementoAnnuo * extra
      );
      var impostaFinaleFP = capitaleFP * aliqFinale; // la parte capitale è tassata alla liquidazione
      var lordoFP = montanteFP;
      var nettoFP = montanteFP - impostaFinaleFP;
      return {
        nettoTfr: nettoFP,
        lordo: lordoFP,
        impostaSost: rendimentiLordi * T.fondoPensione.tassaRendimenti,
        impostaSeparata: impostaFinaleFP,
        quotaAnnua: quotaFP,
        rivalutazioni: rendimentiLordi,
        aliquotaMedia: aliqFinale,
        pressione: lordoFP > 0 ? (lordoFP - nettoFP) / lordoFP : 0,
        destinazioneNota: "Previdenza complementare: rendimento ipotizzato " +
          (rendimento * 100).toFixed(1).replace(".", ",") + "%/anno, non garantito. Tassazione finale " +
          (aliqFinale * 100).toFixed(1).replace(".", ",") + "%.",
      };
    }

    // — Percorso "azienda" / Fondo Tesoreria INPS —
    var coeff = input.rivalutazioneAnnua != null
      ? Number(input.rivalutazioneAnnua) / 100
      : T.coeffRivalDefault;
    if (!isFinite(coeff) || coeff < 0) coeff = T.coeffRivalDefault;

    var montante = 0;          // capitale versato (netto quota) accumulato
    var rivalNetteTot = 0;     // rivalutazioni nette (dopo 17%) accumulate
    var rivalLordeTot = 0;     // rivalutazioni lorde (base imposta sostitutiva)
    for (var i = 0; i < anni; i++) {
      var baseRival = montante + rivalNetteTot; // montante rivalutabile a inizio anno
      var rival = baseRival * coeff;
      rivalLordeTot += rival;
      rivalNetteTot += rival * (1 - T.impostaSostitutiva);
      montante += quotaAnnua;
    }
    var capitaleVersato = montante;                 // imponibile per la tassazione separata
    var impostaSost = rivalLordeTot * T.impostaSostitutiva;
    var lordoTotale = capitaleVersato + rivalLordeTot;

    // Tassazione separata: aliquota media IRPEF sul reddito di riferimento.
    var redditoRif = (capitaleVersato / anni) * 12;
    var aliqMedia = aliquotaMediaIrpef(redditoRif, T.irpefScaglioni);
    var impostaSeparata = capitaleVersato * aliqMedia;

    var nettoTfr = capitaleVersato - impostaSeparata + rivalNetteTot;

    return {
      nettoTfr: nettoTfr,
      lordo: lordoTotale,
      impostaSost: impostaSost,
      impostaSeparata: impostaSeparata,
      quotaAnnua: quotaAnnua,
      rivalutazioni: rivalLordeTot,
      aliquotaMedia: aliqMedia,
      pressione: lordoTotale > 0 ? (lordoTotale - nettoTfr) / lordoTotale : 0,
      destinazioneNota: "",
    };
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("tfr-v1", calcolaTfr);
  }
  root.__calcolaTfr = calcolaTfr;
})(typeof window !== "undefined" ? window : globalThis);
