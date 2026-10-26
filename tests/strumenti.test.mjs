/**
 * VERIFICA DEGLI STRUMENTI NON FISCALI — livello 2 del metodo.
 * Convertitori contro le definizioni esatte delle unità, validatori contro
 * vettori ufficiali e un checksum ricalcolato in modo indipendente, generatori
 * contro le proprietà richieste dalle specifiche.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { calcolatore } from "./carica.mjs";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const unita = calcolatore("unita-v1", "convertitore-unita.js");
const cf = calcolatore("codice-fiscale-v1", "validatore-codice-fiscale.js");
const iban = calcolatore("iban-v1", "validatore-iban.js");
const password = calcolatore("password-gen-v1", "password-gen.js");
const uuid = calcolatore("uuid-gen-v1", "uuid-gen.js");

/** Valore numerico esatto del risultato (prima dell'arrotondamento per la lettura). */
function converti(valore, da, a) {
  const out = unita({ valore, da, a });
  assert.ok(isFinite(out.valoreNum), `risultato non numerico: ${out.risultato}`);
  return out.valoreNum;
}
const relativo = (x, y, tol, msg) =>
  assert.ok(Math.abs(x - y) <= tol * Math.max(1, Math.abs(y)), `${msg}: ${x} vs ${y}`);

/* ============================ CONVERTITORI ============================ */
// Definizioni esatte: accordo internazionale su iarda e libbra (1959), NIST SP 811
// app. B, SI 2019 (BIPM), IEC 80000-13 per i prefissi binari.
const DEFINIZIONI = [
  [1, "in", "mm", 25.4],
  [1, "ft", "m", 0.3048],
  [1, "mi", "m", 1609.344],
  [1, "nmi", "m", 1852],
  [1, "lb", "g", 453.59237],
  [1, "oz", "g", 28.349523125],
  [1, "st", "lb", 14],
  [1, "ac", "m2", 4046.8564224],
  [1, "ha", "m2", 10000],
  [1, "galus", "l", 3.785411784],
  [1, "galuk", "l", 4.54609],
  [1, "flozus", "ml", 29.5735295625],
  [100, "km/h", "m/s", 27.777778],
  [1, "kn", "km/h", 1.852],
  [1, "mph", "km/h", 1.609344],
  [1, "atm", "Pa", 101325],
  [1, "bar", "hPa", 1000],
  [1, "psi", "Pa", 6894.757293],
  [1, "kcal", "kJ", 4.184],
  [1, "kWh", "kJ", 3600],
  [1, "TB", "GB", 1000],
  [1, "TiB", "GiB", 1024],
  [1, "GiB", "B", 1073741824],
  [1, "d", "s", 86400],
];

for (const [v, da, a, atteso] of DEFINIZIONI) {
  test(`convertitore: ${v} ${da} = ${atteso} ${a}`, () => relativo(converti(v, da, a), atteso, 1e-6, `${da}→${a}`));
}

test("convertitore: andata e ritorno restituiscono il valore di partenza", () => {
  for (const [da, a] of [["mi", "km"], ["lb", "kg"], ["galuk", "l"], ["psi", "bar"], ["BTU", "kWh"]]) {
    relativo(converti(converti(123.456, da, a), a, da), 123.456, 1e-5, `${da}↔${a}`);
  }
});

test("convertitore: temperature, punti fissi dell'acqua e zero assoluto", () => {
  relativo(converti(100, "C", "F"), 212, 1e-9, "100 °C");
  relativo(converti(32, "F", "C"), 0, 1e-9, "32 °F");
  relativo(converti(0, "K", "C"), -273.15, 1e-9, "0 K");
  relativo(converti(-40, "C", "F"), -40, 1e-9, "−40 coincide");
});

test("convertitore: 1 TB commerciale vale circa 931,32 GiB (perché il disco «perde» spazio)", () => {
  relativo(converti(1, "TB", "GiB"), 931.322575, 1e-6, "TB→GiB");
});

/* =========================== CODICE FISCALE =========================== */

// Carattere di controllo ricalcolato da zero (D.M. 23/12/1976, tabelle dispari/pari).
const DISPARI = { 0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21 };
"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((ch, i) => {
  DISPARI[ch] = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23][i];
});
const pari = (ch) => (/[0-9]/.test(ch) ? Number(ch) : ch.charCodeAt(0) - 65);
function controllo(cf15) {
  let s = 0;
  for (let i = 0; i < 15; i++) s += i % 2 === 0 ? DISPARI[cf15[i]] : pari(cf15[i]);
  return String.fromCharCode(65 + (s % 26));
}
const conControllo = (cf15) => cf15 + controllo(cf15);

