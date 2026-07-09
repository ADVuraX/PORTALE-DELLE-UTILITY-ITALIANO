/**
 * TASSI DI CAMBIO — fallback statico bundled (baseline indicativa).
 * Base = EUR. `rates[X]` = quante unità di X vale 1 EUR.
 *
 * I valori qui sono uno snapshot dei tassi di riferimento BCE (Frankfurter,
 * 2026-07-09) + tre valute non-BCE (RUB, AED, SAR) come stima indicativa.
 * A runtime `valute-live.js` sovrascrive questi tassi con l'ultimo dato BCE
 * live: questo file è solo la rete di sicurezza offline / no-JS.
 *
 * FONTI: Banca Centrale Europea (tassi di riferimento) via api.frankfurter.dev;
 * valute non-BCE (RUB/AED/SAR) da open.er-api.com. Vedi convertitore-valuta.
 */
(function (root) {
  root.VALUTE = {
    base: "EUR",
    date: "2026-07-09",
    source: "indicativo (bundled)",
    // 1 EUR = rates[X] unità di X.
    rates: {
      EUR: 1,
      USD: 1.1435, GBP: 0.85363, CHF: 0.9227, JPY: 185.72, CNY: 7.7712,
      CAD: 1.6202, AUD: 1.6478, NZD: 1.9916, SEK: 11.062, NOK: 11.1305,
      DKK: 7.4753, PLN: 4.3085, CZK: 24.254, HUF: 357.8, RON: 5.2364,
      TRY: 53.541, INR: 109.0765, BRL: 5.8837, MXN: 20.0686, ZAR: 18.7213,
      KRW: 1729.49, SGD: 1.4784, HKD: 8.9605, THB: 38.244, IDR: 20703.75,
      MYR: 4.662, PHP: 70.438, ILS: 3.4587, ISK: 143.4,
      // — non-BCE, stima indicativa (non aggiornate live da Frankfurter) —
      RUB: 90.0, AED: 4.199, SAR: 4.288,
    },
    // Metadati per etichette e simboli.
    info: {
      EUR: { nome: "Euro", simbolo: "€" },
      USD: { nome: "Dollaro statunitense", simbolo: "$" },
      GBP: { nome: "Sterlina britannica", simbolo: "£" },
      CHF: { nome: "Franco svizzero", simbolo: "Fr." },
      JPY: { nome: "Yen giapponese", simbolo: "¥" },
      CNY: { nome: "Yuan cinese", simbolo: "¥" },
      CAD: { nome: "Dollaro canadese", simbolo: "C$" },
      AUD: { nome: "Dollaro australiano", simbolo: "A$" },
      NZD: { nome: "Dollaro neozelandese", simbolo: "NZ$" },
      SEK: { nome: "Corona svedese", simbolo: "kr" },
      NOK: { nome: "Corona norvegese", simbolo: "kr" },
      DKK: { nome: "Corona danese", simbolo: "kr" },
      PLN: { nome: "Złoty polacco", simbolo: "zł" },
      CZK: { nome: "Corona ceca", simbolo: "Kč" },
      HUF: { nome: "Fiorino ungherese", simbolo: "Ft" },
      RON: { nome: "Leu rumeno", simbolo: "lei" },
      TRY: { nome: "Lira turca", simbolo: "₺" },
      INR: { nome: "Rupia indiana", simbolo: "₹" },
      BRL: { nome: "Real brasiliano", simbolo: "R$" },
      MXN: { nome: "Peso messicano", simbolo: "$" },
      ZAR: { nome: "Rand sudafricano", simbolo: "R" },
      KRW: { nome: "Won sudcoreano", simbolo: "₩" },
      SGD: { nome: "Dollaro di Singapore", simbolo: "S$" },
      HKD: { nome: "Dollaro di Hong Kong", simbolo: "HK$" },
      THB: { nome: "Baht thailandese", simbolo: "฿" },
      IDR: { nome: "Rupia indonesiana", simbolo: "Rp" },
      MYR: { nome: "Ringgit malese", simbolo: "RM" },
      PHP: { nome: "Peso filippino", simbolo: "₱" },
      ILS: { nome: "Nuovo shekel israeliano", simbolo: "₪" },
      ISK: { nome: "Corona islandese", simbolo: "kr" },
      RUB: { nome: "Rublo russo", simbolo: "₽" },
      AED: { nome: "Dirham degli EAU", simbolo: "د.إ" },
      SAR: { nome: "Riyal saudita", simbolo: "﷼" },
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
