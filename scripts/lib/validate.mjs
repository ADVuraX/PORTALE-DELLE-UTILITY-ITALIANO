/**
 * Validatore del contratto tool (docs/tool-config-schema.md).
 * La build FALLISCE su errori (contenuto sotto-standard o link 404 interni),
 * ma non su warning (es. relatedTools non ancora costruiti: resi come card
 * disabilitate, non come link rotti).
 */

import { spiegazioneTesto } from "./qualita.mjs";

const CLUSTERS = ["calcolatori", "generatori", "convertitori", "validatori"];
const FORMATS = ["currency", "currency2", "percent", "number", "text", "qr"];
const ACTIONS = ["regenerate", "copy", "download"];

function words(s) {
  return String(s || "").trim().split(/\s+/).filter(Boolean).length;
}

/**
 * @param {object} cfg   config di un singolo tool
 * @param {Set<string>} allSlugs  tutti gli slug esistenti (per link interni)
 * @param {Set<string>} scriptFiles  nomi file presenti in calculators/
 * @returns {{errors:string[], warnings:string[]}}
 */
export function validateTool(cfg, allSlugs, scriptFiles) {
  const errors = [];
  const warnings = [];
  const id = cfg.slug || "(slug mancante)";
  const err = (m) => errors.push(`[${id}] ${m}`);
  const warn = (m) => warnings.push(`[${id}] ${m}`);

  if (!cfg.slug) err("`slug` obbligatorio");
  if (!CLUSTERS.includes(cfg.cluster)) err(`\`cluster\` deve essere uno di: ${CLUSTERS.join(", ")}`);
  if (!cfg.h1) err("`h1` obbligatorio (titolo visibile della pagina)");

  const seo = cfg.seo || {};
  if (!seo.title) err("`seo.title` obbligatorio");
  if (!seo.metaDescription) err("`seo.metaDescription` obbligatorio");
  if (!seo.primaryKeyword) err("`seo.primaryKeyword` obbligatorio");
  if (!seo.canonical) err("`seo.canonical` obbligatorio");
  else if (seo.canonical !== `/${cfg.slug}/`) {
    err(`\`seo.canonical\` deve essere "/${cfg.slug}/", trovato "${seo.canonical}"`);
  }

  const iw = words(cfg.intro);
  if (iw < 40) err(`\`intro\` troppo corta (${iw} parole, min 40)`);
  if (iw > 400) err(`\`intro\` troppo lunga (${iw} parole, max 400)`);

  const tool = cfg.tool || {};
  if (!tool.logicId) err("`tool.logicId` obbligatorio");
  if (!tool.script) err("`tool.script` obbligatorio (nome file in assets/js/calculators/)");
  else if (scriptFiles && !scriptFiles.has(tool.script)) {
    err(`\`tool.script\` = "${tool.script}" ma il file assets/js/calculators/${tool.script} non esiste`);
  }
  // Nomi di file che finiscono in <script src>: solo minuscole, cifre, punto e trattino.
  const NOME_JS = /^[a-z0-9][a-z0-9._-]*\.js$/;
  if (tool.script && !NOME_JS.test(tool.script)) err(`\`tool.script\` = "${tool.script}": nome di file non ammesso`);
  (tool.data || []).forEach((d, i) => { if (!NOME_JS.test(d)) err(`\`tool.data[${i}]\` = "${d}": nome di file non ammesso`); });
  if (!Array.isArray(tool.inputs) || tool.inputs.length < 1) err("`tool.inputs` deve avere almeno 1 elemento");

  const LEAF_TYPES = ["number", "select", "text", "checkbox", "radio"];
  const leafIds = [];
  // Raccoglie gli id foglia (esclusi i gruppi) per validare i riferimenti showIf.
  const collect = (arr) => (arr || []).forEach((inp) => (inp.type === "group" ? collect(inp.inputs) : inp.id && leafIds.push(inp.id)));
  collect(tool.inputs);

  const validateInput = (inp, path) => {
    if (inp.type === "group") {
      if (!Array.isArray(inp.inputs) || !inp.inputs.length) err(`\`${path}.inputs\` obbligatorio e non vuoto per i group`);
      (inp.inputs || []).forEach((child, j) => validateInput(child, `${path}.inputs[${j}]`));
    } else {
      if (!inp.id) err(`\`${path}.id\` obbligatorio`);
      if (!inp.label) err(`\`${path}.label\` obbligatorio`);
      if (!LEAF_TYPES.includes(inp.type)) err(`\`${path}.type\` deve essere ${LEAF_TYPES.join("|")}|group`);
      if ((inp.type === "select" || inp.type === "radio") && (!Array.isArray(inp.options) || !inp.options.length)) {
        err(`\`${path}.options\` obbligatorio per select/radio`);
      }
    }
    if (inp.showIf) {
      if (!inp.showIf.input || !("equals" in inp.showIf)) err(`\`${path}.showIf\` deve avere { input, equals }`);
      else if (!leafIds.includes(inp.showIf.input)) err(`\`${path}.showIf.input\` = "${inp.showIf.input}" non è un input esistente`);
    }
  };
  (tool.inputs || []).forEach((inp, i) => validateInput(inp, `tool.inputs[${i}]`));

  // Modalità generatore: usa `tool.output` (+ `tool.actions`) invece di `tool.outputPrimary`.
  if (tool.kind === "generator") {
    if (!tool.output || !tool.output.id) err("`tool.output.id` obbligatorio per i generatori (kind:generator)");
    else {
      if (!tool.output.label) err("`tool.output.label` obbligatorio");
      if (!FORMATS.includes(tool.output.format)) err(`\`tool.output.format\` deve essere: ${FORMATS.join(", ")}`);
    }
    if (tool.actions !== undefined) {
      if (!Array.isArray(tool.actions)) err("`tool.actions` deve essere un array");
      else tool.actions.forEach((a) => { if (!ACTIONS.includes(a)) err(`\`tool.actions\` valore non valido: "${a}" (ammessi: ${ACTIONS.join(", ")})`); });
    }
  } else {
    if (!tool.outputPrimary || !tool.outputPrimary.id) err("`tool.outputPrimary` obbligatorio");
    else if (!FORMATS.includes(tool.outputPrimary.format)) err(`\`tool.outputPrimary.format\` deve essere: ${FORMATS.join(", ")}`);
  }
  (tool.outputSecondary || []).forEach((o, i) => {
    if (!FORMATS.includes(o.format)) err(`\`tool.outputSecondary[${i}].format\` deve essere: ${FORMATS.join(", ")}`);
  });
  (tool.breakdown || []).forEach((b, i) => {
    if (!b.id) err(`\`tool.breakdown[${i}].id\` obbligatorio`);
    if (!b.label) err(`\`tool.breakdown[${i}].label\` obbligatorio`);
    if (!["gross", "out", "in", "total"].includes(b.kind)) err(`\`tool.breakdown[${i}].kind\` deve essere gross|out|in|total`);
  });

  // Spiegazione: `corpo` (stringa o paragrafi) e/o `sezioni` [{ titolo, paragrafi, elenco }].
  const sp = words(spiegazioneTesto(cfg.spiegazione));
  if (!cfg.spiegazione || !cfg.spiegazione.titolo) err("`spiegazione.titolo` obbligatorio");
  if (sp < 150) err(`spiegazione troppo corta (${sp} parole, min 150 — anti thin-content)`);
  ((cfg.spiegazione && cfg.spiegazione.sezioni) || []).forEach((sez, i) => {
    if (!sez.titolo) err(`\`spiegazione.sezioni[${i}].titolo\` obbligatorio`);
    if (!Array.isArray(sez.paragrafi) || !sez.paragrafi.length) err(`\`spiegazione.sezioni[${i}].paragrafi\` obbligatorio e non vuoto`);
  });

  if (!Array.isArray(cfg.esempi) || cfg.esempi.length < 2) err("`esempi` deve avere almeno 2 elementi");
  if (!Array.isArray(cfg.faq) || cfg.faq.length < 4) err("`faq` deve avere almeno 4 elementi");

  if (!Array.isArray(cfg.relatedTools) || cfg.relatedTools.length < 3) {
    err("`relatedTools` deve avere almeno 3 slug");
  } else {
    cfg.relatedTools.forEach((slug) => {
      if (slug === cfg.slug) warn(`relatedTools include se stesso ("${slug}")`);
      else if (allSlugs && !allSlugs.has(slug)) warn(`relatedTools "${slug}" non ancora costruito → reso come card disabilitata (nessun 404)`);
    });
  }

  if (!cfg.jsonLd || !cfg.jsonLd.type) err("`jsonLd.type` obbligatorio");

  // Standard adottato: fonti + disclaimer. Warning (non blocca) durante l'autoring.
  if (!cfg.disclaimer) warn("manca `disclaimer` (standard del progetto: consigliato obbligatorio)");
  // Presenza e qualità delle fonti: controllate (con errore) da qualita.mjs.
  if (Array.isArray(cfg.fonti)) cfg.fonti.forEach((f, i) => { if (!f.titolo) err(`\`fonti[${i}].titolo\` obbligatorio`); });

  return { errors, warnings };
}

