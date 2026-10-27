/**
 * TREDICESIMA — funzione pura. Costanti in /assets/js/data/fisco-2026.js.
 *
 *  1. Maturato: tanti dodicesimi della mensilità quanti i mesi di servizio
 *     (concordato 27/10/1946 art. 17, reso obbligatorio dal DPR 1070/1960).
 *  2. Contributi INPS a carico del lavoratore con l'aliquota del rapporto: la
 *     tredicesima è reddito di lavoro dipendente anche ai fini contributivi
 *     (L. 153/1969 art. 12).
 *  3. Ritenuta IRPEF delle mensilità aggiuntive (DPR 600/1973 art. 23 c. 2
 *     lett. b): aliquote IRPEF con gli scaglioni annui ragguagliati a mese,
 *     SENZA le detrazioni che si applicano allo stipendio (lett. a). Il
 *     conguaglio di fine anno (c. 3) ricalcola l'imposta sull'intero anno.
 *
 * Perimetro: niente contributo aggiuntivo dell'1% oltre 56.224 € annui,
 * niente addizionali, taglio del cuneo e trattamento integrativo.
 */
(function () {
  function calcolaTredicesima(input) {
    var F = (typeof window !== "undefined" ? window : globalThis).FISCO["2026"];
    var mensile = Math.max(0, Number(input.lordoMensile) || 0);
    var mesi = Math.min(12, Math.max(0, Math.floor(Number(input.mesi) || 0)));
    var tipo = input.tipoLavoratore || "privato";

    var lordo = mensile * mesi / 12;
    var aliquotaInps = (F.inps.perTipo && F.inps.perTipo[tipo]) || F.inps.aliquota;
    var contributi = lordo * aliquotaInps;
    var imponibile = lordo - contributi;

    // Scaglioni annui ragguagliati a mese: 28.000 / 12, 50.000 / 12.
    var irpef = 0, prev = 0, parti = [];
    F.irpef.scaglioni.forEach(function (s) {
      var fino = s.fino / 12;
      if (imponibile > prev) {
        var quota = Math.min(imponibile, fino) - prev;
        irpef += quota * s.aliquota;
        parti.push(euro(quota) + " al " + Math.round(s.aliquota * 100) + "%");
      }
      prev = fino;
    });

    var netto = imponibile - irpef;
    return {
      lordo: lordo,
      contributi: contributi,
      irpef: irpef,
      netto: netto,
      imponibile: imponibile,
      aliquotaMedia: imponibile > 0 ? irpef / imponibile : 0,
      scaglioniMese: parti.length ? parti.join(" + ") : "—",
    };
  }

  function euro(x) {
    return x.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" }) + " €";
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("tredicesima-v1", calcolaTredicesima);
  }
})();
