/**
 * CALCOLO IRPEF 2026 — funzione pura. Costanti in /assets/js/data/fisco-2026.js.
 *
 *  1. Imposta lorda: scaglioni dell'art. 11 c. 1 TUIR (23% · 33% · 43%).
 *  2. Detrazione per tipo di reddito (art. 13 TUIR): lavoro dipendente (c. 1 e
 *     1.1), pensione (c. 3 e 3-bis), lavoro autonomo e impresa minore (c. 5 e
 *     5-ter); rapporti alle prime 4 cifre decimali (c. 6).
 *  3. Per il lavoro dipendente, ulteriore detrazione del taglio del cuneo
 *     (L. 207/2024 c. 6).
 *  4. Le detrazioni valgono fino a concorrenza dell'imposta lorda (art. 11 c. 3):
 *     l'IRPEF netta non scende sotto zero e l'eccedenza va persa.
 *
 * Perimetro: anno intero, nessun onere deducibile o detraibile, niente
 * detrazioni per familiari, niente addizionali regionali e comunali.
 */
(function () {
  function calcolaIrpef(input) {
    var F = (typeof window !== "undefined" ? window : globalThis).FISCO["2026"];
    var R = Math.max(0, Number(input.reddito) || 0);
    var tipo = input.tipo || "dipendente";

    // 1. Imposta lorda e dettaglio per scaglione.
    var lorda = 0, prev = 0, marginale = 0, parti = [];
    F.irpef.scaglioni.forEach(function (s) {
      if (R > prev) {
        var quota = Math.min(R, s.fino) - prev;
        lorda += quota * s.aliquota;
        marginale = s.aliquota;
        parti.push(euroIntero(quota * s.aliquota) + " al " + Math.round(s.aliquota * 100) + "%");
      }
      prev = s.fino;
    });

    // 2. Detrazione dell'art. 13 (teorica, prima della capienza).
    var det = 0;
    if (tipo === "dipendente") det = detrazioneLavoro(R, F.detrazioneLavoro);
    else if (tipo === "pensione") det = detrazioneTreFasce(R, F.detrazionePensione);
    else if (tipo === "autonomo") det = detrazioneTreFasce(R, F.detrazioneAutonomo);

    var dopoDet = Math.max(0, lorda - det);
    var detApplicata = lorda - dopoDet;

    // 3. Ulteriore detrazione del cuneo (solo lavoro dipendente), sull'imposta residua.
    var ulteriore = 0;
    if (tipo === "dipendente") {
      var c = F.cuneo.detrazione;
      if (R > c.da && R <= c.fissoFino) ulteriore = c.importo;
      else if (R > c.fissoFino && R < c.azzeraA) ulteriore = c.importo * ((c.azzeraA - R) / (c.azzeraA - c.fissoFino));
    }
    var ulterioreApplicata = Math.min(ulteriore, dopoDet);
    var netta = dopoDet - ulterioreApplicata;

    return {
      irpefLorda: lorda,
      detrazione: detApplicata,
      ulteriore: ulterioreApplicata,
      irpefNetta: netta,
      aliquotaMarginale: R > 0 ? marginale : 0,
      aliquotaMedia: R > 0 ? netta / R : 0,
      incapienza: Math.max(0, Math.round(((det - detApplicata) + (ulteriore - ulterioreApplicata)) * 100) / 100),
      scaglioni: parti.length ? parti.join(" + ") : "—",
    };
  }

  /** Art. 13 c. 1 e 1.1: lavoro dipendente (stessa tabella dello stipendio netto). */
  function detrazioneLavoro(R, d) {
    var x = 0;
    if (R <= 15000) x = d.fino15k;
    else if (R <= d.sup2) x = d.base2 + d.quota2 * troncaRapporto((d.sup2 - R) / d.ampiezza2, d.decimaliRapporto);
    else if (R <= d.sup3) x = d.base3 * troncaRapporto((d.sup3 - R) / d.ampiezza3, d.decimaliRapporto);
    if (R > d.maggiorazioneDa && R <= d.maggiorazioneA) x += d.maggiorazione;
    return x;
  }

  /** Art. 13 c. 3 (pensione) e c. 5 (autonomo): importo fisso, poi due fasce decrescenti. */
  function detrazioneTreFasce(R, d) {
    var x = 0;
    if (R <= d.fino) x = d.importoFino;
    else if (R <= d.sup2) x = d.base2 + d.quota2 * troncaRapporto((d.sup2 - R) / d.ampiezza2, d.decimaliRapporto);
    else if (R <= d.sup3) x = d.base3 * troncaRapporto((d.sup3 - R) / d.ampiezza3, d.decimaliRapporto);
    if (R > d.maggiorazioneDa && R <= d.maggiorazioneA) x += d.maggiorazione;
    return x;
  }

  /** Art. 13 c. 6: il rapporto si assume nelle prime n cifre decimali (troncato). */
  function troncaRapporto(x, n) {
    var p = Math.pow(10, n);
    return Math.floor(x * p + 1e-9) / p;
  }

  function euroIntero(x) {
    return Math.round(x).toLocaleString("it-IT", { useGrouping: "always" }) + " €";
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("irpef-v1", calcolaIrpef);
  }
})();
