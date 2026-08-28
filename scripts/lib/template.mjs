/**
 * TEMPLATE — genera HTML statico dai config. Nessun contenuto renderizzato
 * a runtime: tutto il testo è nel markup per il SEO. runtime.js aggiunge solo
 * l'interattività del calcolo, search.js solo il filtro dell'indice.
 *
 * Tre tipi di pagina, stessa griglia editoriale asimmetrica (vedi tokens.css):
 *   renderHome()        /                      indice + quattro aree troncate
 *   renderClusterPage() /{cluster}/            una sola area, elenco esteso
 *   renderToolPage()    /{slug}/               lo strumento
 */

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const titolo = (s) => String(s || "").replace(/-/g, " ");

/** Appende ?v=<hash> a un URL asset per il cache-busting. */
const withV = (url, ver) => {
  const h = ver && ver(url);
  return h ? `${url}?v=${h}` : url;
};

/** Numero d'ordine a due cifre: "01", "02". */
const nn = (i) => String(i).padStart(2, "0");

const MESI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
function fmtUpdated(updated) {
  const m = String(updated || "").match(/^(\d{4})(?:-(\d{2}))?/);
  if (!m) return "";
  return m[2] ? `${MESI[Number(m[2]) - 1]} ${m[1]}` : m[1];
}
function isoDate(updated) {
  const m = String(updated || "").match(/^(\d{4})(?:-(\d{2}))?/);
  if (!m) return undefined;
  return `${m[1]}-${m[2] || "01"}-01`;
}

/**
 * Nome breve per le righe d'indice: toglie il tipo dall'h1, perché il tipo è
 * già scritto nel titolo dell'area sopra l'elenco.
 *   "Convertitore di Superficie"          → "Superficie"
 *   "Calcolatore Partita IVA Forfettario" → "Partita IVA Forfettario"
 */
function shortName(cfg) {
  const base = cfg.h1 || titolo(cfg.slug);
  return base.replace(/^(Calcolatore|Generatore|Convertitore|Validatore)\s+(?:di\s+|del\s+|dei\s+|delle\s+|della\s+)?/i, "").trim() || base;
}

/**
 * Testo su cui lavora la ricerca: nome, titolo pieno, nota, tema, keyword e
 * slug, tutto minuscolo e senza accenti (search.js normalizza allo stesso modo).
 */