test("codice fiscale valido: maschio, 10 dicembre 1985, Belfiore A562", () => {
  const codice = conControllo("RSSMRA85T10A562");
  const o = cf({ codice });
  assert.equal(o.valido, true, o.esito);
  assert.equal(o.sesso, "Maschio");
  assert.match(o.dataNascita, /^10\/12\/1985/);
  assert.match(o.codiceCatastale, /^A562/);
});

test("codice fiscale femminile: giorno + 40", () => {
  const o = cf({ codice: conControllo("BNCLRA92E61H501") });
  assert.equal(o.sesso, "Femmina");
  assert.match(o.dataNascita, /^21\/05\/1992/);
});

test("omocodia: lettere al posto delle cifre, decodifica e segnalazione", () => {
  // Omocodia sull'ultima cifra del Belfiore: A562 → A56N (2 → N, tabella ufficiale L…V)
  const base15 = "RSSMRA85T10A56N";
  const o = cf({ codice: conControllo(base15) });
  assert.equal(o.valido, true, o.esito);
  assert.match(o.esito, /omocodico/);
  assert.match(o.codiceCatastale, /^A562/, "Belfiore riportato a cifre");
});

test("codice fiscale: carattere di controllo errato viene rifiutato", () => {
  const giusto = conControllo("RSSMRA85T10A562");
  const sbagliato = giusto.slice(0, 15) + (giusto[15] === "A" ? "B" : "A");
  assert.equal(cf({ codice: sbagliato }).valido, false);
});

test("codice fiscale: il 31 febbraio non esiste", () => {
  const o = cf({ codice: conControllo("RSSMRA85B31A562") });
  assert.equal(o.valido, false);
  assert.match(o.esito, /inesistente/);
});

test("codice fiscale: il 29 febbraio solo negli anni bisestili", () => {
  assert.equal(cf({ codice: conControllo("RSSMRA84B29A562") }).valido, true, "1984 bisestile");
  assert.equal(cf({ codice: conControllo("RSSMRA85B29A562") }).valido, false, "1985 no");
});

/* ======================= CALCOLO DEL CODICE FISCALE ======================= */
// Regole riscritte da zero dal testo del D.M. 23/12/1976 (artt. 3–5), non dal calcolatore.

const calcoloCf = calcolatore("calcolo-cf-v1", "calcolo-codice-fiscale.js", ["luoghi-catastali.js"]);

/** Art. 3 (cognome) e art. 4 (nome), caso per caso come nel decreto. */
function treLettere(testo, nome) {
  const l = testo.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
  const c = [...l].filter((x) => !"AEIOU".includes(x));
  const v = [...l].filter((x) => "AEIOU".includes(x));
  if (nome && c.length >= 4) return c[0] + c[2] + c[3];          // art. 4: prima, terza, quarta
  if (c.length >= 3) return c[0] + c[1] + c[2];
  if (c.length === 2) return c[0] + c[1] + v[0];                  // due consonanti + prima vocale
  if (c.length === 1 && v.length >= 2) return c[0] + v[0] + v[1];
  if (c.length === 1 && v.length === 1) return c[0] + v[0] + "X";
  if (c.length === 0 && v.length === 2) return v[0] + v[1] + "X";
  throw new Error(`caso non previsto dal decreto: ${testo}`);
}
const MESE = "ABCDEHLMPRST";
function cfRiferimento({ cognome, nome, sesso, giorno, mese, anno }, codiceLuogo) {
  const g = String(giorno + (sesso === "F" ? 40 : 0)).padStart(2, "0");
  return conControllo(treLettere(cognome, false) + treLettere(nome, true) + String(anno % 100).padStart(2, "0") + MESE[mese - 1] + g + codiceLuogo);
}

test("calcolo CF: casi degli artt. 3 e 4 del decreto", () => {
  const casi = [
    ["Rossi", false, "RSS"], ["Bianchi", false, "BNC"],   // tre o più consonanti
    ["Neri", false, "NRE"],                                // due consonanti + prima vocale
    ["Rea", false, "REA"],                                 // una consonante + due vocali
    ["Fo", false, "FOX"],                                  // una consonante + una vocale + X
    ["Ai", false, "AIX"],                                  // due vocali + X
    ["De Luca", false, "DLC"], ["D'Angelo", false, "DNG"], // parti e apostrofi: un'unica successione
    ["Gianfranco", true, "GFR"], ["Maria Luisa", true, "MLS"], // nome: prima, terza, quarta consonante
    ["Mario", true, "MRA"], ["Ugo", true, "GUO"], ["Nicolò", true, "NCL"],
  ];
  for (const [testo, nome, atteso] of casi) {
    assert.equal(treLettere(testo, nome), atteso, `riferimento: ${testo}`);
    const o = calcoloCf({ cognome: nome ? "Rossi" : testo, nome: nome ? testo : "Mario", sesso: "M", giorno: 1, mese: "8", anno: 1985, luogo: "Roma" });
    assert.equal(o.codice.slice(nome ? 3 : 0, nome ? 6 : 3), atteso, `calcolatore: ${testo}`);
  }
});

