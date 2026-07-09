/**
 * VALIDATORE IBAN — funzione pura. Valida il codice IBAN (ISO 13616) tramite:
 *   1) lunghezza corretta per il paese;
 *   2) checksum mod-97 (ISO 7064): spostando i primi 4 caratteri in coda e
 *      convertendo le lettere in numeri (A=10…Z=35), il resto mod 97 deve = 1.
 * Per gli IBAN ITALIANI decodifica in modo leggero le componenti BBAN: CIN,
 * codice ABI (banca), CAB (sportello) e numero di conto — SENZA tradurre l'ABI
 * nel nome della banca (nessun dataset bancario pesante in pagina).
 */
(function (root) {
  // Lunghezza IBAN per paese (principali). Fonte: registro SWIFT IBAN.
  var LEN = {
    AD: 24, AT: 20, BE: 16, BG: 22, CH: 21, CY: 28, CZ: 24, DE: 22, DK: 18,
    EE: 20, ES: 24, FI: 18, FR: 27, GB: 22, GR: 27, HR: 21, HU: 28, IE: 22,
    IS: 26, IT: 27, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MT: 31, NL: 18,
    NO: 15, PL: 28, PT: 25, RO: 24, SE: 24, SI: 19, SK: 24, SM: 27, VA: 22,
  };
  var PAESE_NOME = {
    IT: "Italia", DE: "Germania", FR: "Francia", ES: "Spagna", GB: "Regno Unito",
    NL: "Paesi Bassi", CH: "Svizzera", AT: "Austria", BE: "Belgio", PT: "Portogallo",
    IE: "Irlanda", SM: "San Marino", VA: "Città del Vaticano", MC: "Monaco", LU: "Lussemburgo",
  };

  function mod97(str) {
    // Calcolo a blocchi per evitare l'overflow dei Number su interi lunghi.
    var rem = 0;
    for (var i = 0; i < str.length; i++) {
      rem = (rem * 10 + (str.charCodeAt(i) - 48)) % 97;
    }
    return rem;
  }

  // Converte l'IBAN (riordinato) nella stringa numerica per il mod-97.
  function toNumeric(s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c >= "0" && c <= "9") out += c;
      else out += String(c.charCodeAt(0) - 55); // A=10 … Z=35
    }
    return out;
  }

  function base(esito, valido) {
    return { esito: esito, valido: !!valido, paese: "—", cin: "—", abi: "—", cab: "—", conto: "—" };
  }

  function validaIban(input) {
    var raw = String(input.iban || "").toUpperCase().replace(/\s+/g, "");
    if (!raw) return { esito: "Inserisci un codice IBAN", valido: false, paese: "—", cin: "—", abi: "—", cab: "—", conto: "—" };

    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(raw)) {
      return base("✗ Formato non valido: un IBAN inizia con 2 lettere (paese) + 2 cifre di controllo", false);
    }
    var paese = raw.slice(0, 2);
    var atteso = LEN[paese];
    if (atteso && raw.length !== atteso) {
      return base("✗ Lunghezza errata per " + paese + ": attesi " + atteso + " caratteri, trovati " + raw.length, false);
    }
    if (!atteso && (raw.length < 15 || raw.length > 34)) {
      return base("✗ Lunghezza IBAN fuori intervallo (15–34 caratteri)", false);
    }

    // Checksum mod-97.
    var riordinato = raw.slice(4) + raw.slice(0, 4);
    if (mod97(toNumeric(riordinato)) !== 1) {
      return base("✗ Checksum non valido: le cifre di controllo non tornano (mod-97)", false);
    }

    var r = base("✓ IBAN valido", true);
    r.paese = paese + (PAESE_NOME[paese] ? " · " + PAESE_NOME[paese] : "");

    if (paese === "IT" || paese === "SM") {
      // BBAN IT/SM: 1 lettera CIN + 5 ABI + 5 CAB + 12 conto.
      var bban = raw.slice(4);
      r.cin = bban.slice(0, 1);
      r.abi = bban.slice(1, 6) + " (codice banca)";
      r.cab = bban.slice(6, 11) + " (sportello)";
      r.conto = bban.slice(11);
    } else {
      r.cin = "—";
      r.abi = "—";
      r.cab = "—";
      r.conto = raw.slice(4) + " (BBAN)";
    }
    return r;
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("iban-v1", validaIban);
  }
  root.__validaIban = validaIban;
})(typeof window !== "undefined" ? window : globalThis);