function searchIndex(cfg, clusterLabel) {
  const parts = [
    shortName(cfg), cfg.h1, cfg.tool && cfg.tool.cardNote, cfg.tema,
    cfg.seo && cfg.seo.primaryKeyword, cfg.slug.replace(/-/g, " "), clusterLabel,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Prime `n` frasi di un testo (per il sommario) + il resto (per il corpo). */
function splitIntro(text, n = 2) {
  const parts = String(text || "").split(/(?<=\.)\s+/);
  return { lede: parts.slice(0, n).join(" "), body: parts.slice(n).join(" ") };
}

const ICON = {
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>',
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

/**
 * Testata. Le pagine indice mostrano la navigazione fra aree; le pagine tool
 * mostrano il percorso (briciole), che a quel punto è l'informazione utile.
 */
function header(site, { nav = null, crumbs = null } = {}) {
  const navHtml = nav
    ? `<nav class="nav" aria-label="Aree del sito">${Object.entries(site.clusters)
        .map(([k, c]) => `<a href="/${esc(k)}/"${nav === k ? ' aria-current="page"' : ""}>${esc(c.label)}</a>`)
        .join("")}</nav>`
    : "";
  const crumbsHtml = crumbs ? `<div class="crumbs">${crumbs}</div>` : "";
  return `<header class="head">
  <div class="wrap">
    <a class="logo" href="/">${esc(site.brand.replace(site.brandAccent, ""))}<b>${esc(site.brandAccent)}</b></a>
    <div class="head-right">
      ${navHtml}${crumbsHtml}
      <button class="theme-toggle" type="button" onclick="__toggleTheme()" aria-label="Cambia tema chiaro o scuro" aria-pressed="false" title="Tema chiaro / scuro">${ICON.theme}</button>
    </div>
  </div>
</header>`;
}

/** Piede: marchio + indice delle quattro aree (link interni su ogni pagina). */
function footer(site) {
  const links = Object.entries(site.clusters)
    .map(([k, c]) => `<li><a href="/${esc(k)}/">${esc(c.label)}</a></li>`)
    .join("");
  return `<footer class="foot"><div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="foot-brand" href="/">${esc(site.brand.replace(site.brandAccent, ""))}<b>${esc(site.brandAccent)}</b></a>
        <p class="foot-note">${esc(site.home.intro.split(". ")[0])}.</p>
      </div>
      <ul class="foot-links">${links}</ul>
    </div>
    <p class="foot-base">${esc(site.footer)}</p>
  </div></footer>`;
}

/** Testatina di sezione: numero mono, titolo, filo di gronda fino al margine. */
const secHead = (num, title) =>
  `<div class="sec-head"><span class="sec-num">${nn(num)}</span><h2>${esc(title)}</h2><span class="sec-rule" aria-hidden="true"></span></div>`;

/** Campo di ricerca condiviso (home e pagine area). */
const searchBox = (placeholder, label) => `<form class="search" role="search" onsubmit="return false">
        <label class="sr-only" for="toolSearch">${esc(label)}</label>
        <div class="search-box">
          ${ICON.search}
          <input type="search" id="toolSearch" data-search-input autocomplete="off" spellcheck="false" placeholder="${esc(placeholder)}" aria-label="${esc(label)}">
          <kbd class="search-key">/</kbd>
        </div>
      </form>`;

/* ---------- Spazi pubblicitari (AdSense non ancora attivo) ---------- */
const adSlot = (cls, dim) =>
  `<div class="ad-slot ${cls}"><span class="ad-lbl">Spazio pubblicitario</span><span class="ad-dim">${esc(dim)}</span></div>`;
const adRails =
  `<div class="ad-rail ad-rail-l" aria-hidden="true">${adSlot("ad-sky", "160×600")}</div>` +
  `<div class="ad-rail ad-rail-r" aria-hidden="true">${adSlot("ad-sky", "160×600")}</div>`;
const adMiniRow = `<section class="ad-mini-sec"><div class="wrap"><div class="ad-mini-grid">${
  [0, 1].map(() => adSlot("ad-mini", "300×250")).join("")
}</div></div></section>`;
const adAnchor = `<div class="ad-anchor" id="adAnchor" data-expanded="false">
  <div class="ad-anchor-tools">
    <button type="button" class="ad-anchor-btn" data-ad-toggle aria-expanded="false">Espandi</button>
    <button type="button" class="ad-anchor-btn ad-anchor-close" data-ad-close aria-label="Chiudi annuncio">×</button>
  </div>
  ${adSlot("ad-anchor-slot", "responsive · espandibile")}
</div>
<script>(function(){var a=document.getElementById("adAnchor");if(!a)return;var t=a.querySelector("[data-ad-toggle]"),c=a.querySelector("[data-ad-close]");if(t)t.addEventListener("click",function(){var e=a.getAttribute("data-expanded")==="true";a.setAttribute("data-expanded",String(!e));t.setAttribute("aria-expanded",String(!e));t.textContent=e?"Espandi":"Riduci";});if(c)c.addEventListener("click",function(){a.setAttribute("data-hidden","true");});})();</script>`;

/* ---------- Form del tool ---------- */

/** Appiattisce eventuali gruppi in una lista di soli input foglia. */
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

/** Un singolo campo o gruppo. `showIf` → attributo DOM letto dal runtime. */
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

const renderInputs = (inputs) => inputs.map(renderField).join("\n          ");

/* ---------- Dati strutturati ---------- */

function jsonLdFor(cfg, site) {
  const url = site.domain + cfg.seo.canonical;
  const cluster = site.clusters[cfg.cluster];
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
  // Tre livelli: la pagina area è ora un nodo reale, non più un salto Home→tool.
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.domain + "/" },
      { "@type": "ListItem", position: 2, name: cluster.label, item: `${site.domain}/${cfg.cluster}/` },
      { "@type": "ListItem", position: 3, name: cfg.h1, item: url },
    ],
  };
  return [app, faq, breadcrumb];
}

