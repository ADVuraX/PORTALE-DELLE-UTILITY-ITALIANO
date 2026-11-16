/**
 * SAGGIO DEGLI INTERESSI LEGALI (art. 1284 c.c.) — misure in vigore dal
 * 16/12/1990. Ogni anno il Ministro dell'economia può cambiarlo con decreto
 * pubblicato in Gazzetta Ufficiale entro il 15 dicembre; se non lo fa, resta
 * invariato. In Node è globalThis.INTERESSI_LEGALI.
 *
 * FONTI:
 *  - Normattiva, art. 1284 c.c. nelle versioni per data: 5% fino al 15/12/1990,
 *    10% dal 16/12/1990 (L. 353/1990, art. 1), 5% dal 01/01/1997 con la delega
 *    al Ministro (L. 662/1996, art. 2, c. 185).
 *  - Gazzetta Ufficiale, art. 1284 c.c. con le note di aggiornamento: un decreto
 *    per ciascuna misura dal 1999 (data del decreto e numero della GU qui sotto).
 *  - Agenzia delle Entrate: interessi = importo × tasso × giorni / 36.500, con
 *    365 al denominatore anche negli anni bisestili.
 *
 * AGGIORNAMENTO: a dicembre, dopo il decreto per l'anno successivo, aggiungere
 * la nuova misura e spostare `notoFino` al 31 dicembre di quell'anno.
 */
(function (root) {
  root.INTERESSI_LEGALI = {
    notoFino: "2026-12-31",
    misure: [
      { dal: "1990-12-16", tasso: 10, atto: "L. 26/11/1990, n. 353, art. 1" },
      { dal: "1997-01-01", tasso: 5, atto: "L. 23/12/1996, n. 662, art. 2, c. 185" },
      { dal: "1999-01-01", tasso: 2.5, atto: "D.M. 10/12/1998 (GU n. 289 dell'11/12/1998)" },
      { dal: "2001-01-01", tasso: 3.5, atto: "D.M. 11/12/2000 (GU n. 292 del 15/12/2000)" },
      { dal: "2002-01-01", tasso: 3, atto: "D.M. 11/12/2001 (GU n. 290 del 14/12/2001)" },
      { dal: "2004-01-01", tasso: 2.5, atto: "D.M. 01/12/2003 (GU n. 286 del 10/12/2003)" },
      { dal: "2008-01-01", tasso: 3, atto: "D.M. 12/12/2007 (GU n. 291 del 15/12/2007)" },
      { dal: "2010-01-01", tasso: 1, atto: "D.M. 04/12/2009 (GU n. 291 del 15/12/2009)" },
      { dal: "2011-01-01", tasso: 1.5, atto: "D.M. 07/12/2010 (GU n. 292 del 15/12/2010)" },
      { dal: "2012-01-01", tasso: 2.5, atto: "D.M. 12/12/2011 (GU n. 291 del 15/12/2011)" },
      { dal: "2014-01-01", tasso: 1, atto: "D.M. 12/12/2013 (GU n. 292 del 13/12/2013)" },
      { dal: "2015-01-01", tasso: 0.5, atto: "D.M. 11/12/2014 (GU n. 290 del 15/12/2014)" },
      { dal: "2016-01-01", tasso: 0.2, atto: "D.M. 11/12/2015 (GU n. 291 del 15/12/2015)" },
      { dal: "2017-01-01", tasso: 0.1, atto: "D.M. 07/12/2016 (GU n. 291 del 14/12/2016)" },
      { dal: "2018-01-01", tasso: 0.3, atto: "D.M. 13/12/2017 (GU n. 292 del 15/12/2017)" },
      { dal: "2019-01-01", tasso: 0.8, atto: "D.M. 12/12/2018 (GU n. 291 del 15/12/2018)" },
      { dal: "2020-01-01", tasso: 0.05, atto: "D.M. 12/12/2019 (GU n. 293 del 14/12/2019)" },
      { dal: "2021-01-01", tasso: 0.01, atto: "D.M. 11/12/2020 (GU n. 310 del 15/12/2020)" },
      { dal: "2022-01-01", tasso: 1.25, atto: "D.M. 13/12/2021 (GU n. 297 del 15/12/2021)" },
      { dal: "2023-01-01", tasso: 5, atto: "D.M. 13/12/2022 (GU n. 292 del 15/12/2022)" },
      { dal: "2024-01-01", tasso: 2.5, atto: "D.M. 29/11/2023 (GU n. 288 dell'11/12/2023)" },
      { dal: "2025-01-01", tasso: 2, atto: "D.M. 10/12/2024 (GU n. 294 del 16/12/2024)" },
      { dal: "2026-01-01", tasso: 1.6, atto: "D.M. 10/12/2025 (GU n. 289 del 13/12/2025)" },
    ],
  };
})(typeof window !== "undefined" ? window : globalThis);
