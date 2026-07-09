/**
 * Generatore di password. A differenza dei calcolatori (funzioni pure), un
 * generatore è IMPURO per design: usa crypto.getRandomValues (CSPRNG) — la
 * casualità è lo scopo del tool. Nessun valore lascia il browser.
 *
 * Ritorna { password, robustezza, entropia }. Il runtime (modalità generatore)
 * lo re-invoca a ogni cambio opzione e al click su "Rigenera".
 * Portabile 1:1 a .ts.
 */
function generaPassword(input) {
  var C = (typeof globalThis !== "undefined" && globalThis.crypto) ||
          (typeof window !== "undefined" && window.crypto) || null;

  var lunghezza = Math.max(4, Math.min(128, Math.floor(Number(input.lunghezza) || 16)));
  var usaMinuscole = input.minuscole !== false;
  var usaMaiuscole = input.maiuscole !== false;
  var usaNumeri = input.numeri !== false;
  var usaSimboli = input.simboli === true;
  var escludiAmbigui = input.escludiAmbigui === true;

  var AMBIGUI = "O0oIl1|`";
  function pulisci(s) {
    if (!escludiAmbigui) return s;
    var out = "";
    for (var i = 0; i < s.length; i++) if (AMBIGUI.indexOf(s[i]) === -1) out += s[i];
    return out;
  }

  var sets = [];
  if (usaMinuscole) sets.push(pulisci("abcdefghijklmnopqrstuvwxyz"));
  if (usaMaiuscole) sets.push(pulisci("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
  if (usaNumeri) sets.push(pulisci("0123456789"));
  if (usaSimboli) sets.push(pulisci("!@#$%^&*()-_=+[]{};:,.?/"));

  if (!sets.length || !C) {
    return { password: "", robustezza: "Seleziona almeno un tipo di carattere", entropia: "—" };
  }

  var pool = sets.join("");

  // Intero uniforme in [0, max) senza modulo-bias (rejection sampling).
  function randInt(max) {
    var limit = Math.floor(0x100000000 / max) * max;
    var buf = new Uint32Array(1), x;
    do { C.getRandomValues(buf); x = buf[0]; } while (x >= limit);
    return x % max;
  }
  function pick(str) { return str.charAt(randInt(str.length)); }

  var chars = [];
  // Garantisce almeno un carattere per ogni classe attiva (se c'è spazio).
  for (var s = 0; s < sets.length && s < lunghezza; s++) chars.push(pick(sets[s]));
  while (chars.length < lunghezza) chars.push(pick(pool));

  // Fisher-Yates con CSPRNG: rimescola così i caratteri "garantiti" non restano in testa.
  for (var i = chars.length - 1; i > 0; i--) {
    var j = randInt(i + 1);
    var t = chars[i]; chars[i] = chars[j]; chars[j] = t;
  }

  var password = chars.join("");

  // Entropia teorica = lunghezza · log2(dimensione pool).
  var bit = Math.round(lunghezza * (Math.log(pool.length) / Math.log(2)));
  var robustezza = bit < 40 ? "Debole" : bit < 64 ? "Media" : bit < 80 ? "Forte" : "Eccellente";

  return { password: password, robustezza: robustezza, entropia: "≈ " + bit + " bit" };
}

registerCalculator("password-gen-v1", generaPassword);
