/**
 * CALCOLATORE PARTITA IVA — REGIME FORFETTARIO. Funzione pura; costanti in
 * /assets/js/data/forfettario-2026.js (globalThis.FORFETTARIO["2026"]).
 * Metodo in docs/research/partita-iva-forfettario-brief.md.
 *
 * Flusso: redditoLordo = ricavi × coefficiente → contributi INPS (sul reddito
 * lordo) → imponibile = max(0, redditoLordo − contributi) → imposta sostitutiva
 * (5% startup / 15% ordinaria) → netto = ricavi − contributi − imposta.
 */
(function (root) {
  function contributiArtComm(reddito, g, F, riduzione) {
    var minimale = g.minimaleReddito;
    var soglia = F.inps.sogliaAliquotaMaggiore;
    var massimale = F.inps.massimale;
    var redditoCap = Math.min(reddito, massimale);

    var contributi = g.contributoFisso; // dovuto anche a reddito zero (sul minimale)
    if (redditoCap > minimale) {
      var eccedenza = redditoCap - minimale;
      if (redditoCap <= soglia) {
        contributi += eccedenza * g.aliquota;
      } else {
        contributi += (soglia - minimale) * g.aliquota;
        contributi += (redditoCap - soglia) * g.aliquotaOltre;
      }
    }
    if (riduzione) contributi *= (1 - F.inps.riduzione35);
    return contributi;
  }

  function calcolaForfettario(input) {
    var F = (typeof window !== "undefined" ? window : root).FORFETTARIO["2026"];
    var ricavi = Math.max(0, Number(input.ricavi) || 0);
    var coeff = (Number(input.coefficiente) || 78) / 100;
    var gestione = input.gestioneInps || "gestione-separata";
    var startup = !!input.startup;
    var riduzione = !!input.riduzione35;
    var pensionato = !!input.pensionato;

    var redditoLordo = ricavi * coeff;

    // Contributi previdenziali (calcolati sul reddito lordo forfettario).
    var contributi = 0;
    var notaInps = "";
    if (gestione === "gestione-separata") {
      var aliq = pensionato ? F.inps.gestioneSeparata.aliquotaAltraCopertura : F.inps.gestioneSeparata.aliquota;
      contributi = Math.min(redditoLordo, F.inps.massimale) * aliq;
    } else if (gestione === "artigiani") {
      contributi = contributiArtComm(redditoLordo, F.inps.artigiani, F, riduzione);
      if (redditoLordo < F.inps.artigiani.minimaleReddito) notaInps = "Contributo fisso dovuto anche sotto il minimale.";
    } else if (gestione === "commercianti") {
      contributi = contributiArtComm(redditoLordo, F.inps.commercianti, F, riduzione);
      if (redditoLordo < F.inps.commercianti.minimaleReddito) notaInps = "Contributo fisso dovuto anche sotto il minimale.";
    } else if (gestione === "cassa-professionale") {
      contributi = Math.max(0, Number(input.contributiCassa) || 0);
      notaInps = "Contributi cassa inseriti manualmente (variano per ordine).";
    }

    var imponibile = Math.max(0, redditoLordo - contributi);
    var aliqImposta = startup ? F.impostaStartup : F.impostaOrdinaria;
    var imposta = imponibile * aliqImposta;
    var netto = ricavi - contributi - imposta;
    var pressione = ricavi > 0 ? (contributi + imposta) / ricavi : 0;

    // Avviso soglia.
    var notaSoglia = "";
    if (ricavi > F.sogliaUscitaImmediata) notaSoglia = "Oltre 100.000 € di ricavi: fuoriuscita immediata dal forfettario.";
    else if (ricavi > F.sogliaRicavi) notaSoglia = "Oltre 85.000 €: uscita dal regime dall'anno successivo.";

    return {
      netto: netto,
      ricavi: ricavi,
      redditoImponibile: imponibile,
      redditoLordo: redditoLordo,
      contributiInps: contributi,
      impostaSostitutiva: imposta,
      aliquotaImposta: aliqImposta,
      coeffApplicato: coeff,
      pressione: pressione,
      notaInps: notaInps,
      notaSoglia: notaSoglia,
    };
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("forfettario-v1", calcolaForfettario);
  }
  root.__calcolaForfettario = calcolaForfettario;
})(typeof window !== "undefined" ? window : globalThis);
