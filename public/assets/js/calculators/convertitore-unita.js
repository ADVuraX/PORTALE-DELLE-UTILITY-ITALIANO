/**
 * CONVERTITORE UNITÀ DI MISURA — funzione pura condivisa da tutte le pagine
 * per categoria (lunghezza, peso, temperatura, area, volume, velocità, tempo,
 * dati digitali, pressione, energia). Ogni pagina espone SOLO le unità della
 * propria categoria nei due select `da` / `a`; questa funzione converte in base
 * a una tabella master di fattori verso l'unità-base della categoria.
 *
 * Metodo: per le unità LINEARI risultato = valore * f[da] / f[a] (f = quanti
 * unità-base vale una unità). La TEMPERATURA non è lineare (offset): gestita a
 * parte con conversioni esplicite °C/°F/K. Funzione pura, portabile 1:1 a .ts.
 *
 * NB: le chiavi delle unità sono GLOBALMENTE uniche (namespacing per categoria
 * dove serve) così la stessa funzione serve tutte le pagine senza ambiguità.
 */
(function (root) {
  // Fattore = valore in unità-base della categoria per 1 unità.
  var U = {
    // — Lunghezza (base: metro) —
    nm: { c: "lunghezza", f: 1e-9, s: "nm" },
    um: { c: "lunghezza", f: 1e-6, s: "µm" },
    mm: { c: "lunghezza", f: 1e-3, s: "mm" },
    cm: { c: "lunghezza", f: 1e-2, s: "cm" },
    dm: { c: "lunghezza", f: 1e-1, s: "dm" },
    m: { c: "lunghezza", f: 1, s: "m" },
    km: { c: "lunghezza", f: 1000, s: "km" },
    in: { c: "lunghezza", f: 0.0254, s: "in" },
    ft: { c: "lunghezza", f: 0.3048, s: "ft" },
    yd: { c: "lunghezza", f: 0.9144, s: "yd" },
    mi: { c: "lunghezza", f: 1609.344, s: "mi" },
    nmi: { c: "lunghezza", f: 1852, s: "nmi" },

    // — Peso / massa (base: chilogrammo) —
    mcg: { c: "peso", f: 1e-9, s: "µg" },
    mg: { c: "peso", f: 1e-6, s: "mg" },
    g: { c: "peso", f: 1e-3, s: "g" },
    kg: { c: "peso", f: 1, s: "kg" },
    q: { c: "peso", f: 100, s: "q" },
    t: { c: "peso", f: 1000, s: "t" },
    oz: { c: "peso", f: 0.028349523125, s: "oz" },
    lb: { c: "peso", f: 0.45359237, s: "lb" },
    st: { c: "peso", f: 6.35029318, s: "st" },

    // — Temperatura (non lineare, gestita a parte) —
    C: { c: "temperatura", s: "°C" },
    F: { c: "temperatura", s: "°F" },
    K: { c: "temperatura", s: "K" },

    // — Area / superficie (base: metro quadro) —
    mm2: { c: "area", f: 1e-6, s: "mm²" },
    cm2: { c: "area", f: 1e-4, s: "cm²" },
    dm2: { c: "area", f: 1e-2, s: "dm²" },
    m2: { c: "area", f: 1, s: "m²" },
    a: { c: "area", f: 100, s: "a" },
    ha: { c: "area", f: 10000, s: "ha" },
    km2: { c: "area", f: 1e6, s: "km²" },
    in2: { c: "area", f: 0.00064516, s: "in²" },
    ft2: { c: "area", f: 0.09290304, s: "ft²" },
    yd2: { c: "area", f: 0.83612736, s: "yd²" },
    ac: { c: "area", f: 4046.8564224, s: "ac" },
    mi2: { c: "area", f: 2589988.110336, s: "mi²" },

    // — Volume (base: litro) —
    ml: { c: "volume", f: 1e-3, s: "ml" },
    cl: { c: "volume", f: 1e-2, s: "cl" },
    dl: { c: "volume", f: 1e-1, s: "dl" },
    l: { c: "volume", f: 1, s: "l" },
    cm3: { c: "volume", f: 1e-3, s: "cm³" },
    dm3: { c: "volume", f: 1, s: "dm³" },
    m3: { c: "volume", f: 1000, s: "m³" },
    galus: { c: "volume", f: 3.785411784, s: "gal US" },
    galuk: { c: "volume", f: 4.54609, s: "gal UK" },
    ptus: { c: "volume", f: 0.473176473, s: "pt US" },
    flozus: { c: "volume", f: 0.0295735295625, s: "fl oz US" },

    // — Velocità (base: metro al secondo) —
    "m/s": { c: "velocita", f: 1, s: "m/s" },
    "km/h": { c: "velocita", f: 0.2777777778, s: "km/h" },
    mph: { c: "velocita", f: 0.44704, s: "mph" },
    kn: { c: "velocita", f: 0.5144444444, s: "kn" },
    "ft/s": { c: "velocita", f: 0.3048, s: "ft/s" },
    mach: { c: "velocita", f: 340.29, s: "Mach" },

    // — Tempo (base: secondo) —
    ms: { c: "tempo", f: 1e-3, s: "ms" },
    s: { c: "tempo", f: 1, s: "s" },
    min: { c: "tempo", f: 60, s: "min" },
    h: { c: "tempo", f: 3600, s: "h" },
    d: { c: "tempo", f: 86400, s: "giorni" },
    wk: { c: "tempo", f: 604800, s: "settimane" },
    mo: { c: "tempo", f: 2629800, s: "mesi" },
    yr: { c: "tempo", f: 31557600, s: "anni" },

    // — Dati digitali (base: byte; distinzione decimale/binaria) —
    bit: { c: "dati", f: 0.125, s: "bit" },
    B: { c: "dati", f: 1, s: "B" },
    KB: { c: "dati", f: 1e3, s: "KB" },
    KiB: { c: "dati", f: 1024, s: "KiB" },
    MB: { c: "dati", f: 1e6, s: "MB" },
    MiB: { c: "dati", f: 1048576, s: "MiB" },
    GB: { c: "dati", f: 1e9, s: "GB" },
    GiB: { c: "dati", f: 1073741824, s: "GiB" },
    TB: { c: "dati", f: 1e12, s: "TB" },
    TiB: { c: "dati", f: 1099511627776, s: "TiB" },

    // — Pressione (base: pascal) —
    Pa: { c: "pressione", f: 1, s: "Pa" },
    hPa: { c: "pressione", f: 100, s: "hPa" },
    kPa: { c: "pressione", f: 1000, s: "kPa" },
    MPa: { c: "pressione", f: 1e6, s: "MPa" },
    mbar: { c: "pressione", f: 100, s: "mbar" },
    bar: { c: "pressione", f: 100000, s: "bar" },
    atm: { c: "pressione", f: 101325, s: "atm" },
    mmHg: { c: "pressione", f: 133.322387415, s: "mmHg" },
    psi: { c: "pressione", f: 6894.757293, s: "psi" },

    // — Energia (base: joule) —
    J: { c: "energia", f: 1, s: "J" },
    kJ: { c: "energia", f: 1000, s: "kJ" },
    cal: { c: "energia", f: 4.184, s: "cal" },
    kcal: { c: "energia", f: 4184, s: "kcal" },
    Wh: { c: "energia", f: 3600, s: "Wh" },
    kWh: { c: "energia", f: 3.6e6, s: "kWh" },
    eV: { c: "energia", f: 1.602176634e-19, s: "eV" },
    BTU: { c: "energia", f: 1055.05585262, s: "BTU" },
  };

  // Temperatura → gradi Celsius, e da Celsius → unità.
  function toC(v, u) {
    if (u === "C") return v;
    if (u === "F") return (v - 32) * 5 / 9;
    if (u === "K") return v - 273.15;
    return NaN;
  }
  function fromC(c, u) {
    if (u === "C") return c;
    if (u === "F") return c * 9 / 5 + 32;
    if (u === "K") return c + 273.15;
    return NaN;
  }

  // Formatta il risultato con precisione adattiva (numeri molto piccoli/grandi
  // mantengono cifre significative; valori "normali" arrotondati a 6 decimali).
  function fmt(x) {
    if (!isFinite(x)) return "—";
    var abs = Math.abs(x);
    var out;
    if (x === 0) out = "0";
    else if (abs !== 0 && (abs < 1e-4 || abs >= 1e15)) out = x.toExponential(6).replace(/\.?0+e/, "e");
    else {
      out = (Math.round(x * 1e6) / 1e6).toString();
    }
    // notazione italiana: punto→virgola per i decimali (le migliaia non separate
    // per non confondere con la lettura tecnica).
    return out.replace(".", ",");
  }

  function convertiUnita(input) {
    var valore = Number(input.valore);
    var da = String(input.da || "");
    var a = String(input.a || "");
    var ud = U[da];
    var ua = U[a];
    if (!ud || !ua || ud.c !== ua.c || !isFinite(valore)) {
      return { risultato: "—", formula: "", inverso: "—" };
    }

    var out;
    if (ud.c === "temperatura") {
      out = fromC(toC(valore, da), a);
    } else {
      out = valore * ud.f / ua.f;
    }

    // Tasso di conversione (quanto vale 1 unità `da` in unità `a`) — non per la
    // temperatura, dove non esiste un fattore lineare.
    var formula;
    if (ud.c === "temperatura") {
      formula = valore === 0 && da === a ? "" : ud.s + " → " + ua.s;
    } else {
      var uno = ud.f / ua.f;
      formula = "1 " + ud.s + " = " + fmt(uno) + " " + ua.s;
    }

    return {
      risultato: fmt(out) + " " + ua.s,
      valoreNum: out,
      formula: formula,
      simboloDa: ud.s,
      simboloA: ua.s,
    };
  }

  // Esporta la tabella per usi diagnostici/test.
  convertiUnita.UNITS = U;

  if (typeof registerCalculator === "function") {
    registerCalculator("unita-v1", convertiUnita);
  }
  root.__convertiUnita = convertiUnita; // per smoke test in Node
})(typeof window !== "undefined" ? window : globalThis);
