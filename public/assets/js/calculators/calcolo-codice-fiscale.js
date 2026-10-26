/**
 * CALCOLO DEL CODICE FISCALE — funzione pura. Applica il D.M. 23/12/1976:
 * art. 3 (cognome), art. 4 (nome), art. 5 (anno, mese, giorno + 40 per le
 * donne, codice del comune o dello Stato estero), art. 7 (carattere di
 * controllo). Il codice del luogo viene dalla tabella ISTAT in
 * /assets/js/data/luoghi-catastali.js (globalThis.LUOGHI_CATASTALI).
 *
 * Non applica l'omocodia (art. 6): le lettere al posto delle cifre le assegna
 * l'Agenzia delle Entrate solo quando due persone avrebbero lo stesso codice.
 * Per questo, e per eventuali errori anagrafici, l'unico codice valido resta
 * quello rilasciato dall'Agenzia.
 */
(function (root) {
  var ODD = {
    0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21,
    A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21,
    K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14,
    U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
  };
  var ALFA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var MESI = "ABCDEHLMPRST"; // gennaio = A … dicembre = T (art. 5)
  var VOCALI = "AEIOU";

  /** Lettere A–Z, senza accenti, spazi, apostrofi (artt. 3–4: un'unica successione). */
  function lettere(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
  }
  /** Chiave di ricerca di un luogo: come lettere(), ma tiene le cifre. */
  function chiave(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  /** Art. 3 e 4: tre caratteri da consonanti, poi vocali, poi X. */
  function tre(s, isNome) {
    var l = lettere(s), cons = "", voc = "";
    for (var i = 0; i < l.length; i++) {
      if (VOCALI.indexOf(l[i]) >= 0) voc += l[i]; else cons += l[i];
    }
    // Art. 4: nome con quattro o più consonanti → la prima, la terza e la quarta.
    if (isNome && cons.length >= 4) return cons[0] + cons[2] + cons[3];
    return (cons + voc + "XXX").slice(0, 3);
  }

  function controllo(cf15) {
    var s = 0;
    for (var i = 0; i < 15; i++) {
      var c = cf15[i];
      // Posizioni dispari (1ª, 3ª…) con la tabella art. 7 punto 2; pari: A/0 = 0 … Z = 25.
      s += i % 2 === 0 ? ODD[c] : (c >= "0" && c <= "9" ? Number(c) : c.charCodeAt(0) - 65);
    }
    return ALFA[s % 26];
  }

  // --- Tabella dei luoghi, indicizzata alla prima chiamata ---
  var indice = null;
  function luoghi() {
    if (indice) return indice;
    indice = { perChiave: {}, perCodice: {} };
    var dati = (typeof window !== "undefined" ? window : globalThis).LUOGHI_CATASTALI || "";
    dati.split("\n").forEach(function (riga) {
      if (!riga) return;
      var p = riga.split("|");
      var voce = { nome: p[0], sigla: p[1], codice: p[2] };
      var nomi = [p[0]].concat(p[3] ? p[3].split(";") : []);
      nomi.forEach(function (n) {
        var k = chiave(n);
        if (!k) return;
        var lista = indice.perChiave[k] || (indice.perChiave[k] = []);
        if (lista.indexOf(voce) < 0) lista.push(voce);
      });
      if (!indice.perCodice[voce.codice]) indice.perCodice[voce.codice] = voce;
    });
    return indice;
  }

  function descrivi(v) {
    return v.nome + (v.sigla === "EE" ? " (Stato estero)" : " (" + v.sigla + ")") + " · codice " + v.codice;
  }

  /** Trova il luogo: nome di comune o Stato, eventualmente con la provincia, oppure il codice. */
  function trovaLuogo(testo, provincia) {
    var t = String(testo || "").trim();
    var pr = String(provincia || "").trim().toUpperCase();
    var m = t.match(/^(.*?)\s*\(([A-Za-z]{2})\)$/); // "Castro (LE)"
    if (m) { t = m[1]; pr = pr || m[2].toUpperCase(); }
    if (!t) return { errore: "Indica il comune o lo Stato estero di nascita" };

    var idx = luoghi();
    var cod = t.toUpperCase().replace(/\s+/g, "");
    if (/^[A-Z]\d{3}$/.test(cod)) {
      var noto = idx.perCodice[cod];
      return { codice: cod, descrizione: noto ? descrivi(noto) : "Codice " + cod + " inserito a mano (non presente fra i comuni attivi e gli Stati esteri)" };
    }

    var k = chiave(t);
    var cand = idx.perChiave[k] || [];
    if (pr) cand = cand.filter(function (v) { return v.sigla === pr; });
    if (cand.length === 1) return { codice: cand[0].codice, descrizione: descrivi(cand[0]) };
    if (cand.length > 1) {
      return { errore: "Più luoghi si chiamano così: " + cand.map(function (v) { return v.nome + " (" + v.sigla + ")"; }).join(", ") + ". Indica la provincia." };
    }
    // Nessuna corrispondenza esatta: suggerisci i nomi che iniziano così.
    var simili = [];
    if (k.length >= 3) {
      for (var key in idx.perChiave) {
        if (key.indexOf(k) === 0) {
          idx.perChiave[key].forEach(function (v) {
            if ((!pr || v.sigla === pr) && simili.length < 6) simili.push(v.nome + " (" + v.sigla + ")");
          });
          if (simili.length >= 6) break;
        }
      }
    }
    return {
      errore: "Luogo non trovato" + (pr ? " in provincia " + pr : "") + (simili.length ? ". Forse: " + simili.join(", ") : "") +
        ". Se il comune non esiste più, scrivi il suo codice catastale (4 caratteri, es. H501).",
    };
  }

  function vuoto(msg) {
    return { codice: msg, luogo: "—", composizione: "—", valido: false };
  }

  function calcolaCodiceFiscale(input) {
    var cognome = lettere(input.cognome), nome = lettere(input.nome);
    if (!cognome || !nome) return vuoto("Inserisci cognome e nome");

    var giorno = Math.floor(Number(input.giorno)), mese = Math.floor(Number(input.mese)), anno = Math.floor(Number(input.anno));
    var annoCorrente = new Date().getFullYear();
    if (!(anno >= 1800 && anno <= annoCorrente)) return vuoto("Anno di nascita non valido (fra 1800 e " + annoCorrente + ")");
    if (!(mese >= 1 && mese <= 12)) return vuoto("Scegli il mese di nascita");
    var giorniMese = new Date(Date.UTC(anno, mese, 0)).getUTCDate();
    if (!(giorno >= 1 && giorno <= giorniMese)) return vuoto("Giorno di nascita non valido per il mese scelto");

    var luogo = trovaLuogo(input.luogo, input.provincia);
    if (luogo.errore) return { codice: "Luogo di nascita da completare", luogo: luogo.errore, composizione: "—", valido: false };

    var femmina = input.sesso === "F";
    var parti = [
      tre(input.cognome, false),
      tre(input.nome, true),
      String(anno % 100).padStart(2, "0"),
      MESI[mese - 1],
      String(giorno + (femmina ? 40 : 0)).padStart(2, "0"),
      luogo.codice,
    ];
    var cf15 = parti.join("");
    var cc = controllo(cf15);
    return {
      codice: cf15 + cc,
      luogo: luogo.descrizione,
      composizione: parti.concat(cc).join(" · "),
      valido: true,
    };
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("calcolo-cf-v1", calcolaCodiceFiscale);
  }
  root.__calcolaCodiceFiscale = calcolaCodiceFiscale;
})(typeof window !== "undefined" ? window : globalThis);
