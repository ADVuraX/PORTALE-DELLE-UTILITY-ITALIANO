/**
 * BUILD — generatore statico del Portale Utility.
 *
 *   content/site.json          → configurazione globale + contenuto delle aree
 *   content/tools/{slug}.json  → un file per tool (fonte di verità)
 *          │
 *          ▼  (validazione + template)
 *   public/{slug}/index.html      ← pagine tool
 *   public/{cluster}/index.html   ← pagine area (/calcolatori/, /generatori/, …)
 *   public/index.html             ← homepage
 *   public/sitemap.xml            ← sitemap (home + aree + tool)
 *
 * Zero dipendenze. Fallisce (exit 1) se un tool viola il contratto
 * (docs/tool-config-schema.md), se un'area è incompleta o se due pagine
 * condividono title, keyword o URL.
 * Uso: `npm run build`.
 */
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validateTool, validateSite } from "./lib/validate.mjs";
import { renderToolPage, renderHome, renderClusterPage, renderSitemap } from "./lib/template.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const TOOLS_DIR = path.join(CONTENT, "tools");
const PUBLIC = path.join(ROOT, "public");
const CALC_DIR = path.join(PUBLIC, "assets", "js", "calculators");

const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const YEL = (s) => `\x1b[33m${s}\x1b[0m`;
const GRN = (s) => `\x1b[32m${s}\x1b[0m`;
const CYN = (s) => `\x1b[36m${s}\x1b[0m`;
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

async function emit(dirName, html) {
  const dir = path.join(PUBLIC, dirName);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html, "utf8");
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
  // Le card "tool correlato" leggono qui il nome e l'area del tool linkato.
  const toolsBySlug = new Map(configs.map((c) => [c.slug, c]));

  // --- Validazione ---
  const errors = [];
  const warnings = [];
  for (const cfg of configs) {
    const r = validateTool(cfg, allSlugs, scriptFiles);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  const siteRes = validateSite(configs, site);
  errors.push(...siteRes.errors);
  warnings.push(...siteRes.warnings);

  warnings.forEach((w) => console.log(YEL("  ⚠ " + w)));
  if (errors.length) {
    errors.forEach((e) => console.log(RED("  ✗ " + e)));
    console.log(RED(`\nBuild interrotta: ${errors.length} error${errors.length === 1 ? "e" : "i"}.`));
    process.exit(1);
  }

  // --- Generazione: pagine tool ---
  for (const cfg of configs) {
    await emit(cfg.slug, renderToolPage(cfg, site, toolsBySlug, ver));
    console.log(GRN(`  ✓ ${DIM("/")}${cfg.slug}/`));
  }

  // --- Generazione: pagine area ---
  const clusterKeys = Object.keys(site.clusters);
  for (const key of clusterKeys) {
    const inCluster = configs.filter((c) => c.cluster === key);
    await emit(key, renderClusterPage(site, key, inCluster, ver));
    console.log(CYN(`  ✓ ${DIM("/")}${key}/ ${DIM(`(area · ${inCluster.length} tool)`)}`));
  }

  // --- Generazione: home + sitemap ---
  await writeFile(path.join(PUBLIC, "index.html"), renderHome(site, configs, ver), "utf8");
  await writeFile(path.join(PUBLIC, "sitemap.xml"), renderSitemap(site, configs), "utf8");

  const total = configs.length + clusterKeys.length + 1;
  console.log(GRN(`\n✓ ${configs.length} tool + ${clusterKeys.length} aree + homepage = ${total} URL, sitemap inclusa.`));
  if (warnings.length) console.log(YEL(`  (${warnings.length} warning — non bloccanti)`));
  if (site.domain.includes("TUO-DOMINIO")) {
    console.log(DIM("  Nota: dominio ancora placeholder in content/site.json (domain)."));
  }
}

main().catch((e) => {
  console.error(RED("Errore di build: " + e.message));
  process.exit(1);
});
