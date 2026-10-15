/**
 * VALIDATORE CODICE FISCALE — funzione pura. Valida la struttura formale e il
 * carattere di controllo (algoritmo ufficiale D.M. 23/12/1976) e decodifica in
 * modo LEGGERO i dati anagrafici deducibili dal codice: sesso, data di nascita
 * e codice catastale (Belfiore) del luogo — SENZA tradurlo nel nome del comune
 * (nessun dataset pesante in pagina). Gestisce l'omocodia (cifre sostituite da
 * lettere). Nota: un CF può essere formalmente valido ma non corrispondere a una
 * persona reale — questa è una verifica di forma, non di esistenza.
 */
(function (root) {
  var ODD = {
    0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21,
    A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21,
    K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14,
    U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
  };
  var EVEN = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
    A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9,
    K: 10, L: 11, M: 12, N: 13, O: 14, P: 15, Q: 16, R: 17, S: 18, T: 19,
    U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25,
  };
  // Omocodia: nelle posizioni numeriche una cifra può essere sostituita da una
  // lettera secondo questa mappa (per decodificare, si torna alla cifra).
  var OMO = { L: "0", M: "1", N: "2", P: "3", Q: "4", R: "5", S: "6", T: "7", U: "8", V: "9" };
  var MESI = { A: 1, B: 2, C: 3, D: 4, E: 5, H: 6, L: 7, M: 8, P: 9, R: 10, S: 11, T: 12 };
  var MESI_NOME = ["", "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var ALFA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function checkChar(cf15) {
    var sum = 0;
    for (var i = 0; i < 15; i++) {
      var ch = cf15[i];
      sum += (i % 2 === 0) ? ODD[ch] : EVEN[ch]; // i pari (0-based) = posizioni dispari
    }
    return ALFA[sum % 26];
  }

  // Riporta a cifra i caratteri omocodici nelle posizioni numeriche indicate.
  function deomocodia(cf, positions) {
    var arr = cf.split("");
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      if (OMO[arr[p]] !== undefined) arr[p] = OMO[arr[p]];
    }
    return arr.join("");
  }

  function invalido(msg) {
    return { esito: "✗ " + msg, valido: false, sesso: "—", dataNascita: "—", codiceCatastale: "—" };
  }

  function validaCodiceFiscale(input) {
    var raw = String(input.codice || "").toUpperCase().replace(/\s+/g, "");
    if (!raw) return { esito: "Inserisci un codice fiscale", valido: false, sesso: "—", dataNascita: "—", codiceCatastale: "—" };

    if (raw.length !== 16) return invalido("Lunghezza errata: servono 16 caratteri (trovati " + raw.length + ")");
    if (!/^[A-Z0-9]+$/.test(raw)) return invalido("Contiene caratteri non ammessi (solo lettere e cifre)");
    // Struttura: 6 lettere · 2 num · 1 lettera mese · 2 num · 1 lettera · 3 num · 1 lettera controllo.
    // Con omocodia le posizioni "num" possono essere lettere → si validano dopo la de-omocodia.
    if (!/^[A-Z]{6}[A-Z0-9]{2}[A-Z][A-Z0-9]{2}[A-Z][A-Z0-9]{3}[A-Z]$/.test(raw)) {
      return invalido("Struttura non valida per un codice fiscale");
    }

    // Carattere di controllo.
    var atteso = checkChar(raw.slice(0, 15));
    if (atteso !== raw[15]) {
      return invalido("Carattere di controllo errato: atteso «" + atteso + "», trovato «" + raw[15] + "»");
    }

    // Decodifica dati (posizioni numeriche: 6,7 anno · 9,10 giorno · 12,13,14 Belfiore).
    // In quelle posizioni sono ammesse solo cifre o le 10 lettere dell'omocodia.
    var POS_NUM = [6, 7, 9, 10, 12, 13, 14];
    var omocodico = false;
    for (var k = 0; k < POS_NUM.length; k++) {
      var c = raw[POS_NUM[k]];
      if (c >= "0" && c <= "9") continue;
      if (OMO[c] === undefined) return invalido("Carattere «" + c + "» non ammesso in posizione " + (POS_NUM[k] + 1));
      omocodico = true;
    }
    var d = deomocodia(raw, POS_NUM);
    var annoYY = parseInt(d.slice(6, 8), 10);
    var meseCh = d[8];
    var giorno = parseInt(d.slice(9, 11), 10);
    var belfiore = d.slice(11, 15); // codice catastale, riportato a cifre se omocodico

    var mese = MESI[meseCh];
    if (!mese) return invalido("Lettera del mese non valida («" + meseCh + "»)");

    var sesso, giornoReale;
    if (giorno >= 41 && giorno <= 71) { sesso = "Femmina"; giornoReale = giorno - 40; }
    else if (giorno >= 1 && giorno <= 31) { sesso = "Maschio"; giornoReale = giorno; }
    else return invalido("Giorno di nascita non valido");

    // Secolo ambiguo (2 cifre): il più recente che non cada nel futuro.
    var annoCorrente = new Date().getFullYear();
    var annoPieno = 2000 + annoYY <= annoCorrente ? 2000 + annoYY : 1900 + annoYY;
    // Data di calendario reale (niente 31 febbraio; 29 febbraio solo negli anni bisestili).
    var giorniMese = new Date(Date.UTC(annoPieno, mese, 0)).getUTCDate();
    if (giornoReale > giorniMese) {
      return invalido("Data di nascita inesistente: " + giornoReale + " " + MESI_NOME[mese] + " " + annoPieno);
    }

    var dd = String(giornoReale).padStart(2, "0");
    var mm = String(mese).padStart(2, "0");
    var dataNascita = dd + "/" + mm + "/" + annoPieno + " (" + giornoReale + " " + MESI_NOME[mese] + " " + annoPieno + ")";

    return {
      esito: omocodico
        ? "✓ Codice fiscale formalmente valido (omocodico: alcune cifre sono sostituite da lettere)"
        : "✓ Codice fiscale formalmente valido",
      valido: true,
      sesso: sesso,
      dataNascita: dataNascita,
      codiceCatastale: belfiore + " (codice Belfiore del luogo di nascita)",
    };
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("codice-fiscale-v1", validaCodiceFiscale);
  }
  root.__validaCodiceFiscale = validaCodiceFiscale;
})(typeof window !== "undefined" ? window : globalThis);
