/**
 * SEARCH — filtro client-side dell'indice strumenti.
 * Condiviso dalla home (quattro aree troncate) e dalle quattro pagine area
 * (elenco esteso di una sola categoria). Non fa fetch e non costruisce nulla:
 * gli strumenti sono già tutti nell'HTML statico per il SEO, qui si limita a
 * nascondere le righe che non corrispondono.
 *
 * Contratto DOM:
 *   [data-search-input]   input di ricerca (uno per pagina)
 *   [data-search-scope]   sezione nascondibile quando non ha più risultati
 *   [data-search-list]    contenitore delle righe
 *   li[data-search]       riga cercabile (il testo indicizzato sta nell'attributo)
 *   [data-search-count]   riga di conteggio (opzionale)
 *   [data-search-empty]   messaggio "nessun risultato" (opzionale)
 *
 * Mentre la ricerca è attiva viene impostato body[data-searching="true"]:
 * il CSS lo usa per togliere il troncamento e l'offuscamento degli elenchi
 * della home, così i risultati oltre il taglio tornano leggibili.
 */
(function () {
  var input = document.querySelector("[data-search-input]");
  if (!input) return;

  var scopes = [].slice.call(document.querySelectorAll("[data-search-scope]"));
  var countEl = document.querySelector("[data-search-count]");
  var emptyEl = document.querySelector("[data-search-empty]");
  var countIdle = countEl ? countEl.textContent : "";
  var total = document.querySelectorAll("[data-search-list] li[data-search]").length;

  /** Minuscolo + accenti rimossi: "velocità" e "velocita" devono coincidere. */
  function norm(s) {
    s = String(s || "").toLowerCase();
    return s.normalize ? s.normalize("NFD").replace(/[̀-ͯ]/g, "") : s;
  }

  /** Conteggio come nodi DOM: mai innerHTML, il termine cercato è input utente. */
  function setCount(n) {
    if (!countEl) return;
    countEl.textContent = "";
    var b = document.createElement("b");
    b.textContent = String(n);
    countEl.appendChild(b);
    countEl.appendChild(document.createTextNode(" " + (n === 1 ? "strumento" : "strumenti") + " su " + total));
  }

  function apply() {
    var q = norm(input.value).trim();
    var terms = q ? q.split(/\s+/) : [];
    var shown = 0;
    var lastHref = "";

    scopes.forEach(function (scope) {
      var items = [].slice.call(scope.querySelectorAll("[data-search-list] li[data-search]"));
      var visible = 0;
      items.forEach(function (li) {
        var hay = li.getAttribute("data-search") || "";
        // AND su tutti i termini: "conv peso" trova "convertitore peso".
        var match = true;
        for (var i = 0; i < terms.length; i++) {
          if (hay.indexOf(terms[i]) === -1) { match = false; break; }
        }
        li.hidden = !match;
        if (match) {
          visible++;
          var a = li.querySelector("a[href]");
          if (a) lastHref = a.getAttribute("href");
        }
      });
      // Una sezione senza risultati sparisce, ma solo durante una ricerca:
      // a campo vuoto tutte le sezioni tornano visibili (anche se vuote).
      scope.hidden = terms.length > 0 && visible === 0;
      shown += visible;
    });

    document.body.setAttribute("data-searching", terms.length ? "true" : "false");
    if (emptyEl) emptyEl.setAttribute("data-show", String(terms.length > 0 && shown === 0));

    if (countEl) {
      if (!terms.length) countEl.innerHTML = countIdle;
      else if (shown === 0) countEl.textContent = "Nessuno strumento corrisponde a « " + input.value.trim() + " »";
      else countEl.innerHTML = "<b>" + shown + "</b> " + (shown === 1 ? "strumento" : "strumenti") + " su " + total;
    }

    input.setAttribute("data-single", shown === 1 && terms.length ? lastHref : "");
  }

  input.addEventListener("input", apply);

  // Invio su un risultato unico: apre direttamente lo strumento.
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      input.value = "";
      apply();
      input.blur();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      var href = input.getAttribute("data-single");
      if (href) window.location.href = href;
    }
  });

  // "/" mette il fuoco sulla ricerca da qualunque punto della pagina.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    var tag = t && t.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || (t && t.isContentEditable)) return;
    e.preventDefault();
    input.focus();
    input.select();
  });

  // Ripristino stato al ritorno indietro col campo già compilato dal browser.
  if (input.value) apply();
})();
