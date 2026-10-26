/**
 * VALIDATORE PARTITA IVA — funzione pura. Controlla le 11 cifre e la cifra di
 * controllo con il procedimento dell'art. 9 del D.M. 23/12/1976 (codice
 * fiscale numerico dei soggetti diversi dalle persone fisiche, stessa struttura
 * della partita IVA: matricola, codice dell'ufficio, controllo — art. 8).
 *
 *   X = somma delle cinque cifre in posizione dispari (1ª, 3ª … 9ª)
 *   Y = somma delle cifre in posizione pari raddoppiate, ridotte a una cifra
 *   controllo = cifra delle unità di 10 − (unità di X + Y)
 *
 * La verifica è formale: dice se il numero è ben costruito, non se è stato
 * attribuito né se è attivo (per questo esistono il servizio dell'Agenzia
 * delle Entrate e, per gli scambi nell'UE, VIES).
 */
(function (root) {
  function cifraControllo(dieci) {
    var x = 0, y = 0;
    for (var i = 0; i < 10; i++) {
      var c = Number(dieci[i]);
      if (i % 2 === 0) x += c;                 // posizioni dispari (1ª, 3ª…)
      else { var d = c * 2; y += d > 9 ? d - 9 : d; } // raddoppio, cifre sommate
    }
    return String((10 - (x + y) % 10) % 10);
  }

  function esito(msg) {
    return { esito: msg, valido: false, matricola: "—", ufficio: "—", controllo: "—", formatoUe: "—" };
  }

  function validaPartitaIva(input) {
    var raw = String(input.partitaIva || "").toUpperCase().replace(/[\s.\-]/g, "");
    if (!raw) return esito("Inserisci una partita IVA");
    if (raw.indexOf("IT") === 0) raw = raw.slice(2); // prefisso del formato UE (VIES)
    if (!/^\d+$/.test(raw)) return esito("✗ Contiene caratteri non ammessi: servono solo cifre (con o senza il prefisso IT)");
    if (raw.length !== 11) return esito("✗ Lunghezza errata: servono 11 cifre (trovate " + raw.length + ")");

    var atteso = cifraControllo(raw.slice(0, 10));
    var r = {
      matricola: raw.slice(0, 7),
      ufficio: raw.slice(7, 10),
      controllo: raw[10] + (raw[10] === atteso ? " (corretta)" : " (attesa " + atteso + ")"),
      formatoUe: "IT" + raw,
    };
    if (raw[10] !== atteso) {
      r.esito = "✗ Cifra di controllo errata: attesa «" + atteso + "», trovata «" + raw[10] + "»";
      r.valido = false;
      return r;
    }
    r.esito = "✓ Partita IVA formalmente valida";
    r.valido = true;
    return r;
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("partita-iva-v1", validaPartitaIva);
  }
  root.__validaPartitaIva = validaPartitaIva;
})(typeof window !== "undefined" ? window : globalThis);
