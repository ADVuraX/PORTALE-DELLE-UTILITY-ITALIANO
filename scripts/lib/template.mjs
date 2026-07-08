/**
 * TEMPLATE — genera HTML statico dai config. Nessun contenuto renderizzato
 * a runtime: tutto il testo è nel markup per il SEO. Il runtime.js aggiunge
 * solo l'interattività del calcolo. Stile: "scheda civica raffinata".
 */

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const titolo = (s) => String(s || "").replace(/-/g, " ");

/** Appende ?v=<hash> a un URL asset per il cache-busting (ver = funzione da build.mjs). */
const withV = (url, ver) => {
  const h = ver && ver(url);
  return h ? `${url}?v=${h}` : url;
};

const MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
function fmtUpdated(updated) {
  // "2026-01" → "gennaio 2026"; "2026" → "2026"
  const m = String(updated || "").match(/^(\d{4})(?:-(\d{2}))?/);
  if (!m) return "";
  return m[2] ? `${MESI[Number(m[2]) - 1]} ${m[1]}` : m[1];
}
function isoDate(updated) {
  const m = String(updated || "").match(/^(\d{4})(?:-(\d{2}))?/);
  if (!m) return undefined;
  return `${m[1]}-${m[2] || "01"}-01`;
}

const ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
};