/* ================= PAGINA TOOL ================= */

export function renderToolPage(cfg, site, toolsBySlug, ver) {
  const tool = cfg.tool;
  const isGenerator = tool.kind === "generator";
  const updated = fmtUpdated(cfg.updated);
  const cluster = site.clusters[cfg.cluster];
  const hasLedger = !!(tool.breakdown && tool.breakdown.length);

  const runtimeConfig = {
    logicId: tool.logicId,
    inputs: flattenInputs(tool.inputs).map((i) => ({ id: i.id, type: i.type })),
  };
  if (isGenerator) {
    runtimeConfig.kind = "generator";
    runtimeConfig.output = { id: tool.output.id, format: tool.output.format };
    if (tool.output.filename) runtimeConfig.output.filename = tool.output.filename;
    runtimeConfig.actions = tool.actions || [];
    runtimeConfig.extras = (tool.extras || []).map((e) => ({ id: e.id, format: e.format }));
  } else {
    runtimeConfig.outputPrimary = { id: tool.outputPrimary.id, format: tool.outputPrimary.format };
    runtimeConfig.outputSecondary = (tool.outputSecondary || []).map((o) => ({ id: o.id, label: o.label, format: o.format }));
    runtimeConfig.breakdown = (tool.breakdown || []).map((b) => ({ id: b.id, kind: b.kind, format: b.format || "currency", provisional: !!b.provisional }));
    runtimeConfig.extras = (tool.extras || []).map((e) => ({ id: e.id, format: e.format }));
  }

  // Striscia metadati al posto dei badge: etichetta mono, valore sotto.
  const meta = [
    `<li><span class="mk">Area</span><span class="mv"><a href="/${esc(cfg.cluster)}/">${esc(cluster.label)}</a></span></li>`,
    updated ? `<li><span class="mk">Aggiornato</span><span class="mv">${esc(updated)}</span></li>` : "",
    cfg.fonti && cfg.fonti.length
      ? `<li><span class="mk">Fonti</span><span class="mv mv-ok">${cfg.fonti.length} ufficiali</span></li>`
      : "",
    `<li><span class="mk">Accesso</span><span class="mv">Libero</span></li>`,
  ].filter(Boolean).join("\n        ");

  const secondaryCells = (tool.outputSecondary || [])
    .map((o) => `<div class="cell"><span class="k">${esc(o.label)}</span><span class="v" data-out="${esc(o.id)}">—</span></div>`)
    .join("");

  let resultDetail;
  if (hasLedger) {
    const rows = tool.breakdown
      .map(
        (b) => `<div class="lrow lrow-${esc(b.kind)}${b.provisional ? " lrow-prov" : ""}">
            <span class="ll">${esc(b.label)}${b.provisional ? ' <span class="ltag">in arrivo</span>' : ""}${b.subnote ? `<span class="lsub" data-sub="${esc(b.id)}" hidden></span>` : ""}</span>
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

  let resultBody;
  if (isGenerator) {
    const out = tool.output;
    const isQR = out.format === "qr";
    const outputEl = isQR
      ? `<div class="gen-qr" data-out-primary data-empty="true"></div>`
      : `<div class="gen-value" data-out-primary data-empty="true">—</div>`;
    const actions = tool.actions || [];
    const btns = [];
    if (actions.includes("regenerate"))
      btns.push(`<button type="button" class="gen-btn gen-btn-primary" data-action="regenerate">Rigenera</button>`);
    if (actions.includes("copy"))
      btns.push(`<button type="button" class="gen-btn" data-action="copy">${isQR ? "Copia testo" : "Copia"}</button>`);
    if (actions.includes("download") && isQR) {
      btns.push(`<button type="button" class="gen-btn" data-action="download-png">Scarica PNG</button>`);
      btns.push(`<button type="button" class="gen-btn" data-action="download-svg">Scarica SVG</button>`);
    }
    const actionsHtml = btns.length ? `<div class="gen-actions">${btns.join("")}</div>` : "";
    resultBody = `<div class="result gen${isQR ? " gen-qrmode" : ""}" aria-live="polite">
          <div class="rlabel">${esc(out.label)}</div>
          ${outputEl}
          ${extrasHtml}
          ${actionsHtml}
        </div>`;
  } else {
    resultBody = `<div class="result" aria-live="polite">
          <div class="rlabel">${esc(tool.outputPrimary.label)}</div>
          <div class="value" data-out-primary>—</div>
          <div class="value-underline"></div>
          ${resultDetail}
          ${extrasHtml}
        </div>`;
  }
  const disclaimer = cfg.disclaimer
    ? `<div class="note" id="disc">${ICON.info}<p>${cfg.disclaimer}</p></div>`
    : "";

  const esempi = cfg.esempi
    .map((es, i) => `<li><span class="ex-i">${nn(i + 1)}</span><span class="ex-q">${esc(es.titolo)}</span><span class="ex-r">${esc(es.risultatoAtteso)}</span></li>`)
    .join("\n        ");

  const faq = cfg.faq
    .map(
      (f, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(f.domanda)}<span class="plus" aria-hidden="true"></span></summary><div class="ans"><p>${esc(f.risposta)}</p></div></details>`
    )
    .join("\n      ");

  const related = cfg.relatedTools
    .map((slug) => {
      const t = toolsBySlug.get(slug);
      if (t) {
        return `<li><a class="rel" href="/${esc(slug)}/"><span class="re">${esc(site.clusters[t.cluster].label)}</span><span class="rn">${esc(shortName(t))}</span></a></li>`;
      }
      return `<li><div class="rel rel-off"><span class="re">In programma</span><span class="rn">${esc(titolo(slug))}</span></div></li>`;
    })
    .join("\n        ");

  // Numerazione progressiva delle sezioni: dipende da quali blocchi esistono.
  let n = 0;
  const sections = [];
  sections.push(`<section class="section">
    <div class="wrap">
      ${secHead(++n, "Esempi pratici")}
      <ol class="ex-list">
        ${esempi}
      </ol>
    </div>
  </section>`);
  sections.push(`<section class="section">
    <div class="wrap">
      ${secHead(++n, cfg.spiegazione.titolo)}
      <div class="prose"><p>${esc(cfg.spiegazione.corpo)}</p></div>
    </div>
  </section>`);
  sections.push(`<section class="section">
    <div class="wrap">
      ${secHead(++n, "Domande frequenti")}
      <div class="faq">
      ${faq}
      </div>
    </div>
  </section>`);
  sections.push(`<section class="section">
    <div class="wrap">
      ${secHead(++n, "Strumenti collegati")}
      <ul class="rel-list">
        ${related}
      </ul>
    </div>
  </section>`);
  if (cfg.fonti && cfg.fonti.length) {
    sections.push(`<section class="section">
    <div class="wrap">
      ${secHead(++n, "Fonti e metodo")}
      <div class="fonti">
        <div class="fonti-head">
          <h3>Riferimenti usati nel calcolo</h3>
          ${updated ? `<span class="upd">Ultimo aggiornamento: ${esc(updated)}</span>` : ""}
        </div>
        ${cfg.fonti
          .map((f, i) => {
            const t = f.url
              ? `<a class="t" href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titolo)}</a>`
              : `<span class="t">${esc(f.titolo)}</span>`;
            return `<div class="src"><span class="n">${nn(i + 1)}</span><div class="b"><div class="t">${t}</div>${f.dettaglio ? `<div class="d">${esc(f.dettaglio)}</div>` : ""}</div></div>`;
          })
          .join("\n        ")}
      </div>
    </div>
  </section>`);
  }

  return `${head(site, {
    title: cfg.seo.title,
    description: cfg.seo.metaDescription,
    canonical: cfg.seo.canonical,
    jsonLdBlocks: jsonLdFor(cfg, site),
  }, ver)}
<body>

<a class="skip" href="#tool">Salta allo strumento</a>

${header(site, {
  crumbs: `<a href="/">Home</a> / <a href="/${esc(cfg.cluster)}/">${esc(cluster.label)}</a> / <span>${esc(shortName(cfg))}</span>`,
})}

${adRails}

<main>
  <section class="lead">
    <div class="wrap">
      <p class="kicker"><b>${esc(cluster.label)}</b> · ${esc(cfg.tema)}</p>
      <div class="lead-grid">
        <div class="lead-main">
          <h1>${esc(cfg.h1)}</h1>
        </div>
        <div class="lead-side">
          <p class="lede">${esc(cfg.intro)}</p>
          <ul class="meta">
        ${meta}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section class="tool" id="tool" data-tool>
    <div class="wrap">
      <div class="tool-grid${hasLedger ? " has-ledger" : ""}">
        <div class="card card-in">
          <div class="card-top"><span>I tuoi dati</span></div>
          <form data-tool-form${disclaimer ? ' aria-describedby="disc"' : ""}>
          ${renderInputs(tool.inputs)}
          </form>
        </div>
        <div class="card card-out notch" data-result-card>
          <div class="card-top"><span>Risultato</span></div>
          ${resultBody}
          ${disclaimer}
        </div>
        <script type="application/json" data-tool-config>${JSON.stringify(runtimeConfig)}</script>
      </div>
    </div>
  </section>

${sections.join("\n")}
</main>

${adMiniRow}
<div class="ad-anchor-spacer" aria-hidden="true"></div>
${footer(site)}
${adAnchor}

<script src="${withV("/assets/js/runtime.js", ver)}"></script>
${(tool.data || []).map((d) => `<script src="${withV("/assets/js/data/" + d, ver)}"></script>`).join("\n")}
<script src="${withV("/assets/js/calculators/" + tool.script, ver)}"></script>
</body>
</html>
`;
}

