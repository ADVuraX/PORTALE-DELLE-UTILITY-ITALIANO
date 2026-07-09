/**
 * TEMPLATE — genera HTML statico dai config. Nessun contenuto renderizzato
 * a runtime: tutto il testo è nel markup per il SEO. Il runtime.js aggiunge
 * solo l'interattività del calcolo. Stile: "neobank civica" (vedi tokens.css).
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

/** Nome tool "pulito" per i link (rimuove il prefisso di tipo). */
const toolName = (slug) =>
  titolo(String(slug).replace(/^(calcolatore|generatore|convertitore|validatore)-/, ""));

/**
 * Footer-hub: indice di tutti i tool raggruppati per categoria (la categoria è
 * solo un'etichetta, non una pagina — gli URL dei tool sono piatti /{slug}/).
 * @param tools Array<{slug,cluster,h1}> tutti i tool costruiti.
 */
function footer(site) {
  return `<footer class="foot"><div class="wrap">
    <p class="foot-base">${esc(site.footer)}</p>
  </div></footer>`;
}

/** Placeholder spazi pubblicitari (AdSense non ancora attivo). */
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
      { "@type": "ListItem", position: 2, name: cfg.h1, item: url },
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
  const isGenerator = tool.kind === "generator";
  const updated = fmtUpdated(cfg.updated);
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

  // --- Corpo del result card: generatore (text/qr + azioni) vs calcolatore ---
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
        return `<a class="rel" href="/${esc(slug)}/"><span class="re">Tool correlato</span><span class="rn">${esc(titolo(slug))}</span></a>`;
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

${header(site, `<a href="/">Home</a> / <span>${esc(titolo(cfg.slug).replace(/^calcolatore |^generatore /, ""))}</span>`)}

${adRails}

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
        <div class="card-top"><span>I tuoi dati</span></div>
        <form data-tool-form${disclaimer ? ' aria-describedby="disc"' : ""}>
          ${renderInputs(tool.inputs)}
        </form>
      </div>
      <div class="card card-out" data-result-card>
        <div class="card-top"><span>Risultato</span></div>
        ${resultBody}
        ${disclaimer}
      </div>
      <script type="application/json" data-tool-config>${JSON.stringify(runtimeConfig)}</script>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <h2>Tool correlati</h2>
      <div class="related">
        ${related}
      </div>
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

const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

/**
 * Homepage generata: ricerca + catalogo completo. Ogni categoria è un titolo
 * (non cliccabile) con l'elenco di TUTTI i suoi tool (link diretti, sempre nel
 * DOM per il SEO). Il filtro è solo client-side: nasconde, non rimuove.
 */
export function renderHome(site, tools, ver) {
  const liveByCluster = {};
  for (const t of tools) (liveByCluster[t.cluster] ||= []).push(t);

  const catalog = Object.entries(site.clusters)
    .map(([key, c]) => {
      const live = (liveByCluster[key] || []).slice().sort((a, b) => a.slug.localeCompare(b.slug));
      if (live.length) {
        const items = live
          .map((t) => {
            const name = toolName(t.slug);
            const search = esc(name.toLowerCase());
            return `<li data-search="${search}"><a class="tool-link" href="/${esc(t.slug)}/"><span class="tl-name">${esc(name)}</span><span class="tl-arrow" aria-hidden="true">→</span></a></li>`;
          })
          .join("\n          ");
        return `<section class="cat">
        <h2 class="cat-title">${esc(c.label)}</h2>
        <ul class="cat-list">
          ${items}
        </ul>
      </section>`;
      }
      return `<section class="cat">
        <h2 class="cat-title">${esc(c.label)} <span class="cat-soon">in arrivo</span></h2>
        <p class="cat-soon-note">${esc(c.hint)}</p>
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
          name: toolName(t.slug),
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

${header(site, "home")}

<main>
  <section class="home-hero">
    <div class="wrap">
      <h1>${esc(site.home.h1)}</h1>
      <p class="lede">${esc(site.home.intro)}</p>
      <form class="tool-search" role="search" onsubmit="return false">
        <label class="sr-only" for="toolSearch">Cerca uno strumento</label>
        <div class="tool-search-box">
          ${SEARCH_ICON}
          <input type="search" id="toolSearch" autocomplete="off" placeholder="Cerca uno strumento… (es. stipendio, password, QR)" aria-label="Cerca uno strumento">
        </div>
      </form>
      <div class="catalog">
        ${catalog}
      </div>
      <p class="catalog-empty" id="catalogEmpty" role="status">Nessuno strumento trovato.</p>
    </div>
  </section>
</main>

${footer(site)}

<script>(function(){
  var q=document.getElementById("toolSearch");if(!q)return;
  var cats=[].slice.call(document.querySelectorAll(".cat"));
  var empty=document.getElementById("catalogEmpty");
  function norm(s){return (s||"").toLowerCase().trim();}
  q.addEventListener("input",function(){
    var v=norm(q.value),anyVisible=false;
    cats.forEach(function(cat){
      var items=[].slice.call(cat.querySelectorAll(".cat-list li"));
      if(!items.length){cat.hidden=v!=="";if(!cat.hidden)anyVisible=true;return;}
      var shown=0;
      items.forEach(function(li){
        var m=!v||(li.getAttribute("data-search")||"").indexOf(v)!==-1;
        li.hidden=!m;if(m)shown++;
      });
      cat.hidden=shown===0;if(shown)anyVisible=true;
    });
    if(empty)empty.setAttribute("data-show",String(!anyVisible));
  });
})();</script>

</body>
</html>
`;
}

/** sitemap.xml da tutti i tool + home. */
export function renderSitemap(site, tools) {
  const urls = [{ loc: site.domain + "/" }]
    .concat(tools.map((t) => ({ loc: `${site.domain}/${t.slug}/`, lastmod: isoDate(t.updated) })))
    .map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
