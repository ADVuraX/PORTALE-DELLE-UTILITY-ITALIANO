/**
 * INTERESSI LEGALI — funzione pura. Misure in /assets/js/data/interessi-legali.js.
 *
 * Interesse semplice, giorno per giorno: ogni giorno dopo la data iniziale e
 * fino alla data finale compresa matura al saggio in vigore quel giorno.
 * Formula dell'Agenzia delle Entrate per ogni periodo a tasso costante:
 *   interessi = capitale × tasso × giorni / 36.500   (365 anche nei bisestili)
 * Niente capitalizzazione (art. 1283 c.c.) e niente tasso «processuale» del
 * comma 4 dell'art. 1284 c.c. dopo la domanda giudiziale.
 */
(function (root) {
  var GIORNO = 86400000;

  function calcolaInteressi(input) {
    var D = root.INTERESSI_LEGALI;
    var capitale = Math.max(0, Number(input.capitale) || 0);
    var dal = giorno(input.dal), al = giorno(input.al);
    var vuoto = { interessi: NaN, totale: NaN, giorni: NaN, tassoMedio: NaN, periodi: "—", righe: [] };

    var primo = giorno(D.misure[0].dal), ultimo = giorno(D.notoFino);
    var errore = null;
    if (dal === null || al === null) errore = "Indica le due date";
    else if (al <= dal) errore = "La data finale deve venire dopo quella iniziale";
    else if (dal + 1 < primo) errore = "La tabella parte dal " + it(primo) + " (10%)";
    else if (al > ultimo) errore = "Il tasso dopo il " + it(ultimo) + " non è ancora stato fissato";
    if (errore) { vuoto.interessiLabel = errore; return vuoto; }

    // Periodi a tasso costante: [inizio, fine] in giorni, estremi compresi.
    var righe = [], totale = 0;
    for (var i = 0; i < D.misure.length; i++) {
      var inizio = giorno(D.misure[i].dal);
      var fine = i + 1 < D.misure.length ? giorno(D.misure[i + 1].dal) - 1 : ultimo;
      var da = Math.max(inizio, dal + 1), a = Math.min(fine, al);
      if (a < da) continue;
      var gg = a - da + 1;
      var interesse = capitale * D.misure[i].tasso * gg / 36500;
      righe.push({ da: da, a: a, giorni: gg, tasso: D.misure[i].tasso, interessi: interesse });
      totale += interesse;
    }
    var giorni = al - dal;

    return {
      interessi: totale,
      totale: capitale + totale,
      giorni: giorni,
      // Tasso annuo equivalente sull'intero periodo (frazione: 0,02 = 2%).
      tassoMedio: capitale > 0 ? totale / capitale * 365 / giorni : NaN,
      periodi: righe.map(function (r) {
        return "dal " + it(r.da) + " al " + it(r.a) + ": " + r.giorni + (r.giorni === 1 ? " giorno" : " giorni")
          + " " + alTasso(r.tasso) + " → " + euro(r.interessi);
      }).join("\n"),
      righe: righe,
    };
  }

  /** "aaaa-mm-gg" → numero del giorno (UTC), o null. */
  function giorno(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
    if (!m) return null;
    var t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    var d = new Date(t);
    if (d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
    return t / GIORNO;
  }
  function it(n) {
    var d = new Date(n * GIORNO);
    return pad(d.getUTCDate()) + "/" + pad(d.getUTCMonth() + 1) + "/" + d.getUTCFullYear();
  }
  function pad(x) { return (x < 10 ? "0" : "") + x; }
  function pct(x) { return x.toLocaleString("it-IT", { maximumFractionDigits: 2 }) + "%"; }
  /** «al 5%», «all'1,6%», «all'8%», «allo 0,5%»: l'articolo segue la pronuncia del numero. */
  function alTasso(x) {
    var s = pct(x);
    if (s.charAt(0) === "0") return "allo " + s;
    if (/^(1(,|%)|11|8)/.test(s)) return "all'" + s;
    return "al " + s;
  }
  function euro(x) {
    return x.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" }) + " €";
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("interessi-legali-v1", calcolaInteressi);
  }
})(typeof window !== "undefined" ? window : globalThis);