/* ================= HOMEPAGE ================= */

/**
 * Home: indice a quattro aree. Ogni area mostra un elenco TRONCATO — gli
 * strumenti oltre il taglio restano nel DOM (indicizzabili) e sono nascosti
 * solo dalla maschera CSS; il bottone "Esplora" porta alla pagina d'area, la
 * ricerca rimuove il taglio e li rende di nuovo leggibili.
 *
 * Sopra questa soglia l'elenco viene troncato. L'altezza CSS mostra 5,6 righe:
 * con 6 strumenti si taglierebbe solo mezza riga finale, un troncamento che
 * non nasconde nulla e fa solo rumore.
 */
const CLIP_OVER = 6;

export function renderHome(site, tools, ver) {
  const byCluster = {};
  for (const t of tools) (byCluster[t.cluster] ||= []).push(t);

  const keys = Object.keys(site.clusters);
  const areas = keys
    .map((key, ai) => {
      const c = site.clusters[key];
      const live = (byCluster[key] || []).slice().sort((a, b) => a.slug.localeCompare(b.slug));
      const clip = live.length > CLIP_OVER;
      const items = live
        .map((t, i) => {
          const note = t.tool && t.tool.cardNote ? `<span class="tl-note">${esc(t.tool.cardNote)}</span>` : `<span class="tl-note"></span>`;
          return `<li data-search="${esc(searchIndex(t, c.label))}"><a class="tool-link" href="/${esc(t.slug)}/"><span class="tl-idx">${nn(i + 1)}</span><span class="tl-name">${esc(shortName(t))}</span>${note}<span class="tl-arrow" aria-hidden="true">→</span></a></li>`;
        })
        .join("\n            ");

      return `<section class="area" id="${esc(key)}" data-search-scope>
        <div class="area-grid">
          <div class="area-meta">
            <span class="area-num">${nn(ai + 1)} / 0${keys.length}</span>
            <h2 class="area-h"><a href="/${esc(key)}/">${esc(c.label)}</a></h2>
            <p class="area-hint">${esc(c.hint)}</p>
            <p class="area-count">${live.length} strument${live.length === 1 ? "o" : "i"} disponibil${live.length === 1 ? "e" : "i"}</p>
            <a class="explore notch" href="/${esc(key)}/"><span class="explore-in">Esplora <em>${esc(c.label.toLowerCase())}</em> <span class="arw" aria-hidden="true">→</span></span></a>
          </div>
          <div>
            <ol class="cat-list${clip ? " is-clip" : ""}" data-search-list>
            ${items}
            </ol>
          </div>
        </div>
      </section>`;
    })
    .join("\n      ");

  const itemList = tools.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: tools.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: shortName(t),
          url: `${site.domain}/${t.slug}/`,
        })),
      }
    : null;

  return `${head(site, {
    title: site.home.title,
    description: site.home.metaDescription,
    canonical: "/",
    jsonLdBlocks: [
      { "@context": "https://schema.org", "@type": "WebSite", name: site.home.title, url: site.domain + "/" },
      ...(itemList ? [itemList] : []),
    ],
  }, ver)}
<body>

<a class="skip" href="#indice">Salta all'indice</a>

${header(site, { nav: true })}

${adRails}

<main>
  <section class="lead">
    <div class="wrap">
      <p class="kicker"><b>00</b> ${esc(site.home.eyebrow)}</p>
      <div class="lead-grid">
        <div class="lead-main">
          <h1>${esc(site.home.h1)}</h1>
        </div>
        <div class="lead-side">
          <p class="lede">${esc(site.home.intro)}</p>
          ${searchBox("Cerca uno strumento…", "Cerca uno strumento")}
          <p class="search-count" data-search-count>${tools.length} strumenti in ${keys.length} aree</p>
        </div>
      </div>
    </div>
  </section>

  <section class="areas" id="indice">
    <div class="wrap">
      ${areas}
      <p class="catalog-empty" data-search-empty role="status">Nessuno strumento corrisponde alla ricerca. Prova con una parola più generica — «peso», «fiscale», «codice».</p>
    </div>
  </section>
</main>

${adMiniRow}
<div class="ad-anchor-spacer" aria-hidden="true"></div>
${footer(site)}
${adAnchor}

<script src="${withV("/assets/js/search.js", ver)}"></script>
</body>
</html>
`;
}

