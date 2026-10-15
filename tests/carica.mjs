/**
 * Carica in Node i file di dati e i calcolatori del browser, così come li
 * carica la pagina: script "classici" che si appoggiano a globalThis e si
 * registrano con registerCalculator(). Nessuna dipendenza.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registro = {};
globalThis.registerCalculator = (id, fn) => { registro[id] = fn; };

const caricati = new Set();
function esegui(rel) {
  if (caricati.has(rel)) return;
  caricati.add(rel);
  const file = path.join(ROOT, "public", "assets", "js", rel);
  vm.runInThisContext(readFileSync(file, "utf8"), { filename: file });
}

/** Restituisce la funzione registrata, dopo aver caricato dati e script. */
export function calcolatore(logicId, script, dati = []) {
  dati.forEach((d) => esegui("data/" + d));
  esegui("calculators/" + script);
  const fn = registro[logicId];
  if (typeof fn !== "function") throw new Error(`calcolatore ${logicId} non registrato da ${script}`);
  return fn;
}

export { ROOT };
