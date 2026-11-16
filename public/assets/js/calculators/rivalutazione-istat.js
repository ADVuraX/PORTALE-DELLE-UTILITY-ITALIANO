/**
 * RIVALUTAZIONE ISTAT DEL CANONE — funzione pura. Dati in /assets/js/data/istat-foi.js.
 *
 * Metodo della nota ISTAT sulle rivalutazioni monetarie:
 *   rapporto   R = indice di arrivo / indice di partenza × raccordi fra basi
 *              (un coefficiente per ogni cambio di base dopo il mese di partenza)
 *   variazione V = R × 100 − 100, arrotondata a un decimale
 *   coefficiente di rivalutazione = R arrotondato a tre decimali
 * Il canone si aggiorna con la quota della variazione scelta (75% è il limite
 * dell'art. 32 L. 392/1978 e dell'art. 1 c. 9 D.M. 16/01/2017):
 *   nuovo canone = canone × (1 + V × quota / 10.000)
 */
(function (root) {
  var MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio",
    "agosto", "settembre", "ottobre", "novembre", "dicembre"];

  function calcolaRivalutazione(input) {
    var F = root.FOI;
    var canone = Math.max(0, Number(input.canone) || 0);
    var quota = Math.min(100, Math.max(0, Number(input.quota)));
    if (!isFinite(quota)) quota = 75;
    var da = mese(input.annoDa, input.meseDa), a = mese(input.annoA, input.meseA);

    var vuoto = { nuovo: NaN, aumento: NaN, aumentoAnnuo: NaN, variazione: "—", applicata: "—", coefficiente: "—", indici: "—" };
    var primo = F.basi[0].da, ultimo = F.aggiornato;
    var errore = null;
    if (!da || !a) errore = "Indica mese e anno di partenza e di arrivo";
    else if (da < primo) errore = "La serie dell'ISTAT qui parte da gennaio 1996";
    else if (a > ultimo) errore = "Indice di " + nome(a) + " non ancora pubblicato: l'ultimo è " + nome(ultimo);
    else if (a <= da) errore = "Il mese di arrivo deve venire dopo quello di partenza";
    if (errore) { vuoto.nuovoLabel = errore; return vuoto; }

    var iDa = indice(F, da), iA = indice(F, a);
    var raccordi = F.basi.filter(function (b) { return b.raccordo && b.da > da && b.da <= a; });
    var rapporto = iA / iDa;
    raccordi.forEach(function (b) { rapporto *= b.raccordo; });

    var variazione = arrotonda(rapporto * 100 - 100, 1);
    var applicata = variazione * quota / 100;
    var nuovo = canone * (1 + applicata / 100);

    var testoIndici = nome(da) + ": " + num(iDa, 1, 1) + " (base " + base(F, da) + ") → " + nome(a) + ": " + num(iA, 1, 1) + " (base " + base(F, a) + ")";
    if (raccordi.length) testoIndici += "; raccordi " + raccordi.map(function (b) { return num(b.raccordo, 3, 3); }).join(" × ");

    return {
      nuovo: nuovo,
      nuovoLabel: "Canone aggiornato da " + nome(a),
      aumento: nuovo - canone,
      aumentoAnnuo: (nuovo - canone) * 12,
      variazione: segno(variazione) + num(Math.abs(variazione), 1, 1) + "%",
      applicata: segno(applicata) + num(Math.abs(applicata), 1, 3) + "% (" + num(quota, 0, 2) + "% di " + segno(variazione) + num(Math.abs(variazione), 1, 1) + "%)",
      coefficiente: num(arrotonda(rapporto, 3), 3, 3),
      indici: testoIndici,
      variazioneNumero: variazione,
    };
  }

  /** "2026-09" da anno e mese (1–12), o null. */
  function mese(anno, m) {
    anno = Math.floor(Number(anno)); m = Math.floor(Number(m));
    if (!(anno >= 1900 && anno <= 2999) || !(m >= 1 && m <= 12)) return null;
    return anno + "-" + (m < 10 ? "0" : "") + m;
  }
  function indice(F, ym) {
    var p = ym.split("-");
    return F.serie[Number(p[0])][Number(p[1]) - 1];
  }
  function base(F, ym) {
    var b = F.basi[0].base;
    F.basi.forEach(function (x) { if (x.da <= ym) b = x.base; });
    return b;
  }
  function nome(ym) {
    var p = ym.split("-");
    return MESI[Number(p[1]) - 1] + " " + p[0];
  }
  function arrotonda(x, d) {
    var f = Math.pow(10, d);
    // Il piccolo epsilon evita che 33,55 diventi 33,5 per l'errore della virgola mobile.
    return Math.sign(x) * Math.round(Math.abs(x) * f + 1e-9) / f;
  }
  function segno(x) { return x > 0 ? "+" : x < 0 ? "−" : ""; }
  function num(x, min, max) {
    return x.toLocaleString("it-IT", { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: "always" });
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("istat-affitto-v1", calcolaRivalutazione);
  }
})(typeof window !== "undefined" ? window : globalThis);
