/**
 * CONVERTITORE VALUTA — funzione pura. Legge i tassi da globalThis.VALUTE
 * (base EUR: rates[X] = unità di X per 1 EUR), popolato da valute-2026-07.js
 * (fallback) e aggiornato live da valute-live.js. Conversione via EUR:
 *   valoreInEuro = importo / rate[da];  risultato = valoreInEuro * rate[a].
 * Funzione pura rispetto a (input, VALUTE): stesso stato ⇒ stesso output.
 */
(function (root) {
  function nf(dec) {
    return new Intl.NumberFormat("it-IT", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
      useGrouping: "always",
    });
  }

  function simbolo(V, code) {
    return (V.info && V.info[code] && V.info[code].simbolo) || code;
  }

  function convertiValuta(input) {
    var V = (typeof window !== "undefined" ? window : root).VALUTE || { rates: {}, info: {} };
    var importo = Number(input.importo);
    var da = String(input.da || "EUR");
    var a = String(input.a || "USD");
    var rDa = V.rates && V.rates[da];
    var rA = V.rates && V.rates[a];

    if (!isFinite(importo) || !rDa || !rA) {
      return { risultato: "—", tasso: "—", inverso: "—", dataTasso: "—", valoreNum: NaN };
    }

    var valoreInEuro = importo / rDa;
    var out = valoreInEuro * rA;
    var unitario = rA / rDa; // 1 `da` = unitario `a`

    var simA = simbolo(V, a);
    var simDa = simbolo(V, da);
    // Valute con decimali "grossi" (JPY, KRW, HUF, IDR...) → 0 decimali sarebbe
    // impreciso per il tasso; teniamo 2 decimali sull'importo, 4 sul tasso.
    var risultato = nf(2).format(out) + " " + simA + " (" + a + ")";
    var tasso = "1 " + da + " = " + nf(4).format(unitario) + " " + a;
    var inverso = "1 " + a + " = " + nf(4).format(1 / unitario) + " " + da;
    var dataTasso = (V.date || "—") + " · " + (V.source || "indicativo");

    return {
      risultato: risultato,
      valoreNum: out,
      tasso: tasso,
      inverso: inverso,
      dataTasso: dataTasso,
      simboloA: simA,
      simboloDa: simDa,
    };
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("valuta-v1", convertiValuta);
  }
  root.__convertiValuta = convertiValuta;
})(typeof window !== "undefined" ? window : globalThis);
