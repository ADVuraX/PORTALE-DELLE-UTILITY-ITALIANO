/**
 * INDICE FOI — aggiunge a public/assets/js/data/istat-foi.js l'ultimo indice
 * mensile pubblicato dall'ISTAT (FOI senza tabacchi, indice generale).
 *
 *   npm run foi
 *
 * Legge la pagina ISTAT «Indice dei prezzi per le rivalutazioni monetarie»,
 * che riporta mese di riferimento, base e valore dell'ultimo indice. Poi:
 *  - se il mese è già nella serie, controlla che il valore coincida;
 *  - se è il mese successivo all'ultimo, lo aggiunge;
 *  - aggiorna i valori iniziali del calcolatore (ultimo mese e lo stesso mese
 *    dell'anno prima) in content/tools/rivalutazione-istat-affitto.json.
 * Si ferma se manca più di un mese o se la base è cambiata: in quei casi va
 * riscaricata la tavola ISTAT (vedi la testata di istat-foi.js).
 *
 * L'ISTAT pubblica l'indice di un mese verso la metà del mese successivo.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATI = path.join(ROOT, "public", "assets", "js", "data", "istat-foi.js");
const TOOL = path.join(ROOT, "content", "tools", "rivalutazione-istat-affitto.json");
const PAGINA = "https://www.istat.it/notizia/indice-dei-prezzi-per-le-rivalutazioni-monetarie/";
const UA = { "user-agent": "Mozilla/5.0 (aggiornamento dati; utilityitalia.it)" };
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio",
  "agosto", "settembre", "ottobre", "novembre", "dicembre"];

/** Esegue il file dati in un contesto isolato: `globalThis.FOI` finisce sul contesto. */
function leggiDati(testo) {
  const ctx = {};
  vm.runInNewContext(testo, ctx);
  return ctx.FOI;
}

const r = await fetch(PAGINA, { headers: UA, signal: AbortSignal.timeout(60000) });
if (!r.ok) throw new Error(`${PAGINA} → HTTP ${r.status}`);
const testoPagina = (await r.text())
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ");

const periodo = testoPagina.match(/Periodo di riferimento:\s*([A-Za-z]+)\s+(\d{4})/i);
const valore = testoPagina.match(/Indice generale FOI \(base di riferimento (\d{4})=100\)\s*\*?\s*(\d{2,3},\d)/i);
if (!periodo || !valore) throw new Error("Pagina ISTAT cambiata: mese o indice non trovati. Controllare a mano " + PAGINA);

const m = MESI.indexOf(periodo[1].toLowerCase()) + 1;
if (!m) throw new Error("Mese non riconosciuto: " + periodo[1]);
const anno = Number(periodo[2]);
const ym = `${anno}-${String(m).padStart(2, "0")}`;
const base = Number(valore[1]);
const indice = Number(valore[2].replace(",", "."));

let testo = readFileSync(DATI, "utf8");
const FOI = leggiDati(testo);
const ultimaBase = FOI.basi[FOI.basi.length - 1].base;
if (base !== ultimaBase) {
  throw new Error(`L'ISTAT pubblica in base ${base}=100, i dati sono in base ${ultimaBase}: riscaricare la tavola e aggiungere il coefficiente di raccordo.`);
}

const [ua, um] = FOI.aggiornato.split("-").map(Number);
const prossimo = um === 12 ? `${ua + 1}-01` : `${ua}-${String(um + 1).padStart(2, "0")}`;

if (ym <= FOI.aggiornato) {
  const presente = FOI.serie[anno] && FOI.serie[anno][m - 1];
  if (presente !== indice) throw new Error(`${ym}: nella serie ${presente}, l'ISTAT pubblica ${indice}. Verificare.`);
  console.log(`Già aggiornato: ${MESI[m - 1]} ${anno} = ${indice} (base ${base}).`);
} else if (ym === prossimo) {
  const riga = new RegExp(`^(\\s*${anno}: \\[)([^\\]]*)(\\],)$`, "m");
  const v = indice.toFixed(1);
  if (riga.test(testo)) testo = testo.replace(riga, (_, a, b, c) => `${a}${b}, ${v}${c}`);
  else testo = testo.replace(/^(\s*)(\d{4}): \[([^\]]*)\],\n(\s*\},)/m, (t, sp, y, vals, chiusa) => `${sp}${y}: [${vals}],\n${sp}${anno}: [${v}],\n${chiusa}`);
  testo = testo.replace(/aggiornato: "\d{4}-\d{2}"/, `aggiornato: "${ym}"`);
  const verifica = leggiDati(testo);
  if (verifica.serie[anno][m - 1] !== indice || verifica.aggiornato !== ym) throw new Error("Scrittura non riuscita: controllare istat-foi.js");
  writeFileSync(DATI, testo);
  console.log(`Aggiunto ${MESI[m - 1]} ${anno} = ${indice} (base ${base}).`);
} else {
  throw new Error(`L'ISTAT è a ${ym}, la serie a ${FOI.aggiornato}: manca più di un mese. Riscaricare la tavola ISTAT.`);
}

// Valori iniziali del calcolatore: ultimo indice e stesso mese dell'anno prima.
const cfg = JSON.parse(readFileSync(TOOL, "utf8"));
const imposta = (id, valore) => {
  const foglie = cfg.tool.inputs.flatMap((i) => (i.type === "group" ? i.inputs : [i]));
  const campo = foglie.find((i) => i.id === id);
  if (!campo) throw new Error(`Campo ${id} non trovato in ${TOOL}`);
  campo.default = valore;
  if (id.startsWith("anno")) campo.max = anno;
};
imposta("meseA", m); imposta("annoA", anno);
imposta("meseDa", m); imposta("annoDa", anno - 1);
writeFileSync(TOOL, JSON.stringify(cfg, null, 2) + "\n");
console.log(`Calcolatore: da ${MESI[m - 1]} ${anno - 1} a ${MESI[m - 1]} ${anno}.`);