/**
 * Controlli a livello di sito. Ogni pagina generata (tool o area) occupa una
 * cartella sotto public/ e una riga in sitemap.xml: title, primaryKeyword e URL
 * devono quindi essere unici nell'intero sito, non solo fra i tool.
 *
 * @param configs  tutti i config tool
 * @param site     content/site.json (contiene le quattro aree)
 */
export function validateSite(configs, site) {
  const errors = [];
  const warnings = [];
  const byTitle = new Map();
  const byKw = new Map();

  const claimTitle = (t, who) => {
    t = (t || "").trim().toLowerCase();
    if (!t) return;
    if (byTitle.has(t)) errors.push(`seo.title duplicato tra "${byTitle.get(t)}" e "${who}"`);
    else byTitle.set(t, who);
  };
  const claimKw = (k, who) => {
    k = (k || "").trim().toLowerCase();
    if (!k) return;
    if (byKw.has(k)) errors.push(`seo.primaryKeyword duplicata tra "${byKw.get(k)}" e "${who}"`);
    else byKw.set(k, who);
  };

  for (const c of configs) {
    claimTitle(c.seo && c.seo.title, c.slug);
    claimKw(c.seo && c.seo.primaryKeyword, c.slug);
  }

  // --- Aree: ognuna genera /{key}/ con contenuto proprio ---
  const clusters = (site && site.clusters) || {};
  const slugs = new Set(configs.map((c) => c.slug));
  const seenCluster = new Set(configs.map((c) => c.cluster));

  for (const key of Object.keys(clusters)) {
    const c = clusters[key];
    const id = `area:${key}`;
    const err = (m) => errors.push(`[${id}] ${m}`);

    // La cartella dell'area e quella di un tool finirebbero nello stesso posto.
    if (slugs.has(key)) err(`la chiave dell'area collide con lo slug del tool "${key}" (stessa cartella public/${key}/)`);

    if (!c.label) err("`label` obbligatoria (nome breve in navigazione)");
    if (!c.hint) err("`hint` obbligatorio (sottotitolo dell'area in home)");
    if (!c.h1) err("`h1` obbligatorio (titolo visibile della pagina area)");

    const seo = c.seo || {};
    if (!seo.title) err("`seo.title` obbligatorio");
    if (!seo.metaDescription) err("`seo.metaDescription` obbligatorio");
    if (!seo.primaryKeyword) err("`seo.primaryKeyword` obbligatorio");
    claimTitle(seo.title, id);
    claimKw(seo.primaryKeyword, id);

    // La pagina area deve reggersi da sola: senza testo è thin content.
    const iw = words(c.intro);
    if (iw < 120) err(`\`intro\` troppo corta (${iw} parole, min 120 — anti thin-content)`);
    if (iw > 400) err(`\`intro\` troppo lunga (${iw} parole, max 400)`);

    if (!Array.isArray(c.faq) || c.faq.length < 3) err("`faq` deve avere almeno 3 elementi");
    else
      c.faq.forEach((f, i) => {
        if (!f.domanda) err(`\`faq[${i}].domanda\` obbligatoria`);
        if (!f.risposta) err(`\`faq[${i}].risposta\` obbligatoria`);
      });

    if (!seenCluster.has(key)) warnings.push(`[${id}] nessun tool assegnato: la pagina area sarà un elenco vuoto`);
  }

  // Un tool che punta a un'area inesistente romperebbe briciole e link interni.
  for (const c of configs) {
    if (c.cluster && !clusters[c.cluster]) {
      errors.push(`[${c.slug}] cluster "${c.cluster}" non definito in site.json → nessuna pagina area di destinazione`);
    }
  }

  return { errors, warnings };
}

