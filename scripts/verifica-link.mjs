/**
 * VERIFICA DEI LINK — livello 1 del metodo (docs/verifica/metodo.md).
 * Controlla che ogni URL esterno citato nei contenuti (fonti dei tool, testi
 * delle pagine istituzionali e delle aree) risponda. Usa la rete, quindi non
 * fa parte della build: si lancia a mano prima di pubblicare.
 *
 *   npm run verifica:link
 *
 * Esito: elenco dei link con stato HTTP; exit 1 se qualcuno è rotto (4xx/5xx
 * o irraggiungibile). Alcuni siti istituzionali rifiutano le richieste
 * automatiche con 403: vanno aperti a mano e, se funzionano, annotati in
 * ECCEZIONI con la data del controllo.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Siti che bloccano i client automatici ma sono stati verificati a mano. */
const ECCEZIONI = {
  "https://www.covip.it/per-il-cittadino/educazione-previdenziale/faq/trattamento-fiscale":
    "403 ai client automatici; contenuto confermato da motore di ricerca il 2026-10-15 — aprire a mano prima di pubblicare",
  "https://www.iso.org/standard/83389.html":
    "403 ai client automatici; scheda ISO/IEC 18004:2024 confermata da motore di ricerca il 2026-10-15 — aprire a mano prima di pubblicare",
};

function raccogli() {
  const urls = new Map(); // url → dove compare
  const add = (u, dove) => {
    if (!/^https?:\/\//.test(u)) return;
    if (!urls.has(u)) urls.set(u, new Set());
    urls.get(u).add(dove);
  };
  const scan = (testo, dove) => {
    for (const m of String(testo).matchAll(/\((https?:\/\/[^)\s]+)\)/g)) add(m[1], dove);
  };
  for (const f of readdirSync(path.join(ROOT, "content", "tools"))) {
    const c = JSON.parse(readFileSync(path.join(ROOT, "content", "tools", f), "utf8"));
    (c.fonti || []).forEach((x) => x.url && add(x.url, c.slug));
    scan(JSON.stringify(c.spiegazione), c.slug);
  }
  for (const f of readdirSync(path.join(ROOT, "content", "pagine"))) {
    const p = JSON.parse(readFileSync(path.join(ROOT, "content", "pagine", f), "utf8"));
    scan(JSON.stringify(p), `pagina:${p.slug}`);
  }
  return urls;
}

async function controlla(url) {
  if (ECCEZIONI[url]) return { stato: "ECCEZIONE", nota: ECCEZIONI[url] };
  const opzioni = (method) => ({
    method, redirect: "follow", signal: AbortSignal.timeout(20000),
    headers: { "user-agent": "Mozilla/5.0 (verifica link; portale utility)", accept: "text/html,application/pdf,*/*" },
  });
  try {
    let r = await fetch(url, opzioni("HEAD"));
    if (r.status >= 400) r = await fetch(url, opzioni("GET")); // alcuni server rifiutano HEAD
    return { stato: r.status };
  } catch (e) {
    return { stato: "ERRORE", nota: e.cause ? e.cause.code || e.message : e.message };
  }
}

const urls = raccogli();
console.log(`Controllo ${urls.size} link esterni…\n`);
let rotti = 0;
const risultati = await Promise.all([...urls.keys()].map(async (u) => [u, await controlla(u)]));
for (const [u, r] of risultati.sort((a, b) => String(a[1].stato).localeCompare(String(b[1].stato)))) {
  const ok = r.stato === "ECCEZIONE" || (typeof r.stato === "number" && r.stato < 400);
  if (!ok) rotti++;
  console.log(`${ok ? "ok " : "NO "} ${String(r.stato).padEnd(9)} ${u}${r.nota ? `  (${r.nota})` : ""}`);
  if (!ok) console.log(`      usato in: ${[...urls.get(u)].join(", ")}`);
}
console.log(rotti ? `\n${rotti} link da sistemare.` : "\nTutti i link rispondono.");
process.exit(rotti ? 1 : 0);