function head(site, { title, description, canonical, jsonLdBlocks = [] }, ver) {
  const url = site.domain + canonical;
  const ld = jsonLdBlocks
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="${site.lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<script>(function(){try{var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}})();
window.__toggleTheme=function(){var d=document.documentElement,cur=d.getAttribute("data-theme"),sysDark=matchMedia("(prefers-color-scheme:dark)").matches,next=cur?(cur==="dark"?"light":"dark"):(sysDark?"light":"dark");d.setAttribute("data-theme",next);try{localStorage.setItem("theme",next);}catch(e){}var b=document.querySelector(".theme-toggle");if(b)b.setAttribute("aria-pressed",String(next==="dark"));};</script>
<link rel="stylesheet" href="${withV("/assets/css/fonts.css", ver)}">
<link rel="stylesheet" href="${withV("/assets/css/tokens.css", ver)}">
${ld}
</head>`;
}

const THEME_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" fill="currentColor" stroke="none"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>';

function header(site, breadcrumb) {
  return `<header class="head">
  <div class="wrap">
    <a class="logo" href="/">${esc(site.brand.replace(site.brandAccent, ""))}<b>${esc(site.brandAccent)}</b></a>
    <div class="head-right">
      <div class="crumbs">${breadcrumb}</div>
      <button class="theme-toggle" type="button" onclick="__toggleTheme()" aria-label="Cambia tema chiaro o scuro" aria-pressed="false" title="Tema chiaro / scuro">${THEME_ICON}</button>
    </div>
  </div>
</header>`;
}

const footer = (site) =>
  `<footer class="foot"><div class="wrap">${esc(site.footer)}</div></footer>`;

/** Appiattisce eventuali gruppi in una lista di soli input foglia (per il runtime). */
function flattenInputs(inputs) {
  const out = [];
  for (const i of inputs || []) {
    if (i.type === "group") out.push(...flattenInputs(i.inputs));
    else out.push(i);
  }
  return out;
}

function controlFor(inp) {
  if (inp.type === "select") {
    const opts = inp.options
      .map((o) => {
        const label = inp.optionLabels && inp.optionLabels[o] ? inp.optionLabels[o] : o;
        return `<option value="${esc(o)}"${o === inp.default ? " selected" : ""}>${esc(label)}</option>`;
      })
      .join("");
    return `<div class="control sel"><select id="in-${esc(inp.id)}">${opts}</select></div>`;
  }
  if (inp.type === "radio") {
    const opts = inp.options
      .map((o) => {
        const label = inp.optionLabels && inp.optionLabels[o] ? inp.optionLabels[o] : o;
        return `<label class="radio"><input type="radio" name="in-${esc(inp.id)}" value="${esc(o)}"${o === inp.default ? " checked" : ""}><span>${esc(label)}</span></label>`;
      })
      .join("");
    return `<div class="radios">${opts}</div>`;
  }
  if (inp.type === "text") {
    return `<div class="control"><input type="text" id="in-${esc(inp.id)}" value="${esc(inp.default ?? "")}"${inp.placeholder ? ` placeholder="${esc(inp.placeholder)}"` : ""}></div>`;
  }
  const attrs = ["min", "max", "step"]
    .filter((k) => inp[k] !== undefined)
    .map((k) => `${k}="${esc(inp[k])}"`)
    .join(" ");
  const suffix = inp.suffix ? `<span class="suffix">${esc(inp.suffix)}</span>` : "";
  const cls = inp.suffix ? "control has-suffix" : "control";
  return `<div class="${cls}"><input type="number" id="in-${esc(inp.id)}" inputmode="numeric" ${attrs} value="${esc(inp.default ?? 0)}">${suffix}</div>`;
}

/** Un singolo campo o gruppo. `showIf` → attributo DOM letto dal runtime per il toggle. */
function renderField(inp) {
  const sif = inp.showIf ? ` data-showif="${esc(JSON.stringify(inp.showIf))}"` : "";
  if (inp.type === "group") {
    return `<fieldset class="group"${sif}>${inp.legend ? `<legend>${esc(inp.legend)}</legend>` : ""}
            ${inp.inputs.map(renderField).join("\n            ")}
          </fieldset>`;
  }
  const hint = inp.hint ? ` <span class="hint">${esc(inp.hint)}</span>` : "";
  if (inp.type === "checkbox") {
    return `<div class="field field-check"${sif}>
            <label class="check"><input type="checkbox" id="in-${esc(inp.id)}"${inp.default ? " checked" : ""}><span>${esc(inp.label)}${hint}</span></label>
          </div>`;
  }
  const labelTag =
    inp.type === "radio"
      ? `<span class="flabel" id="lbl-${esc(inp.id)}">${esc(inp.label)}${hint}</span>`
      : `<label for="in-${esc(inp.id)}">${esc(inp.label)}${hint}</label>`;
  return `<div class="field field-${esc(inp.type)}"${sif}>
            ${labelTag}
            ${controlFor(inp)}
          </div>`;
}

function renderInputs(inputs) {
  return inputs.map(renderField).join("\n          ");
}

function jsonLdFor(cfg, site) {
  const url = site.domain + cfg.seo.canonical;
  const app = {
    "@context": "https://schema.org",
    "@type": cfg.jsonLd.type,
    name: cfg.seo.title,
    applicationCategory: cfg.jsonLd.applicationCategory,
    operatingSystem: "Web",
    url,
    description: cfg.seo.metaDescription,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };
  const dm = isoDate(cfg.updated);
  if (dm) app.dateModified = dm;
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cfg.faq.map((f) => ({
      "@type": "Question",
      name: f.domanda,
      acceptedAnswer: { "@type": "Answer", text: f.risposta },
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.domain + "/" },
      { "@type": "ListItem", position: 2, name: cfg.cluster, item: `${site.domain}/${cfg.cluster}/` },
      { "@type": "ListItem", position: 3, name: cfg.h1, item: url },
    ],
  };
  return [app, faq, breadcrumb];
}

/**
 * Pagina tool completa.
 * @param toolsBySlug Map<slug,{h1,cluster}> per i link correlati.
 */
export function renderToolPage(cfg, site, toolsBySlug, ver) {
  const tool = cfg.tool;
  const updated = fmtUpdated(cfg.updated);
  const runtimeConfig = {
    logicId: tool.logicId,
    inputs: flattenInputs(tool.inputs).map((i) => ({ id: i.id, type: i.type })),
    outputPrimary: { id: tool.outputPrimary.id, format: tool.outputPrimary.format },
    outputSecondary: (tool.outputSecondary || []).map((o) => ({ id: o.id, label: o.label, format: o.format })),
    breakdown: (tool.breakdown || []).map((b) => ({ id: b.id, kind: b.kind, format: b.format || "currency", provisional: !!b.provisional })),
    extras: (tool.extras || []).map((e) => ({ id: e.id, format: e.format })),
  };

  const pills = [];
  if (cfg.fonti && cfg.fonti.length) pills.push(`<span class="pill pill-ok">${ICON.check}Fonti citate</span>`);
  if (updated) pills.push(`<span class="pill">${ICON.clock}Aggiornato ${esc(updated)}</span>`);
  pills.push(`<span class="pill">Gratuito · nessuna registrazione</span>`);

  const secondaryCells = (tool.outputSecondary || [])
    .map((o) => `<div class="cell"><span class="k">${esc(o.label)}</span><span class="v" data-out="${esc(o.id)}">—</span></div>`)
    .join("");

  // Bilancio "dal lordo al netto": righe con segno (entrate +, uscite −).
  let resultDetail;
  if (tool.breakdown && tool.breakdown.length) {
    const rows = tool.breakdown
      .map(
        (b) => `<div class="lrow lrow-${esc(b.kind)}${b.provisional ? " lrow-prov" : ""}">
            <span class="ll">${esc(b.label)}${b.provisional ? ' <span class="ltag">in arrivo</span>' : ""}</span>
            <span class="la" data-out="${esc(b.id)}">—</span>
          </div>`
      )
      .join("\n          ");
    resultDetail = `<div class="ledger">
          ${tool.breakdownTitle ? `<div class="ledger-head">${esc(tool.breakdownTitle)}</div>` : ""}
          ${rows}
        </div>`;
  } else {
    resultDetail = `<div class="secondary" data-out-secondary>${secondaryCells}</div>`;
  }

  const extrasHtml =
    tool.extras && tool.extras.length
      ? `<p class="result-note">${tool.extras
          .map((e) => `${esc(e.label)}: <span data-out="${esc(e.id)}">—</span>`)
          .join(" · ")}</p>`
      : "";

  const disclaimer = cfg.disclaimer
    ? `<div class="note" id="disc">${ICON.info}<p>${cfg.disclaimer}</p></div>`
    : "";

  const esempi = cfg.esempi
    .map((es) => `<div class="ex"><div class="exq">${esc(es.titolo)}</div><div class="exr">${esc(es.risultatoAtteso)}</div></div>`)
    .join("\n        ");

  const faq = cfg.faq
    .map(
      (f, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(f.domanda)}<span class="plus" aria-hidden="true"></span></summary><div class="ans"><p>${esc(f.risposta)}</p></div></details>`
    )
    .join("\n      ");

  const fonti =
    cfg.fonti && cfg.fonti.length
      ? `
  <section class="section">
    <div class="wrap">
      <div class="fonti">
        <div class="fonti-head">
          <h3>Fonti e metodo</h3>
          ${updated ? `<span class="upd">Ultimo aggiornamento: ${esc(updated)}</span>` : ""}
        </div>
        ${cfg.fonti
          .map((f, i) => {
            const n = String(i + 1).padStart(2, "0");
            const t = f.url
              ? `<a class="t" href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`
              : `<span class="t">${esc(f.titolo)}</span>`;
            return `<div class="src"><span class="n">${n}</span><div class="b"><div class="t">${t}</div>${f.dettaglio ? `<div class="d">${esc(f.dettaglio)}</div>` : ""}</div></div>`;
          })
          .join("\n        ")}
      </div>
    </div>
  </section>`
      : "";

  const related = cfg.relatedTools
    .map((slug) => {
      const t = toolsBySlug.get(slug);
      if (t) {
        return `<a class="rel" href="/${esc(t.cluster)}/${esc(slug)}/"><span class="re">Tool correlato</span><span class="rn">${esc(titolo(slug))}</span></a>`;
      }
      return `<div class="rel rel-off"><span class="re">In programma</span><span class="rn">${esc(titolo(slug))}</span></div>`;
    })
    .join("\n        ");

  return `${head(site, {
    title: cfg.seo.title,
    description: cfg.seo.metaDescription,
    canonical: cfg.seo.canonical,
    jsonLdBlocks: jsonLdFor(cfg, site),
  }, ver)}
<body>

<a class="skip" href="#tool">Salta al calcolatore</a>

${header(site, `${esc(cfg.cluster)} / <span>${esc(titolo(cfg.slug).replace(/^calcolatore |^generatore /, ""))}</span>`)}

<main>
  <section class="hero">
    <div class="wrap hero-lead">
      <p class="eyebrow">${esc(cfg.tema)}</p>
      <h1>${esc(cfg.h1)}</h1>
      <p class="lede">${esc(cfg.intro)}</p>
      <div class="meta-row">
        ${pills.join("\n        ")}
      </div>
    </div>
  </section>

  <section class="tool" id="tool" data-tool>
    <div class="wrap tool-grid">
      <div class="card card-in">
        <div class="card-top"><span>I tuoi dati</span>${tool.cardNote ? `<span class="chip">${esc(tool.cardNote)}</span>` : ""}</div>
        <form data-tool-form${disclaimer ? ' aria-describedby="disc"' : ""}>
          ${renderInputs(tool.inputs)}
        </form>
      </div>
      <div class="card card-out" data-result-card>
        <div class="card-top"><span>Risultato</span><span class="chip chip-soft">stima</span></div>
        <div class="result" aria-live="polite">
          <div class="rlabel">${esc(tool.outputPrimary.label)}</div>
          <div class="value" data-out-primary>—</div>
          <div class="value-underline"></div>
          ${resultDetail}
          ${extrasHtml}
        </div>
        ${disclaimer}
      </div>
      <script type="application/json" data-tool-config>${JSON.stringify(runtimeConfig)}</script>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <h2>${esc(cfg.spiegazione.titolo)}</h2>
      <div class="prose"><p>${esc(cfg.spiegazione.corpo)}</p></div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <h2>Esempi pratici</h2>
      <div class="examples">
        ${esempi}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap faq">
      <h2>Domande frequenti</h2>
      ${faq}
    </div>
  </section>
${fonti}
  <section class="section">
    <div class="wrap">
      <h2>Tool correlati</h2>
      <div class="related">
        ${related}
      </div>
    </div>
  </section>
</main>

${footer(site)}

<script src="${withV("/assets/js/runtime.js", ver)}"></script>
${(tool.data || []).map((d) => `<script src="${withV("/assets/js/data/" + d, ver)}"></script>`).join("\n")}
<script src="${withV("/assets/js/calculators/" + tool.script, ver)}"></script>
</body>
</html>
`;
}

