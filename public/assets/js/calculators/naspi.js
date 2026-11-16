/**
 * NASpI — funzione pura. Costanti in /assets/js/data/naspi-2026.js.
 *
 *  1. Retribuzione mensile di riferimento (D.Lgs. 22/2015 art. 4 c. 1):
 *     imponibile previdenziale degli ultimi 4 anni / settimane di contribuzione
 *     × 4,33. Con uno stipendio stabile coincide con RAL / 52 × 4,33.
 *  2. Importo (art. 4 c. 2): 75% fino alla soglia; oltre, 75% della soglia più
 *     25% dell'eccedenza; mai sopra il massimale.
 *  3. Riduzione (art. 4 c. 3): −3% al mese dal 6° mese di fruizione (dall'8°
 *     con 55 anni compiuti alla domanda); ogni riduzione si applica all'importo
 *     già ridotto (circ. INPS 122/2021). Mesi di 30 giorni (circ. INPS 2/2022:
 *     151° e 211° giorno).
 *  4. Durata (art. 5): metà delle settimane di contribuzione dei 4 anni, tolte
 *     quelle già usate per altre prestazioni di disoccupazione. Il calcolatore
 *     conta i giorni interi; l'ultimo mese parziale vale importo / 30 al giorno
 *     (circ. INPS 94/2015).
 *
 * Perimetro: importo lordo. Niente IRPEF, riduzioni per redditi da lavoro
 * durante la NASpI, anticipazione in unica soluzione.
 */
(function (root) {
  function calcolaNaspi(input) {
    var D = root.NASPI["2026"];
    var settimane = Math.min(D.settimaneQuadriennio, Math.max(0, Math.floor(Number(input.settimane) || 0)));
    var usate = Math.min(settimane, Math.max(0, Math.floor(Number(input.settimaneUsate) || 0)));
    var over55 = input.over55 === true || input.over55 === "true";
    var modo = input.modo === "totale" ? "totale" : "annua";

    var vuoto = {
      iniziale: NaN, retribuzione: NaN, formula: "—", durata: "—", riduzione: "—",
      ultimo: NaN, totale: NaN, piano: "—", giorni: 0, mesi: [],
    };
    if (settimane < D.settimaneMinime) {
      vuoto.inizialeLabel = "Requisito non raggiunto: servono almeno " + D.settimaneMinime + " settimane di contributi in 4 anni";
      return vuoto;
    }

    var retribuzione = modo === "totale"
      ? Math.max(0, Number(input.totale) || 0) / settimane * D.coefficiente
      : Math.max(0, Number(input.ral) || 0) / 52 * D.coefficiente;

    var teorico, formula;
    if (retribuzione <= D.soglia) {
      teorico = D.quotaFinoSoglia * retribuzione;
      formula = "75% di " + euro(retribuzione);
    } else {
      teorico = D.quotaFinoSoglia * D.soglia + D.quotaOltreSoglia * (retribuzione - D.soglia);
      formula = "75% di " + euro(D.soglia) + " + 25% di " + euro(retribuzione - D.soglia);
    }
    var iniziale = Math.min(teorico, D.massimale);
    if (teorico > D.massimale) formula += " = " + euro(teorico) + ", oltre il massimo di " + euro(D.massimale);

    var settimaneDurata = (settimane - usate) / 2;
    var giorni = Math.floor(settimaneDurata * 7);
    var primoRidotto = over55 ? D.meseRiduzione55 : D.meseRiduzione;

    var mesi = [], totale = 0;
    for (var k = 1; (k - 1) * D.giorniMese < giorni; k++) {
      var gg = Math.min(D.giorniMese, giorni - (k - 1) * D.giorniMese);
      var tagli = Math.max(0, k - primoRidotto + 1);
      var rata = iniziale * Math.pow(1 - D.riduzione, tagli);
      var pagato = rata * gg / D.giorniMese;
      mesi.push({ mese: k, giorni: gg, rata: rata, pagato: pagato });
      totale += pagato;
    }

    var mesiPieni = Math.floor(giorni / D.giorniMese), resto = giorni % D.giorniMese;
    var durata = fmtSettimane(settimaneDurata) + " = " + giorni + " giorni"
      + (giorni ? " (" + (mesiPieni ? mesiPieni + (mesiPieni === 1 ? " mese" : " mesi") : "") + (mesiPieni && resto ? " e " : "") + (resto ? resto + (resto === 1 ? " giorno" : " giorni") : "") + ")" : "");

    var out = {
      iniziale: iniziale,
      retribuzione: retribuzione,
      formula: formula,
      durata: durata,
      riduzione: "−3% al mese " + (primoRidotto === 8 || primoRidotto === 11 ? "dall'" : "dal ") + primoRidotto + "° mese (" + ((primoRidotto - 1) * D.giorniMese + 1) + "° giorno)"
        + (mesi.length < primoRidotto ? ": la NASpI finisce prima" : ""),
      ultimo: mesi.length ? mesi[mesi.length - 1].rata : NaN,
      totale: mesi.length ? totale : NaN,
      piano: piano(mesi),
      giorni: giorni,
      mesi: mesi,
    };
    if (!giorni) {
      out.iniziale = NaN;
      out.inizialeLabel = "Nessuna settimana utile per la durata: sono già state usate tutte";
    }
    return out;
  }

  /** "1°–5° mese: 1.227,98 €" e poi una riga per mese; l'ultimo mese parziale con i giorni. */
  function piano(mesi) {
    if (!mesi.length) return "—";
    var righe = [], i = 0;
    while (i < mesi.length) {
      var j = i;
      while (j + 1 < mesi.length && mesi[j + 1].giorni === 30 && mesi[i].giorni === 30 && Math.abs(mesi[j + 1].rata - mesi[i].rata) < 0.005) j++;
      var m = mesi[i];
      var nome = j > i ? mesi[i].mese + "°–" + mesi[j].mese + "° mese" : m.mese + "° mese";
      righe.push(m.giorni < 30
        ? nome + ", " + m.giorni + (m.giorni === 1 ? " giorno: " : " giorni: ") + euro(m.pagato) + " (rata piena " + euro(m.rata) + ")"
        : nome + ": " + euro(m.rata));
      i = j + 1;
    }
    return righe.join("\n");
  }

  function fmtSettimane(s) {
    return s.toLocaleString("it-IT", { maximumFractionDigits: 1 }) + (s === 1 ? " settimana" : " settimane");
  }

  function euro(x) {
    return x.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" }) + " €";
  }

  if (typeof registerCalculator === "function") {
    registerCalculator("naspi-v1", calcolaNaspi);
  }
})(typeof window !== "undefined" ? window : globalThis);
