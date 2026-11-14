/**
 * CODICE CATASTALE — funzione pura. Cerca nei due sensi nella tabella ISTAT
 * /assets/js/data/luoghi-catastali.js (globalThis.LUOGHI_CATASTALI):
 *  - da un codice (una lettera e tre cifre, es. H501) al comune o allo Stato;
 *  - da un nome (anche parziale) al codice, con la provincia per gli omonimi.
 * I comuni soppressi non sono nell'elenco dei comuni attivi.
 */
(function (root) {
  var MAX = 10;

  function chiave(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  var indice = null, caricati = -1;
  function luoghi() {
    var dati = (typeof window !== "undefined" ? window : globalThis).LUOGHI_CATASTALI || "";
    if (indice && caricati === dati.length) return indice;
    caricati = dati.length;
    indice = { voci: [], perCodice: {} };
    dati.split("\n").forEach(function (riga) {
      if (!riga) return;
      var p = riga.split("|");
      var v = { nome: p[0], sigla: p[1], codice: p[2], chiavi: [p[0]].concat(p[3] ? p[3].split(";") : []).map(chiave) };
      indice.voci.push(v);
      if (!indice.perCodice[v.codice]) indice.perCodice[v.codice] = v;
    });
    return indice;
  }

  function dove(v) {
    return v.sigla === "EE" ? "Stato estero" : "provincia " + v.sigla;
  }
  function riga(v) {
    return v.codice + " · " + v.nome + " (" + (v.sigla === "EE" ? "Stato estero" : v.sigla) + ")";
  }
  function vuoto(msg, altri) {
    return { risultato: msg, tipo: "—", altri: altri || "—", trovati: 0 };
  }

  function cercaCodiceCatastale(input) {
    var q = String(input.ricerca || "").trim();
    var pr = String(input.provincia || "").trim().toUpperCase();
    if (!q) return vuoto("Scrivi un codice (es. H501) o il nome di un comune o di uno Stato");
    var idx = luoghi();
    if (!idx.voci.length) return vuoto("Elenco dei luoghi non disponibile");

    // 1. Codice catastale: una lettera e tre cifre.
    var cod = q.toUpperCase().replace(/\s+/g, "");
    if (/^[A-Z]\d{3}$/.test(cod)) {
      var v = idx.perCodice[cod];
      if (!v) return vuoto(cod + ": codice non presente fra i comuni attivi e gli Stati esteri", "Può essere un comune soppresso o fuso con un altro, oppure un codice inesistente");
      return { risultato: riga(v), tipo: v.sigla === "EE" ? "Stato estero (codici che iniziano con Z)" : "Comune italiano, " + dove(v), altri: "—", trovati: 1 };
    }

    // 2. Nome: corrispondenze esatte, poi nomi che iniziano così, poi che lo contengono.
    var k = chiave(q);
    if (k.length < 2) return vuoto("Scrivi almeno due lettere del nome");
    var filtro = function (v) { return !pr || v.sigla === pr; };
    var esatti = idx.voci.filter(function (v) { return filtro(v) && v.chiavi.indexOf(k) >= 0; });
    var inizio = [], dentro = [];
    if (esatti.length === 0) {
      idx.voci.forEach(function (v) {
        if (!filtro(v)) return;
        if (v.chiavi.some(function (c) { return c.indexOf(k) === 0; })) inizio.push(v);
        else if (k.length >= 3 && v.chiavi.some(function (c) { return c.indexOf(k) > 0; })) dentro.push(v);
      });
    }
    var lista = esatti.length ? esatti : inizio.concat(dentro);
    if (!lista.length) return vuoto("Nessun comune o Stato trovato" + (pr ? " in provincia " + pr : ""), "Controlla l'ortografia o prova con l'inizio del nome");

    var primo = lista[0];
    var resto = lista.slice(1, MAX).map(riga);
    var oltre = lista.length > MAX ? "\n… e altri " + (lista.length - MAX) : "";
    var risultato = riga(primo);
    var tipo = primo.sigla === "EE" ? "Stato estero (codici che iniziano con Z)" : "Comune italiano, " + dove(primo);
    if (esatti.length > 1) {
      risultato = esatti.length + " luoghi con questo nome: indica la provincia";
      resto = esatti.slice(0, MAX).map(riga);
      tipo = "Omonimi";
    } else if (!esatti.length) {
      tipo = "Ricerca parziale: nessun nome identico";
    }
    return { risultato: risultato, tipo: tipo, altri: resto.length ? resto.join("\n") + oltre : "—", trovati: lista.length };
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("catastale-v1", cercaCodiceCatastale);
  }
  root.__cercaCodiceCatastale = cercaCodiceCatastale;
})(typeof window !== "undefined" ? window : globalThis);
