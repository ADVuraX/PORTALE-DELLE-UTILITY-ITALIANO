/**
 * TASSI DI CAMBIO LIVE — aggiornamento client-side dei tassi bundled.
 * Fonte primaria: Banca Centrale Europea via Frankfurter (nessuna chiave, CORS
 * ok). Se la chiamata riesce, sovrascrive globalThis.VALUTE.rates con l'ultimo
 * dato BCE e ri-triggera il calcolo. In caso di errore resta il fallback
 * statico di valute-2026-07.js: il convertitore funziona comunque (offline/no
 * rete), semplicemente con tassi "indicativi".
 *
 * Frankfurter copre ~29 valute BCE. Le extra (RUB/AED/SAR) restano al valore
 * bundled. Se Frankfurter fallisce si tenta open.er-api.com (multi-fonte, 161
 * valute) come backup.
 */
(function () {
  var PRIMARY = "https://api.frankfurter.dev/v1/latest?base=EUR";
  var BACKUP = "https://open.er-api.com/v6/latest/EUR";

  function apply(rates, date, source) {
    var V = (window.VALUTE = window.VALUTE || { rates: {} });
    V.rates = V.rates || {};
    for (var k in rates) {
      if (Object.prototype.hasOwnProperty.call(rates, k)) V.rates[k] = rates[k];
    }
    V.rates.EUR = 1;
    if (date) V.date = date;
    V.source = source;
    retrigger();
  }

  // Ri-lancia il calcolo simulando un input sul form del tool.
  function retrigger() {
    var form = document.querySelector("[data-tool-form]");
    if (!form) return;
    var el = form.querySelector("input, select");
    if (el) el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function fromFrankfurter() {
    return fetch(PRIMARY)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        if (!d || !d.rates) return Promise.reject();
        apply(d.rates, d.date, "BCE · live");
      });
  }

  function fromBackup() {
    return fetch(BACKUP)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        if (!d || !d.rates) return Promise.reject();
        var date = "";
        if (d.time_last_update_utc) {
          var dt = new Date(d.time_last_update_utc);
          if (!isNaN(dt)) date = dt.toISOString().slice(0, 10);
        }
        apply(d.rates, date, "multi-fonte · live");
      });
  }

  function refresh() {
    fromFrankfurter().catch(function () {
      fromBackup().catch(function () { /* resta il fallback statico bundled */ });
    });
  }

  if (document.readyState !== "loading") refresh();
  else document.addEventListener("DOMContentLoaded", refresh);
})();
