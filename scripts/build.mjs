/**
 * BUILD — generatore statico del Portale Utility.
 *
 *   content/site.json          → configurazione globale
 *   content/tools/{slug}.json  → un file per tool (fonte di verità)
 *          │
 *          ▼  (validazione + template)
 *   public/{cluster}/{slug}/index.html   ← pagine generate
 *   public/index.html                    ← homepage generata
 *   public/sitemap.xml                   ← sitemap generata
 *
 * Zero dipendenze. Fallisce (exit 1) se un tool viola il contratto
 * (docs/tool-config-schema.md) o se due tool hanno title/keyword uguali.
 * Uso: `npm run build`.
 */
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validateTool, validateSite } from "./lib/validate.mjs";
import { renderToolPage, renderHome, renderSitemap } from "./lib/template.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const TOOLS_DIR = path.join(CONTENT, "tools");
const PUBLIC = path.join(ROOT, "public");
const CALC_DIR = path.join(PUBLIC, "assets", "js", "calculators");

const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const YEL = (s) => `\x1b[33m${s}\x1b[0m`;
const GRN = (s) => `\x1b[32m${s}\x1b[0m`;
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;

/**
 * Cache-busting: hash del contenuto (8 char) di un asset dato il suo URL
 * pubblico (es. "/assets/css/tokens.css") → usato come ?v=<hash>. Gli asset
 * sono serviti con Cache-Control immutable (public/_headers): senza questa
 * versione, gli aggiornamenti CSS/JS non raggiungerebbero i visitatori di ritorno.
 */
const verCache = new Map();
function ver(urlPath) {
  if (verCache.has(urlPath)) return verCache.get(urlPath);
  let h = null;
  try {
    const abs = path.join(PUBLIC, urlPath.replace(/^\//, ""));
    h = createHash("sha1").update(readFileSync(abs)).digest("hex").slice(0, 8);
  } catch (e) {
    h = null; // asset assente (es. relatedTool non costruito): nessuna versione
  }
  verCache.set(urlPath, h);
  return h;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    throw new Error(`JSON non valido in ${path.relative(ROOT, file)}: ${e.message}`);
  }
}

async function main() {
  console.log(DIM("→ build da content/ verso public/"));

  const site = await readJson(path.join(CONTENT, "site.json"));

  const toolFiles = (await readdir(TOOLS_DIR)).filter((f) => f.endsWith(".json"));
  const configs = [];
  for (const f of toolFiles) configs.push(await readJson(path.join(TOOLS_DIR, f)));

  const scriptFiles = new Set(
    (await readdir(CALC_DIR).catch(() => [])).filter((f) => f.endsWith(".js"))
  );
  const allSlugs = new Set(configs.map((c) => c.slug));
  const toolsBySlug = new Map(configs.map((c) => [c.slug, { h1: c.h1, cluster: c.cluster }]));

  // --- Validazione ---
  const errors = [];
  const warnings = [];
  for (const cfg of configs) {
    const r = validateTool(cfg, allSlugs, scriptFiles);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  const siteRes = validateSite(configs);
  errors.push(...siteRes.errors);

  warnings.forEach((w) => console.log(YEL("  ⚠ " + w)));
  if (errors.length) {
    errors.forEach((e) => console.log(RED("  ✗ " + e)));
    console.log(RED(`\nBuild interrotta: ${errors.length} error${errors.length === 1 ? "e" : "i"}.`));
    process.exit(1);
  }

  // --- Generazione ---
  let count = 0;
  for (const cfg of configs) {
    const dir = path.join(PUBLIC, cfg.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), renderToolPage(cfg, site, toolsBySlug, ver), "utf8");
    console.log(GRN(`  ✓ ${DIM("/")}${cfg.slug}/`));
    count++;
  }

  await writeFile(path.join(PUBLIC, "index.html"), renderHome(site, configs, ver), "utf8");
  await writeFile(path.join(PUBLIC, "sitemap.xml"), renderSitemap(site, configs), "utf8");

  console.log(GRN(`\n✓ Generati ${count} tool + homepage + sitemap.`));
  if (warnings.length) console.log(YEL(`  (${warnings.length} warning — non bloccanti)`));
  if (site.domain.includes("TUO-DOMINIO")) {
    console.log(DIM("  Nota: dominio ancora placeholder in content/site.json (domain)."));
  }
}

main().catch((e) => {
  console.error(RED("Errore di build: " + e.message));
  process.exit(1);
});
