/**
 * RATA DEL MUTUO — funzione pura. Ammortamento «alla francese», il più diffuso
 * in Italia secondo la guida della Banca d'Italia: rata costante, quota
 * interessi decrescente, quota capitale crescente.
 *
 *   tasso del periodo  i = TAN / rate per anno
 *   rata               R = C · i / (1 − (1 + i)^−n)      (R = C / n se i = 0)
 *   debito residuo     D_k = C · (1 + i)^k − R · ((1 + i)^k − 1) / i
 *
 * Con TAN 2,1%, 150.000 € e 240 rate mensili dà 765,95 € e una prima rata di
 * 262,50 € di interessi: l'esempio della guida della Banca d'Italia (766 €,
 * 263 € di interessi e 503 € di capitale). Fuori dal conto: spese, polizze,
 * imposte e tutto ciò che fa la differenza fra TAN e TAEG.
 */
(function (root) {
  var PERIODI = { mensile: 12, trimestrale: 4, semestrale: 2 };
  var NOME = { mensile: "Rata mensile", trimestrale: "Rata trimestrale", semestrale: "Rata semestrale" };

  function calcolaMutuo(input) {
    var C = Math.max(0, Number(input.importo) || 0);
    var tan = Math.max(0, Number(input.tan) || 0) / 100;
    var anni = Math.max(0, Number(input.durata) || 0);
    var per = PERIODI[input.periodicita] ? input.periodicita : "mensile";
    var m = PERIODI[per];
    var n = Math.round(anni * m);
    if (!(C > 0) || !(n > 0)) {
      return { rata: NaN, rataLabel: NOME[per], numeroRate: n, totaleInteressi: NaN, totaleRimborsato: NaN, primaCapitale: NaN, primaInteressi: NaN, residuoMeta: NaN, interessiSuCapitale: NaN };
    }
    var i = tan / m;
    var rata = i === 0 ? C / n : C * i / (1 - Math.pow(1 + i, -n));
    var totale = rata * n;
    var primaInteressi = C * i;
    var k = Math.floor(n / 2);
    var residuoMeta = i === 0 ? C - rata * k : C * Math.pow(1 + i, k) - rata * (Math.pow(1 + i, k) - 1) / i;

    return {
      rata: rata,
      rataLabel: NOME[per],
      numeroRate: n,
      totaleInteressi: totale - C,
      totaleRimborsato: totale,
      primaCapitale: rata - primaInteressi,
      primaInteressi: primaInteressi,
      residuoMeta: Math.max(0, residuoMeta),
      interessiSuCapitale: (totale - C) / C,
    };
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("mutuo-v1", calcolaMutuo);
  }
  root.__calcolaMutuo = calcolaMutuo;
})(typeof window !== "undefined" ? window : globalThis);
