/**
 * Validatore del contratto tool (docs/tool-config-schema.md).
 * La build FALLISCE su errori (contenuto sotto-standard o link 404 interni),
 * ma non su warning (es. relatedTools non ancora costruiti: resi come card
 * disabilitate, non come link rotti).
 */

const CLUSTERS = ["calcolatori", "generatori", "convertitori", "validatori"];
const FORMATS = ["currency", "percent", "number", "text"];

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
  else if (seo.canonical !== `/${cfg.cluster}/${cfg.slug}/`) {
    err(`\`seo.canonical\` deve essere "/${cfg.cluster}/${cfg.slug}/", trovato "${seo.canonical}"`);
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
  if (!tool.outputPrimary || !tool.outputPrimary.id) err("`tool.outputPrimary` obbligatorio");
  else if (!FORMATS.includes(tool.outputPrimary.format)) err(`\`tool.outputPrimary.format\` deve essere: ${FORMATS.join(", ")}`);
  (tool.outputSecondary || []).forEach((o, i) => {
    if (!FORMATS.includes(o.format)) err(`\`tool.outputSecondary[${i}].format\` deve essere: ${FORMATS.join(", ")}`);
  });
  (tool.breakdown || []).forEach((b, i) => {
    if (!b.id) err(`\`tool.breakdown[${i}].id\` obbligatorio`);
    if (!b.label) err(`\`tool.breakdown[${i}].label\` obbligatorio`);
    if (!["gross", "out", "in", "total"].includes(b.kind)) err(`\`tool.breakdown[${i}].kind\` deve essere gross|out|in|total`);
  });

  const sp = words(cfg.spiegazione && cfg.spiegazione.corpo);
  if (!cfg.spiegazione || !cfg.spiegazione.titolo) err("`spiegazione.titolo` obbligatorio");
  if (sp < 150) err(`\`spiegazione.corpo\` troppo corto (${sp} parole, min 150 — anti thin-content)`);

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
  if (!Array.isArray(cfg.fonti) || cfg.fonti.length < 1) warn("manca `fonti` (standard del progetto: consigliato obbligatorio)");
  else cfg.fonti.forEach((f, i) => { if (!f.titolo) err(`\`fonti[${i}].titolo\` obbligatorio`); });

  return { errors, warnings };
}

/** Controlli a livello di sito: title e primaryKeyword devono essere unici. */
export function validateSite(configs) {
  const errors = [];
  const byTitle = new Map();
  const byKw = new Map();
  for (const c of configs) {
    const t = (c.seo && c.seo.title || "").trim().toLowerCase();
    const k = (c.seo && c.seo.primaryKeyword || "").trim().toLowerCase();
    if (t) { if (byTitle.has(t)) errors.push(`seo.title duplicato tra "${byTitle.get(t)}" e "${c.slug}"`); else byTitle.set(t, c.slug); }
    if (k) { if (byKw.has(k)) errors.push(`seo.primaryKeyword duplicata tra "${byKw.get(k)}" e "${c.slug}"`); else byKw.set(k, c.slug); }
  }
  return { errors, warnings: [] };
}
