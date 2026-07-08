/**
 * FETCH-FONTS — scarica i font da Google e li self-hosta in
 * public/assets/fonts/, generando public/assets/css/fonts.css con url()
 * locali. Obiettivo: nessuna chiamata a Google in produzione (GDPR) e
 * niente render-blocking esterno.
 *
 * Uso: `npm run fonts` (una tantum, o quando cambiano i font).
 * Se la rete non è disponibile, scrive un fonts.css minimale che usa solo
 * i fallback di sistema già definiti in tokens.css — il sito resta valido.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONTS_DIR = path.join(ROOT, "public", "assets", "fonts");
const CSS_OUT = path.join(ROOT, "public", "assets", "css", "fonts.css");

const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;600&display=swap";
// UA moderno → Google restituisce woff2
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function slugFont(family, weight, i) {
  return family.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + weight + "-" + i + ".woff2";
}

async function main() {
  await mkdir(FONTS_DIR, { recursive: true });

  const res = await fetch(CSS_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  let css = await res.text();

  // Ogni @font-face ha family, weight e una src url(...woff2)
  const blocks = css.match(/@font-face\s*{[^}]+}/g) || [];
  let out = "/* Font self-hosted — generato da scripts/fetch-fonts.mjs */\n";
  let downloaded = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const family = (block.match(/font-family:\s*'([^']+)'/) || [])[1];
    const weight = (block.match(/font-weight:\s*(\d+)/) || [])[1] || "400";
    const url = (block.match(/url\((https:\/\/[^)]+\.woff2)\)/) || [])[1];
    if (!family || !url) continue;

    const fname = slugFont(family, weight, i);
    const bin = await fetch(url, { headers: { "User-Agent": UA } });
    if (!bin.ok) continue;
    await writeFile(path.join(FONTS_DIR, fname), Buffer.from(await bin.arrayBuffer()));
    downloaded++;

    out += block.replace(/url\(https:\/\/[^)]+\.woff2\)/, `url(/assets/fonts/${fname})`) + "\n";
  }

  if (!downloaded) throw new Error("nessun woff2 scaricato");
  await writeFile(CSS_OUT, out, "utf8");
  console.log(`\x1b[32m✓ ${downloaded} font self-hostati in public/assets/fonts/\x1b[0m`);
}

main().catch(async (e) => {
  console.warn(`\x1b[33m⚠ font non scaricati (${e.message}) — uso i fallback di sistema.\x1b[0m`);
  await writeFile(
    CSS_OUT,
    "/* Font non self-hostati: fallback di sistema definiti in tokens.css.\n" +
      "   Esegui `npm run fonts` con rete per scaricare i woff2. */\n",
    "utf8"
  ).catch(() => {});
});
