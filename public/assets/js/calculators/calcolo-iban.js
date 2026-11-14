/**
 * CALCOLO IBAN ITALIANO — funzione pura. Dalle coordinate bancarie (CIN,
 * ABI, CAB, numero di conto) ricava le due cifre di controllo con il
 * procedimento MOD 97-10 (ISO 13616 / ISO 7064): si scrive BBAN + "IT00", si
 * trasformano le lettere in numeri (A = 10 … Z = 35) e le cifre di controllo
 * sono 98 meno il resto della divisione per 97.
 *
 * Non calcola il CIN: il suo metodo non è pubblicato da una fonte ufficiale
 * consultabile, quindi va preso dai documenti della banca.
 */
(function (root) {
  function mod97(numerico) {
    var resto = 0;
    for (var i = 0; i < numerico.length; i += 7) {
      resto = Number(String(resto) + numerico.slice(i, i + 7)) % 97;
    }
    return resto;
  }
  function inNumeri(s) {
    return s.replace(/[A-Z]/g, function (c) { return String(c.charCodeAt(0) - 55); });
  }
  function pulisci(s) {
    return String(s || "").toUpperCase().replace(/[\s.\-]/g, "");
  }
  function vuoto(msg) {
    return { iban: msg, ibanStampa: "—", bban: "—", controllo: "—", valido: false };
  }

  function calcolaIban(input) {
    var cin = pulisci(input.cin), abi = pulisci(input.abi), cab = pulisci(input.cab), conto = pulisci(input.conto);
    if (!cin && !abi && !cab && !conto) return vuoto("Inserisci CIN, ABI, CAB e numero di conto");
    if (!/^[A-Z]$/.test(cin)) return vuoto("✗ Il CIN è una sola lettera (A–Z)");
    if (!/^\d{5}$/.test(abi)) return vuoto("✗ L'ABI ha 5 cifre");
    if (!/^\d{5}$/.test(cab)) return vuoto("✗ Il CAB ha 5 cifre");
    if (!/^[A-Z0-9]{1,12}$/.test(conto)) return vuoto("✗ Il numero di conto ha fino a 12 caratteri, lettere o cifre");
    conto = ("000000000000" + conto).slice(-12); // il conto si completa a sinistra con zeri fino a 12 caratteri

    var bban = cin + abi + cab + conto;
    var cc = String(98 - mod97(inNumeri(bban + "IT00"))).padStart(2, "0");
    var iban = "IT" + cc + bban;
    return {
      iban: iban,
      ibanStampa: iban.replace(/(.{4})/g, "$1 ").trim(),
      bban: bban,
      controllo: cc,
      valido: mod97(inNumeri(bban + "IT" + cc)) === 1,
    };
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("calcolo-iban-v1", calcolaIban);
  }
  root.__calcolaIban = calcolaIban;
})(typeof window !== "undefined" ? window : globalThis);