/** Homepage generata: card dei cluster (live / in arrivo). */
export function renderHome(site, tools, ver) {
  const liveByCluster = {};
  for (const t of tools) (liveByCluster[t.cluster] ||= []).push(t);

  const cards = Object.entries(site.clusters)
    .map(([key, c]) => {
      const live = liveByCluster[key] || [];
      if (live.length) {
        const first = live[0];
        const names = live.map((t) => titolo(t.slug.replace(/^calcolatore-|^generatore-/, ""))).join(", ");
        return `<a class="cluster-card" href="/${esc(key)}/${esc(first.slug)}/">
          <span class="status-badge">live</span>
          <h3>${esc(c.label)}</h3>
          <p class="count">${esc(names)}</p>
        </a>`;
      }
      return `<div class="cluster-card cluster-card-disabled" aria-disabled="true">
          <h3>${esc(c.label)}</h3>
          <p class="count">${esc(c.hint)} — in arrivo</p>
        </div>`;
    })
    .join("\n        ");

  return `${head(site, {
    title: site.home.title,
    description: site.home.metaDescription,
    canonical: "/",
    jsonLdBlocks: [
      { "@context": "https://schema.org", "@type": "WebSite", name: site.home.title, url: site.domain + "/" },
    ],
  }, ver)}
<body>

${header(site, "home")}

<main>
  <section class="home-hero">
    <div class="wrap">
      <p class="eyebrow">${esc(site.home.eyebrow)}</p>
      <h1>${esc(site.home.h1)}</h1>
      <p class="lede">${esc(site.home.intro)}</p>
      <div class="cluster-grid">
        ${cards}
      </div>
    </div>
  </section>
</main>

${footer(site)}

</body>
</html>
`;
}

/** sitemap.xml da tutti i tool + home. */
export function renderSitemap(site, tools) {
  const urls = [{ loc: site.domain + "/" }]
    .concat(tools.map((t) => ({ loc: `${site.domain}/${t.cluster}/${t.slug}/`, lastmod: isoDate(t.updated) })))
    .map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
