/**
 * SCORPORO E CALCOLO DELL'IVA — funzione pura.
 *
 * Aliquote: 22% ordinaria, ridotte 4%, 5% e 10% (art. 16 DPR 633/1972; dal
 * 1° gennaio 2027 art. 34 del Testo unico IVA, D.Lgs. 10/2026, stesse misure).
 * Imposta e imponibile si arrotondano al centesimo di euro, come in fattura
 * (art. 21 c. 2 lett. l DPR 633/1972); il mezzo centesimo va per eccesso.
 *
 *  - scorpora: dal prezzo con IVA → imponibile = prezzo / (1 + aliquota),
 *    IVA = prezzo − imponibile (così le due parti sommano sempre al prezzo);
 *  - aggiungi: dall'imponibile → IVA = imponibile × aliquota, totale = somma.
 */
(function (root) {
  /** Arrotonda al centesimo, mezzo centesimo per eccesso (anche contro l'errore binario di 1,005 × 100). */
  function cent(x) {
    var s = x < 0 ? -1 : 1;
    return s * Math.round(Math.abs(x) * 100 + 1e-7) / 100;
  }
  function euro(x) {
    return x.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" }) + " €";
  }
  function num(x, min, max) {
    return x.toLocaleString("it-IT", { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: "always" });
  }

  function calcolaIva(input) {
    var modo = input.modalita === "aggiungi" ? "aggiungi" : "scorpora";
    var perc = input.aliquota === "altra" ? Number(input.aliquotaAltra) : Number(input.aliquota);
    var importo = cent(Number(input.importo) || 0);
    if (!(perc >= 0 && perc <= 100)) {
      return { risultato: NaN, imponibile: NaN, iva: NaN, totale: NaN, aliquotaApplicata: NaN, conto: "Aliquota non valida (fra 0 e 100%)" };
    }
    var a = perc / 100;
    var imponibile, iva, totale, conto;
    if (modo === "scorpora") {
      totale = importo;
      imponibile = cent(totale / (1 + a));
      iva = cent(totale - imponibile);
      conto = euro(totale) + " ÷ " + num(1 + a, 2, 4) + " = " + euro(imponibile) + " · IVA " + euro(iva);
    } else {
      imponibile = importo;
      iva = cent(imponibile * a);
      totale = cent(imponibile + iva);
      conto = euro(imponibile) + " × " + num(perc, 0, 2) + "% = " + euro(iva) + " · totale " + euro(totale);
    }
    return {
      risultato: modo === "scorpora" ? imponibile : totale,
      risultatoLabel: modo === "scorpora" ? "Imponibile (prezzo senza IVA)" : "Totale con IVA",
      imponibile: imponibile,
      iva: iva,
      totale: totale,
      aliquotaApplicata: a,
      conto: conto,
    };
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("iva-v1", calcolaIva);
  }
  root.__calcolaIva = calcolaIva;
})(typeof window !== "undefined" ? window : globalThis);
