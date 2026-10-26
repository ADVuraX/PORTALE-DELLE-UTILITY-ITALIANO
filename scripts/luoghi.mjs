/**
 * LUOGHI DI NASCITA — tabella dei codici catastali per il calcolo del codice
 * fiscale (D.M. 23/12/1976, art. 5: comune italiano o Stato estero di nascita).
 *
 *   npm run luoghi
 *
 * Scarica le due fonti ufficiali ISTAT e scrive
 * public/assets/js/data/luoghi-catastali.js (committato: la build lo copia
 * soltanto, non usa la rete):
 *  - comuni italiani attivi con «Codice Catastale del comune»
 *    (Elenco-comuni-italiani.csv);
 *  - Stati esteri attivi con il codice dell'Agenzia delle Entrate (COD_AT),
 *    dal portale SITUAS (report 466, «Elenco codici e denominazioni delle
 *    unità territoriali estere»).
 * I comuni soppressi o fusi non sono negli elenchi attivi: per quelli lo
 * strumento accetta il codice catastale scritto a mano.
 *
 * Va rilanciato quando l'ISTAT pubblica variazioni (nuovi comuni, fusioni).
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "assets", "js", "data", "luoghi-catastali.js");
const COMUNI = "https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv";
const oggi = new Date();
const gg = `${String(oggi.getDate()).padStart(2, "0")}/${String(oggi.getMonth() + 1).padStart(2, "0")}/${oggi.getFullYear()}`;
const ESTERI = `https://situas-servizi.istat.it/publish/reportspooljson?pfun=466&pdata=${gg}`;
const UA = { "user-agent": "Mozilla/5.0 (aggiornamento dati; utilityitalia.it)" };

async function scarica(url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/** CSV ISTAT: separatore ";", campi tra virgolette con a capo interni. */
function csv(testo) {
  const righe = [];
  let riga = [], campo = "", q = false;
  for (let i = 0; i < testo.length; i++) {
    const c = testo[i];
    if (q) {
      if (c === '"') { if (testo[i + 1] === '"') { campo += '"'; i++; } else q = false; }
      else campo += c;
    } else if (c === '"') q = true;
    else if (c === ";") { riga.push(campo); campo = ""; }
    else if (c === "\n") { riga.push(campo.replace(/\r$/, "")); righe.push(riga); riga = []; campo = ""; }
    else campo += c;
  }
  if (campo || riga.length) { riga.push(campo); righe.push(riga); }
  return righe;
}

// --- Comuni ---
const buf = await scarica(COMUNI);
let testo = new TextDecoder("utf-8").decode(buf);
if (testo.includes("�")) testo = new TextDecoder("latin1").decode(buf); // il file ISTAT è talvolta in Latin-1
const righe = csv(testo);
const intest = righe[0].map((h) => h.replace(/\s+/g, " ").trim());
const col = (re) => {
  const i = intest.findIndex((h) => re.test(h));
  if (i < 0) throw new Error(`colonna ${re} assente nel CSV ISTAT`);
  return i;
};
const iNome = col(/^Denominazione in italiano$/), iAltra = col(/^Denominazione altra lingua$/);
const iSigla = col(/^Sigla automobilistica$/), iCat = col(/^Codice Catastale del comune$/);

const voci = [];
for (const r of righe.slice(1)) {
  const cat = (r[iCat] || "").trim();
  if (!/^[A-Z]\d{3}$/.test(cat)) continue;
  const alias = (r[iAltra] || "").trim();
  voci.push([r[iNome].trim(), r[iSigla].trim(), cat, alias]);
}
const nComuni = voci.length;

// --- Stati esteri ---
const esteri = JSON.parse((await scarica(ESTERI)).toString("utf8")).resultset;
for (const s of esteri) {
  if (!s.COD_AT || !/^Z\d{3}$/.test(s.COD_AT)) continue; // Italia e territori senza codice AdE
  const nomi = new Set();
  const aggiungi = (n) => {
    n = n.replace(/\s+/g, " ").trim();
    if (!n) return;
    nomi.add(n.replace(/\s*\(.*?\)\s*/g, " ").trim());
    const dentro = (n.match(/\((?:ex\s+)?([^)]+)\)/i) || [])[1]; // "Sri Lanka (ex Ceylon)" → Ceylon
    if (dentro) nomi.add(dentro.trim());
  };
  s.DENOMINAZIONE_IT.split("/").forEach(aggiungi);
  (s.ALTRA_DESCRIZIONE_IT || "").split(";").forEach(aggiungi);
  const [principale, ...altri] = [...nomi].filter(Boolean);
  voci.push([s.DENOMINAZIONE_IT.trim(), "EE", s.COD_AT, [principale, ...altri].filter((n) => n !== s.DENOMINAZIONE_IT.trim()).join(";")]);
}
const nEsteri = voci.length - nComuni;
if (nComuni < 7500 || nEsteri < 200) throw new Error(`dati sospetti: ${nComuni} comuni, ${nEsteri} Stati esteri`);

// Una riga per luogo: nome|sigla|codice|alias1;alias2 (alias vuoto se assente).
const righeOut = voci.map((v) => v.map((x) => x.replace(/[|\n]/g, " ")).join("|").replace(/\|$/, ""));
const js = `/**
 * LUOGHI DI NASCITA E CODICI CATASTALI — generato da scripts/luoghi.mjs
 * (npm run luoghi) il ${gg}. Non modificare a mano.
 *
 * FONTI: ISTAT, Elenco dei comuni italiani (colonna «Codice Catastale del
 * comune»); ISTAT SITUAS, report 466 «Elenco codici e denominazioni delle
 * unità territoriali estere» (codice Agenzia delle Entrate). ${nComuni} comuni attivi,
 * ${nEsteri} Stati esteri. Formato riga: nome|sigla provincia (EE = estero)|codice|alias.
 */
(function (root) {
  root.LUOGHI_CATASTALI = ${JSON.stringify(righeOut.join("\n"))};
})(typeof window !== "undefined" ? window : globalThis);
`;
writeFileSync(OUT, js, "utf8");
console.log(`✓ ${nComuni} comuni + ${nEsteri} Stati esteri → ${path.relative(ROOT, OUT)} (${(js.length / 1024).toFixed(0)} KB)`);
