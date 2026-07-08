/**
 * RUNTIME — piccola libreria condivisa lato browser.
 * Le PAGINE sono statiche (generate a build-time da scripts/build.mjs):
 * tutto il contenuto testuale è già nell'HTML per il SEO. Questo runtime
 * fa SOLO la parte interattiva del tool: legge gli input, chiama la
 * funzione di calcolo registrata e scrive gli output.
 *
 * Ogni calcolatore (public/assets/js/calculators/{file}.js) si registra
 * con: registerCalculator("logicId", fn). La pagina include un blocco
 * <script type="application/json" data-tool-config> con la mappa
 * input/output, così qui non si duplica nulla del config.
 */
(function () {
  var registry = (window.__CALC__ = window.__CALC__ || {});

  window.registerCalculator = function (logicId, fn) {
    registry[logicId] = fn;
  };

  function format(value, fmt) {
    if (value === undefined || value === null || (typeof value === "number" && !isFinite(value))) return "—";
    // useGrouping:"always" — in it-IT il default non separa le migliaia sotto i
    // 10.000 (1819 → "1819"); per un tool finanziario vogliamo sempre "1.819".
    if (fmt === "currency") return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" }).format(value);
    if (fmt === "percent") return new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 1 }).format(value);
    if (fmt === "number") return new Intl.NumberFormat("it-IT", { useGrouping: "always" }).format(value);
    return String(value);
  }

  function initTool(root) {
    var cfgEl = root.querySelector("script[data-tool-config]");
    if (!cfgEl) return;

    var cfg;
    try { cfg = JSON.parse(cfgEl.textContent); }
    catch (e) { console.error("tool-config JSON non valido", e); return; }

    var form = root.querySelector("[data-tool-form]");
    var fn = registry[cfg.logicId];
    if (!form || typeof fn !== "function") {
      console.warn("Calcolatore non registrato o form assente:", cfg.logicId);
      return;
    }

    // Mappa id -> type, per leggere/valutare i valori in modo tipizzato.
    var typeById = {};
    cfg.inputs.forEach(function (i) { typeById[i.id] = i.type; });

    // Elemento "sonda" di un input (per posizione nel DOM e stato di visibilità).
    function probe(id) {
      return typeById[id] === "radio"
        ? form.querySelector('input[name="in-' + id + '"]')
        : form.querySelector("#in-" + id);
    }

    // Valore tipizzato di un input: number->Number, checkbox->boolean,
    // radio/select/text->string. select stringa NON più forzato a NaN.
    function valueOf(id) {
      var type = typeById[id];
      if (type === "radio") {
        var r = form.querySelector('input[name="in-' + id + '"]:checked');
        return r ? r.value : undefined;
      }
      var el = form.querySelector("#in-" + id);
      if (!el) return undefined;
      if (type === "checkbox") return el.checked;
      if (type === "number") return Number(el.value);
      return el.value;
    }

    // Campi condizionali: mostra/nasconde ogni [data-showif] confrontando
    // il valore dell'input di riferimento con `equals`.
    function applyConditionals() {
      var conds = form.querySelectorAll("[data-showif]");
      for (var i = 0; i < conds.length; i++) {
        var cond;
        try { cond = JSON.parse(conds[i].getAttribute("data-showif")); }
        catch (e) { continue; }
        conds[i].hidden = String(valueOf(cond.input)) !== String(cond.equals);
      }
    }

    function readValues() {
      var values = {};
      cfg.inputs.forEach(function (input) {
        var p = probe(input.id);
        if (!p) return;
        var group = p.closest("[data-showif]");
        if (group && group.hidden) return; // campo nascosto: escluso dal calcolo
        values[input.id] = valueOf(input.id);
      });
      return values;
    }

    function signed(value, kind, fmt, provisional) {
      if (provisional && !value) return "—";
      if (kind === "out") return "−" + format(Math.abs(value), fmt);
      if (kind === "in") return "+" + format(Math.abs(value), fmt);
      return format(value, fmt); // gross / total: senza segno
    }

    function fill(id, text) {
      var el = root.querySelector('[data-out="' + id + '"]');
      if (el) el.textContent = text;
    }

    // --- Animazioni (chicche). Tutto degrada a "istantaneo" con reduced-motion. ---
    var resultCard = root.querySelector("[data-result-card]") || root.querySelector(".result");
    var primaryEl = root.querySelector("[data-out-primary]");
    var REDUCE = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var NUMERIC = { currency: 1, percent: 1, number: 1 };
    var prevPrimary = null;   // ultimo valore numerico mostrato (per il count-up)
    var firstRun = true;
    var rafId = 0, flashTimer = 0;

    // Conta da `from` a `to`, formattando ogni frame. Reduced-motion o valori
    // non finiti => salto diretto al valore finale.
    function countUp(el, from, to, fmt) {
      if (rafId) cancelAnimationFrame(rafId);
      if (REDUCE || from == null || !isFinite(from) || !isFinite(to) || from === to) {
        el.textContent = format(to, fmt);
        return;
      }
      var dur = 450, t0 = null;
      function frame(ts) {
        if (t0 == null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = format(from + (to - from) * e, fmt);
        if (p < 1) rafId = requestAnimationFrame(frame);
        else { rafId = 0; el.textContent = format(to, fmt); }
      }
      rafId = requestAnimationFrame(frame);
    }

    // Pop del valore + sheen ("glitter") sull'underline a ogni ricalcolo.
    function flash() {
      if (REDUCE || !resultCard) return;
      resultCard.classList.remove("is-flash");
      void resultCard.offsetWidth; // reflow: ri-arma l'animazione CSS
      resultCard.classList.add("is-flash");
      if (flashTimer) clearTimeout(flashTimer);
      flashTimer = setTimeout(function () { resultCard.classList.remove("is-flash"); }, 850);
    }

    function run() {
      applyConditionals();
      var out = fn(readValues());

      if (primaryEl && cfg.outputPrimary) {
        var pv = out[cfg.outputPrimary.id];
        var fmt = cfg.outputPrimary.format;
        if (NUMERIC[fmt] && typeof pv === "number" && isFinite(pv)) {
          countUp(primaryEl, prevPrimary == null ? 0 : prevPrimary, pv, fmt);
          prevPrimary = pv;
        } else {
          primaryEl.textContent = format(pv, fmt);
          prevPrimary = typeof pv === "number" ? pv : null;
        }
      }
      if (Array.isArray(cfg.outputSecondary)) {
        cfg.outputSecondary.forEach(function (o) { fill(o.id, format(out[o.id], o.format)); });
      }
      if (Array.isArray(cfg.breakdown)) {
        cfg.breakdown.forEach(function (b) { fill(b.id, signed(out[b.id], b.kind, b.format, b.provisional)); });
      }
      if (Array.isArray(cfg.extras)) {
        cfg.extras.forEach(function (e) { fill(e.id, format(out[e.id], e.format)); });
      }

      if (firstRun) {
        firstRun = false;
        if (resultCard && !REDUCE) requestAnimationFrame(function () { resultCard.classList.add("is-ready"); });
        else if (resultCard) resultCard.classList.add("is-ready");
      }
      flash();
    }

    form.addEventListener("input", run);
    form.addEventListener("change", run);
    run();
  }

  function initAll() {
    var tools = document.querySelectorAll("[data-tool]");
    for (var i = 0; i < tools.length; i++) initTool(tools[i]);
  }

  if (document.readyState !== "loading") initAll();
  else document.addEventListener("DOMContentLoaded", initAll);
})();
