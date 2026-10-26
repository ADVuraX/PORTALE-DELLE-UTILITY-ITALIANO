/**
 * IMMAGINI DI ANTEPRIMA (og:image) — una PNG 1200×630 per ogni pagina.
 *
 *   npm run og
 *
 * Per ogni pagina (home, aree, strumenti, pagine istituzionali) compone una
 * scheda HTML con l'identità del sito e la fotografa con Chrome headless in
 * public/assets/og/{chiave}.png. Le PNG sono committate: la build (anche quella
 * di Cloudflare, dove Chrome non c'è) le collega soltanto, e per una pagina
 * senza immagine usa quella della home.
 *
 * Va rilanciato quando cambiano titoli o pagine. Chrome: percorso standard di
 * Windows/macOS/Linux, oppure variabile d'ambiente CHROME_PATH.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(PUBLIC, "assets", "og");
const W = 1200, H = 630;

const CHROME = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => p && existsSync(p));
if (!CHROME) {
  console.error("Chrome non trovato: imposta CHROME_PATH.");
  process.exit(1);
}

const json = (f) => JSON.parse(readFileSync(f, "utf8"));
const site = json(path.join(ROOT, "content", "site.json"));
const tools = readdirSync(path.join(ROOT, "content", "tools")).filter((f) => f.endsWith(".json"))
  .map((f) => json(path.join(ROOT, "content", "tools", f)));
const pagine = readdirSync(path.join(ROOT, "content", "pagine")).filter((f) => f.endsWith(".json"))
  .map((f) => json(path.join(ROOT, "content", "pagine", f)));

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const host = site.domain.replace(/^https?:\/\//, "");
/**
 * "Calcolatore TFR 2026 – Quanto Spetta Netto" → "Quanto Spetta Netto". Maiuscole
 * come nel title, così unità e sigle restano giuste; solo una prima parola
 * comune ("da") prende l'iniziale maiuscola, un'unità ("km/h") no.
 */
const dopoTrattino = (t) => {
  const p = String(t).split(/\s[–—-]\s/)[1] || "";
  return /^[a-zà-ù]+\s/.test(p) ? p.charAt(0).toUpperCase() + p.slice(1) : p;
};

// --- Schede: una per URL indicizzabile ---
const schede = [
  {
    chiave: "home", percorso: "/", kicker: site.brand,
    titolo: site.home.h1,
    sotto: "Calcolatori fiscali, convertitori, generatori e validatori, con fonti ufficiali.",
  },
  ...Object.entries(site.clusters).map(([k, c]) => ({
    chiave: k, percorso: `/${k}/`,
    kicker: `Area · ${tools.filter((t) => t.cluster === k).length} strumenti`,
    titolo: c.h1, sotto: c.hint,
  })),
  ...tools.map((t) => ({
    chiave: t.slug, percorso: `/${t.slug}/`,
    kicker: `${site.clusters[t.cluster].label} · ${t.tool.cardNote}`,
    titolo: t.h1, sotto: dopoTrattino(t.seo.title),
  })),
  ...pagine.map((p) => ({
    chiave: p.slug, percorso: `/${p.slug}/`,
    kicker: p.kicker || p.etichetta || site.brand, titolo: p.titolo, sotto: "",
  })),
];

// Font self-hosted del sito, riletti da file (Chrome apre la scheda come file://).
const fontsCss = readFileSync(path.join(PUBLIC, "assets", "css", "fonts.css"), "utf8")
  .replace(/url\(\/assets\//g, `url(${pathToFileURL(path.join(PUBLIC, "assets")).href}/`);

function html(s) {
  const n = s.titolo.length;
  const size = n <= 22 ? 92 : n <= 34 ? 78 : n <= 48 ? 66 : 56;
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><style>
${fontsCss}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{background:#F4F1E9;color:#17150F;font-family:"IBM Plex Sans",sans-serif;position:relative}
.col{position:absolute;left:80px;top:72px;width:860px;height:${H - 72 - 120}px;display:flex;flex-direction:column}
.kicker{font-family:"IBM Plex Mono",monospace;font-size:22px;letter-spacing:.12em;text-transform:uppercase;color:#8B8474}
.kicker b{color:#0B5560;font-weight:400}
h1{font-family:"Fraunces",serif;font-weight:600;font-size:${size}px;line-height:1.04;letter-spacing:-.015em;margin-top:auto;
   display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.sotto{font-size:30px;line-height:1.3;color:#4D473C;margin-top:22px;max-width:820px;
   display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.marchio{position:absolute;right:80px;top:72px;width:112px;height:112px;background:#0B5560;
   clip-path:polygon(0 0,100% 0,100% 72%,72% 100%,0 100%);
   font-family:"Fraunces",serif;font-weight:600;font-size:76px;line-height:112px;color:#F4F1E9;padding-left:26px}
.piede{position:absolute;left:80px;right:80px;bottom:52px;border-top:1px solid #C2BAA6;padding-top:22px;
   display:flex;justify-content:space-between;font-family:"IBM Plex Mono",monospace;font-size:22px;color:#4D473C}
.piede span:last-child{color:#8B8474}
</style></head><body>
<div class="col">
  <div class="kicker"><b>■</b> ${esc(s.kicker)}</div>
  <h1>${esc(s.titolo)}</h1>
  ${s.sotto ? `<p class="sotto">${esc(s.sotto)}</p>` : ""}
</div>
<div class="marchio">U</div>
<div class="piede"><span>${esc(host + s.percorso)}</span><span>${esc(site.brand)}</span></div>
</body></html>`;
}

/** Larghezza e altezza dall'intestazione IHDR della PNG. */
function misure(file) {
  const b = readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

mkdirSync(OUT, { recursive: true });
const tmp = path.join(tmpdir(), `og-${process.pid}`);
mkdirSync(tmp, { recursive: true });
const profilo = path.join(tmp, "profilo"); // profilo separato: non tocca il Chrome aperto

let errori = 0;
for (const s of schede) {
  const pagina = path.join(tmp, `${s.chiave}.html`);
  const png = path.join(OUT, `${s.chiave}.png`);
  writeFileSync(pagina, html(s), "utf8");
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    `--user-data-dir=${profilo}`, "--force-device-scale-factor=1",
    `--window-size=${W},${H}`, "--virtual-time-budget=4000",
    `--screenshot=${png}`, pathToFileURL(pagina).href,
  ], { stdio: "ignore" });
  const [w, h] = misure(png);
  const ok = w === W && h === H;
  if (!ok) errori++;
  console.log(`${ok ? "✓" : "✗"} ${s.percorso.padEnd(40)} ${w}×${h}`);
}
rmSync(tmp, { recursive: true, force: true });
console.log(errori ? `\n${errori} immagini con misure errate.` : `\n${schede.length} immagini in public/assets/og/.`);
process.exit(errori ? 1 : 0);