/**
 * Pagine istituzionali (content/pagine/*.json): campi obbligatori e nessuna
 * collisione di URL con tool o aree.
 */
export function validatePages(pages, configs, site) {
  const errors = [];
  const occupati = new Set([...configs.map((c) => c.slug), ...Object.keys(site.clusters || {})]);
  const visti = new Set();
  for (const p of pages) {
    const id = `pagina:${p.slug || "(senza slug)"}`;
    const err = (m) => errors.push(`[${id}] ${m}`);
    if (!p.slug || !/^[a-z0-9-]+$/.test(p.slug)) err("`slug` obbligatorio (minuscole, cifre, trattini)");
    if (occupati.has(p.slug)) err(`lo slug "${p.slug}" è già usato da un tool o da un'area`);
    if (visti.has(p.slug)) err("slug duplicato fra le pagine");
    visti.add(p.slug);
    if (!p.titolo) err("`titolo` obbligatorio (h1)");
    if (!p.seo || !p.seo.title || !p.seo.metaDescription) err("`seo.title` e `seo.metaDescription` obbligatori");
    if (!p.lede) err("`lede` obbligatorio");
    if (!p.aggiornato) err("`aggiornato` obbligatorio (AAAA-MM): le pagine legali devono dire quando sono state riviste");
    if (!Array.isArray(p.sezioni) || !p.sezioni.length) err("`sezioni` obbligatorio e non vuoto");
    (p.sezioni || []).forEach((s, i) => {
      if (!s.titolo) err(`\`sezioni[${i}].titolo\` obbligatorio`);
      if (!(s.paragrafi && s.paragrafi.length) && !(s.elenco && s.elenco.length)) err(`\`sezioni[${i}]\` senza testo`);
    });
  }
  return { errors };
}