test("calcolo CF: Mario Rossi, Roma, 1/8/1985 → RSSMRA85M01H501Q (esempio del validatore)", () => {
  const o = calcoloCf({ cognome: "Rossi", nome: "Mario", sesso: "M", giorno: 1, mese: "8", anno: 1985, luogo: "Roma" });
  assert.equal(o.codice, "RSSMRA85M01H501Q");
  assert.equal(cf({ codice: o.codice }).valido, true);
});

test("calcolo CF: 300 persone a caso coincidono col riferimento e passano il validatore", () => {
  const nomi = ["Rossi", "Fo", "De Luca", "Ai", "Esposito", "Bò", "Russo", "Iuorio", "Maria Luisa", "Gianfranco", "Ugo", "Ea", "Luca", "Chiara"];
  const luoghi = [["Roma", "H501"], ["Milano", "F205"], ["Castro (LE)", "M261"], ["Germania", "Z112"], ["Francia", "Z110"], ["H223", "H223"]];
  let seme = 7;
  const caso = (n) => { seme = (seme * 1103515245 + 12345) % 2147483648; return seme % n; };
  for (let i = 0; i < 300; i++) {
    const anno = 1900 + caso(126), mese = 1 + caso(12);
    const giorno = 1 + caso(new Date(Date.UTC(anno, mese, 0)).getUTCDate());
    const sesso = caso(2) ? "F" : "M";
    const [luogo, codice] = luoghi[caso(luoghi.length)];
    const p = { cognome: nomi[caso(nomi.length)], nome: nomi[caso(nomi.length)], sesso, giorno, mese, anno };
    const o = calcoloCf({ ...p, mese: String(mese), luogo });
    assert.equal(o.codice, cfRiferimento(p, codice), JSON.stringify(p));
    const v = cf({ codice: o.codice });
    assert.equal(v.valido, true, `${o.codice}: ${v.esito}`);
    assert.equal(v.sesso, sesso === "F" ? "Femmina" : "Maschio");
  }
});

test("calcolo CF: comune omonimo senza provincia → chiede la provincia", () => {
  const o = calcoloCf({ cognome: "Rossi", nome: "Mario", sesso: "M", giorno: 1, mese: "1", anno: 1980, luogo: "Castro" });
  assert.equal(o.valido, false);
  assert.match(o.luogo, /Castro \(BG\).*Castro \(LE\)/);
  const conPr = calcoloCf({ cognome: "Rossi", nome: "Mario", sesso: "M", giorno: 1, mese: "1", anno: 1980, luogo: "Castro", provincia: "bg" });
  assert.match(conPr.codice, /C337.$/);
});

test("calcolo CF: date impossibili rifiutate (31 aprile, 29 febbraio non bisestile)", () => {
  const base = { cognome: "Rossi", nome: "Mario", sesso: "M", luogo: "Roma" };
  assert.equal(calcoloCf({ ...base, giorno: 31, mese: "4", anno: 1990 }).valido, false);
  assert.equal(calcoloCf({ ...base, giorno: 29, mese: "2", anno: 1985 }).valido, false);
  assert.equal(calcoloCf({ ...base, giorno: 29, mese: "2", anno: 1984 }).valido, true);
});

test("tabella dei luoghi: comuni ISTAT e Stati esteri con codici ben formati e unici per voce", () => {
  const righe = globalThis.LUOGHI_CATASTALI.split("\n");
  const comuni = righe.filter((r) => r.split("|")[1] !== "EE");
  const esteri = righe.filter((r) => r.split("|")[1] === "EE");
  assert.ok(comuni.length > 7800 && esteri.length > 200, `${comuni.length} comuni, ${esteri.length} Stati`);
  for (const r of righe) assert.match(r.split("|")[2], /^[A-Z]\d{3}$/, r);
  assert.ok(esteri.every((r) => r.split("|")[2].startsWith("Z")), "gli Stati esteri hanno codici Z");
  assert.ok(righe.includes("Roma|RM|H501") && righe.includes("Milano|MI|F205"));
});

test("validatore CF con la tabella: traduce il codice del luogo nel nome", () => {
  assert.match(cf({ codice: "RSSMRA85M01H501Q" }).codiceCatastale, /^H501 · Roma \(RM\)$/);
});

