/**
 * ESEMPI PUBBLICATI — ogni esempio numerico mostrato in pagina viene
 * ricalcolato dal codice (livello 2 del metodo). Un esempio con
 * `verifica: { input, campo, atteso, tolleranza }` che non torna fa fallire
 * i test: in pagina non può comparire un numero che il calcolatore smentisce.
 *
 * Il valore testuale `risultatoAtteso` deve contenere l'atteso arrotondato
 * all'euro (o il valore testuale esatto per i convertitori), così testo e
 * verifica non possono divergere.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { webcrypto } from "node:crypto";
import { calcolatore, ROOT } from "./carica.mjs";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const dir = path.join(ROOT, "content", "tools");
const configs = readdirSync(dir).filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")));

/** "17838.54" → "17.839": come il valore appare nel testo, arrotondato all'euro. */
const euro = (n) => Math.round(n).toLocaleString("it-IT", { useGrouping: "always" });

for (const cfg of configs) {
  const conVerifica = (cfg.esempi || []).filter((e) => e.verifica);
  if (!conVerifica.length) continue;
  // Gli script "-live" (aggiornamento dei tassi via rete) esistono solo nel
  // browser: nei test si usa la tabella statica, su cui sono scritti gli esempi.
  const dati = (cfg.tool.data || []).filter((d) => !/-live\.js$/.test(d));
  const fn = calcolatore(cfg.tool.logicId, cfg.tool.script, dati);
  for (const es of conVerifica) {
    test(`${cfg.slug} — ${es.titolo}`, () => {
      const { input, campo, atteso, tolleranza = 1, testo } = es.verifica;
      const out = fn(input);
      const reale = out[campo];
      if (testo !== undefined) {
        assert.equal(String(reale), testo, `campo ${campo}`);
        assert.ok(es.risultatoAtteso.includes(testo), `il testo «${es.risultatoAtteso}» non riporta «${testo}»`);
        return;
      }
      assert.ok(typeof reale === "number" && isFinite(reale), `campo ${campo} non numerico: ${reale}`);
      assert.ok(Math.abs(reale - atteso) <= tolleranza,
        `${campo}: calcolatore ${reale.toFixed(2)}, esempio ${atteso} (±${tolleranza})`);
      assert.ok(es.risultatoAtteso.includes(euro(atteso)),
        `il testo «${es.risultatoAtteso}» non riporta ${euro(atteso)}`);
    });
  }
}

test("ogni strumento di calcolo ha almeno un esempio verificato dal codice", () => {
  const senza = configs.filter((c) => c.tool.kind !== "generator" && !(c.esempi || []).some((e) => e.verifica));
  assert.deepEqual(senza.map((c) => c.slug), []);
});