/* ================= PAGINA AREA ================= */

/**
 * Pagina d'area: /{cluster}/. Elenco esteso (nessun troncamento), ricerca
 * limitata all'area, testo di approfondimento e FAQ di categoria. È la pagina
 * che riceve i link "Esplora" della home e fa da hub interno verso i tool.
 */
export function renderClusterPage(site, key, tools, ver) {
  const c = site.clusters[key];
  const keys = Object.keys(site.clusters);
  const ai = keys.indexOf(key);
  const live = tools.slice().sort((a, b) => a.slug.localeCompare(b.slug));
  const { lede, body } = splitIntro(c.intro, 2);

  const rows = live
    .map((t, i) => `<li data-search="${esc(searchIndex(t, c.label))}"><a class="area-row" href="/${esc(t.slug)}/">
          <span class="ar-idx">${nn(i + 1)}</span>
          <span class="ar-name">${esc(shortName(t))}</span>
          <span class="ar-desc">${esc(t.seo.metaDescription.split(". ")[0])}.</span>
          <span class="ar-arrow" aria-hidden="true">→</span>
        </a></li>`)
    .join("\n        ");

  const faq = (c.faq || [])
    .map(
      (f, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(f.domanda)}<span class="plus" aria-hidden="true"></span></summary><div class="ans"><p>${esc(f.risposta)}</p></div></details>`
    )
    .join("\n      ");

  const others = keys
    .filter((k) => k !== key)
    .map((k) => `<li><a class="oa" href="/${esc(k)}/"><span class="oa-n">${esc(site.clusters[k].label)}</span><span class="oa-c">${esc(site.clusters[k].hint)}</span></a></li>`)
    .join("\n        ");

  const url = `${site.domain}/${key}/`;
  const jsonLdBlocks = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: c.seo.title,
      url,
      description: c.seo.metaDescription,
      isPartOf: { "@type": "WebSite", name: site.home.title, url: site.domain + "/" },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: live.length,
        itemListElement: live.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: shortName(t),
          url: `${site.domain}/${t.slug}/`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.domain + "/" },
        { "@type": "ListItem", position: 2, name: c.label, item: url },
      ],
    },
  ];
  if (c.faq && c.faq.length) {
    jsonLdBlocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.map((f) => ({
        "@type": "Question",
        name: f.domanda,
        acceptedAnswer: { "@type": "Answer", text: f.risposta },
      })),
    });
  }

  let n = 0;
  return `${head(site, {
    title: c.seo.title,
    description: c.seo.metaDescription,
    canonical: `/${key}/`,
    jsonLdBlocks,
  }, ver)}
<body>

<a class="skip" href="#elenco">Salta all'elenco</a>

${header(site, { nav: key })}

${adRails}

<main>
  <section class="lead">
    <div class="wrap">
      <p class="kicker"><b>${nn(ai + 1)}</b> Area · ${live.length} strument${live.length === 1 ? "o" : "i"}</p>
      <div class="lead-grid">
        <div class="lead-main">
          <h1>${esc(c.h1)}</h1>
        </div>
        <div class="lead-side">
          <p class="lede">${esc(lede)}</p>
          ${searchBox(`Filtra i ${c.label.toLowerCase()}…`, `Filtra i ${c.label.toLowerCase()}`)}
          <p class="search-count" data-search-count>${live.length} strument${live.length === 1 ? "o" : "i"} in quest'area</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="elenco">
    <div class="wrap">
      ${secHead(++n, "Tutti gli strumenti")}
      <div data-search-scope>
        <ol class="area-list" data-search-list>
        ${rows}
        </ol>
      </div>
      <p class="catalog-empty" data-search-empty role="status">Nessuno strumento di quest'area corrisponde alla ricerca.</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      ${secHead(++n, "Come funzionano")}
      <div class="prose"><p>${esc(body || lede)}</p></div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      ${secHead(++n, "Domande frequenti")}
      <div class="faq">
      ${faq}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      ${secHead(++n, "Altre aree")}
      <ul class="other-areas">
        ${others}
      </ul>
    </div>
  </section>
</main>

${adMiniRow}
<div class="ad-anchor-spacer" aria-hidden="true"></div>
${footer(site)}
${adAnchor}

<script src="${withV("/assets/js/search.js", ver)}"></script>
</body>
</html>
`;
}

/* ================= SITEMAP ================= */

/** sitemap.xml: home + le quattro pagine area + tutti i tool. */
export function renderSitemap(site, tools) {
  const urls = [{ loc: site.domain + "/", priority: "1.0" }]
    .concat(Object.keys(site.clusters).map((k) => ({ loc: `${site.domain}/${k}/`, priority: "0.8" })))
    .concat(tools.map((t) => ({ loc: `${site.domain}/${t.slug}/`, lastmod: isoDate(t.updated), priority: "0.7" })))
    .map(
      (u) =>
        `  <url>\n    <loc>${esc(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