/* ================================ IBAN ================================ */
// Esempi ufficiali del registro IBAN (SWIFT) per Italia, Germania, Regno Unito.

test("IBAN di esempio del registro: IT, DE, GB validi", () => {
  for (const codice of ["IT60X0542811101000000123456", "DE89370400440532013000", "GB82WEST12345698765432"]) {
    const o = iban({ iban: codice });
    assert.equal(o.valido, true, `${codice}: ${o.esito}`);
  }
});

test("IBAN italiano: scomposizione CIN / ABI / CAB / conto", () => {
  const o = iban({ iban: "IT60 X054 2811 1010 0000 0123 456" });
  assert.equal(o.cin, "X");
  assert.match(o.abi, /^05428/);
  assert.match(o.cab, /^11101/);
  assert.equal(o.conto, "000000123456");
});

test("IBAN: una cifra cambiata fa fallire il mod-97", () => {
  assert.equal(iban({ iban: "IT60X0542811101000000123457" }).valido, false);
});

test("IBAN: lunghezza errata per il paese", () => {
  assert.equal(iban({ iban: "IT60X054281110100000012345" }).valido, false);
});

/* ============================ PARTITA IVA ============================ */
// Riferimento indipendente: algoritmo di Luhn standard sulle 11 cifre (da destra, raddoppio
// delle cifre in posizione pari a partire dalla penultima), equivalente all'art. 9 del D.M. 1976.

const piva = calcolatore("partita-iva-v1", "validatore-partita-iva.js");
function luhn(n) {
  let s = 0;
  [...n].reverse().forEach((c, i) => { let d = Number(c); if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; } s += d; });
  return s % 10 === 0;
}

test("partita IVA: numeri pubblicati da Agenzia delle Entrate e INPS sono validi", () => {
  for (const n of ["06363391001", "02121151001", "IT 06363391001", "it02121151001"]) {
    assert.equal(piva({ partitaIva: n }).valido, true, n);
  }
  const o = piva({ partitaIva: "06363391001" });
  assert.equal(o.matricola, "0636339");
  assert.equal(o.ufficio, "100");
  assert.equal(o.formatoUe, "IT06363391001");
});

test("partita IVA: coincide con Luhn su 20.000 numeri e intercetta ogni singola cifra sbagliata", () => {
  let seme = 11;
  const caso = () => { seme = (seme * 1103515245 + 12345) % 2147483648; return seme; };
  for (let k = 0; k < 20000; k++) {
    const n = String(caso() % 1e6).padStart(6, "0") + String(caso() % 1e5).padStart(5, "0");
    assert.equal(piva({ partitaIva: n }).valido, luhn(n), n);
  }
  const giusto = "06363391001";
  for (let pos = 0; pos < 11; pos++) {
    for (let d = 0; d <= 9; d++) {
      if (String(d) === giusto[pos]) continue;
      const errato = giusto.slice(0, pos) + d + giusto.slice(pos + 1);
      assert.equal(piva({ partitaIva: errato }).valido, false, errato);
    }
  }
});

test("partita IVA: lunghezza e caratteri non ammessi", () => {
  assert.match(piva({ partitaIva: "0636339100" }).esito, /Lunghezza errata/);
  assert.match(piva({ partitaIva: "0636339100A" }).esito, /caratteri non ammessi/);
});

/* ============================= GENERATORI ============================= */

test("password: lunghezza, una lettera per ogni classe richiesta, entropia dichiarata", () => {
  for (let i = 0; i < 200; i++) {
    const o = password({ lunghezza: 20, minuscole: true, maiuscole: true, numeri: true, simboli: true });
    assert.equal(o.password.length, 20);
    assert.match(o.password, /[a-z]/);
    assert.match(o.password, /[A-Z]/);
    assert.match(o.password, /[0-9]/);
    assert.match(o.password, /[^a-zA-Z0-9]/);
  }
  // 26 + 26 + 10 + 24 simboli = 86 caratteri → 20 × log2(86) ≈ 128,5 bit
  assert.equal(password({ lunghezza: 20, simboli: true }).entropia, "≈ 129 bit");
});

test("password: con «escludi ambigui» non compaiono O 0 o I l 1", () => {
  for (let i = 0; i < 200; i++) {
    assert.doesNotMatch(password({ lunghezza: 64, escludiAmbigui: true }).password, /[O0oIl1]/);
  }
});

test("UUID: formato RFC 9562 versione 4 (nibble di versione 4, variante 10xx)", () => {
  const righe = uuid({ quantita: 100 }).uuid.split("\n");
  assert.equal(righe.length, 100);
  for (const u of righe) assert.match(u, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(new Set(righe).size, 100, "nessun duplicato");
});
