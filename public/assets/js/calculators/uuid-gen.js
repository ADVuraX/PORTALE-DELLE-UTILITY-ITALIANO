/**
 * Generatore di UUID versione 4 (casuali). Impuro per design: usa
 * crypto.getRandomValues (CSPRNG). Tutto in locale, niente rete.
 *
 * Ritorna { uuid, versione } dove `uuid` è una o più righe (una per UUID).
 * Portabile 1:1 a .ts.
 */
function generaUuid(input) {
  var C = (typeof globalThis !== "undefined" && globalThis.crypto) ||
          (typeof window !== "undefined" && window.crypto) || null;

  var quantita = Math.max(1, Math.min(100, Math.floor(Number(input.quantita) || 1)));
  var maiuscolo = input.maiuscolo === true;
  var trattini = input.trattini !== false;
  var graffe = input.graffe === true;

  if (!C) return { uuid: "", versione: "crypto non disponibile" };

  // UUID v4 secondo RFC 4122: 122 bit casuali + version (4) e variant (10xx).
  function uuidV4() {
    var b = new Uint8Array(16);
    C.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40; // versione 4
    b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
    var h = [];
    for (var i = 0; i < 16; i++) h.push((b[i] + 0x100).toString(16).slice(1));
    return (
      h[0] + h[1] + h[2] + h[3] + "-" +
      h[4] + h[5] + "-" +
      h[6] + h[7] + "-" +
      h[8] + h[9] + "-" +
      h[10] + h[11] + h[12] + h[13] + h[14] + h[15]
    );
  }

  var righe = [];
  for (var n = 0; n < quantita; n++) {
    var u = uuidV4();
    if (!trattini) u = u.replace(/-/g, "");
    if (maiuscolo) u = u.toUpperCase();
    if (graffe) u = "{" + u + "}";
    righe.push(u);
  }

  return {
    uuid: righe.join("\n"),
    versione: "UUID v4 · " + quantita + (quantita === 1 ? " valore" : " valori")
  };
}

registerCalculator("uuid-gen-v1", generaUuid);
