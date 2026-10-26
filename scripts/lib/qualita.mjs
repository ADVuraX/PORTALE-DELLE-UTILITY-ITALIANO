/**
 * QUALITÀ EDITORIALE — livello 4 del metodo (docs/verifica/metodo.md).
 * Eseguita da build.mjs dopo la validazione del contratto. Gli errori
 * bloccano la build, gli avvisi vanno risolti prima della pubblicazione.
 *
 * Cosa controlla:
 *  - frasi fatte e formule promozionali (la "voce da brochure");
 *  - affermazioni di ufficialità o garanzia che il sito non può fare;
 *  - pagine fatte con lo stampo (somiglianza fra spiegazioni);
 *  - fonti: almeno una primaria per strumento, due per i calcolatori fiscali;
 *  - lunghezza della spiegazione per tipo di strumento;
 *  - registro ("tu", non "Lei"), leggibilità (Gulpease), segnaposto rimasti.
 */

/** Frasi fatte: se compaiono, il testo sta riempiendo invece di dire. */
const FRASI_FATTE = [
  "in conclusione", "in sintesi", "è importante notare", "è importante sottolineare",
  "vale la pena", "nel mondo di oggi", "nell'era digitale", "al giorno d'oggi",
  "a portata di clic", "a portata di click", "in un batter d'occhio", "in pochi click",
  "in pochi clic", "facile e veloce", "semplice e veloce", "rapido e intuitivo",
  "semplice e intuitivo", "potente strumento", "strumento potente", "rivoluzionari",
  "il tuo alleato", "compagno ideale", "non cercare oltre", "senza pensieri",
  "soluzione definitiva", "guida definitiva", "tutto ciò che devi sapere",
  "a 360 gradi", "immergiti", "sblocca il", "massimizza", "esperienza utente",
  "il migliore", "la migliore", "i migliori", "senza sforzo", "in modo semplice",
  "come mai prima", "ti accompagna", "scopri come", "scopri subito",
];

/** Promesse che il sito non può mantenere su una stima. */
const PROMESSE = [
  { re: /\b(calcolo|risultato|calcolatore|strumento|valore) ufficiale\b/i, msg: "presenta una stima come ufficiale" },
  // "non è garantito" è un'avvertenza, non una promessa: le negazioni passano.
  { re: /(?<!\bnon (?:è |sono |viene |vengono )?|\bné )\bgarantit[oaie]\b|\bgarantiamo\b/i, msg: "promette una garanzia" },
  { re: /\b100 ?% (sicur|precis|esatt|affidabil)/i, msg: "promessa assoluta (100%)" },
  { re: /\b(precisione|sicurezza|affidabilità) (assoluta|totale)\b/i, msg: "promessa assoluta" },
];

/** Domini considerati fonte primaria (vedi gerarchia nel metodo). */
const PRIMARIE = [
  "agenziaentrate.gov.it", "inps.it", "gazzettaufficiale.it", "normattiva.it",
  "mef.gov.it", "finanze.gov.it", "istat.it", "covip.it", "garanteprivacy.it",
  "eur-lex.europa.eu", "ietf.org", "rfc-editor.org", "iso.org", "nist.gov",
  "bipm.org", "w3.org", "ecb.europa.eu", "bancaditalia.it", "swift.com",
  "iec.ch", "lavoro.gov.it", "edpb.europa.eu", "support.google.com", "policies.google.com",
  "qrcode.com", "denso-wave.com", "nasa.gov", "iau.org", "europa.eu",
];

const SOGLIA_SOMIGLIANZA = 0.15;

const testo = (s) => String(s || "").replace(/<[^>]+>/g, " ");
const parole = (s) => testo(s).trim().split(/\s+/).filter(Boolean);

/** Tutti i testi in prosa di un tool, con l'etichetta del campo. */
function prosaTool(cfg) {
  const out = [["intro", cfg.intro], ["disclaimer", cfg.disclaimer]];
  out.push(["spiegazione", spiegazioneTesto(cfg.spiegazione)]);
  (cfg.faq || []).forEach((f, i) => out.push([`faq[${i}]`, `${f.domanda} ${f.risposta}`]));
  (cfg.esempi || []).forEach((e, i) => out.push([`esempi[${i}]`, e.titolo]));
  return out;
}

/** Testo completo della spiegazione: corpo + sezioni. */
export function spiegazioneTesto(sp) {
  if (!sp) return "";
  const parti = [];
  if (sp.corpo) parti.push(Array.isArray(sp.corpo) ? sp.corpo.join(" ") : sp.corpo);
  (sp.sezioni || []).forEach((s) => parti.push(s.titolo, ...(s.paragrafi || []), ...(s.elenco || [])));
  return parti.join(" ");
}

function shingles(s, n = 4) {
  const w = parole(s).map((x) => x.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
  const set = new Set();
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(" "));
  return set;
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Indice Gulpease (leggibilità dell'italiano, 0–100; ≥ 60 facile, < 40 difficile). */
export function gulpease(s) {
  const t = testo(s);
  const w = parole(t);
  if (!w.length) return 100;
  const frasi = Math.max(1, (t.match(/[.!?;:](\s|$)/g) || []).length);
  const lettere = t.replace(/[^\p{L}]/gu, "").length;
  return 89 + (300 * frasi - 10 * lettere) / w.length;
}

function controllaProsa(id, campo, s, errors, warnings) {
  const t = testo(s).toLowerCase();
  for (const f of FRASI_FATTE) {
    if (t.includes(f)) errors.push(`[${id}] ${campo}: frase fatta «${f}»`);
  }
  for (const p of PROMESSE) {
    const m = testo(s).match(p.re);
    if (m) errors.push(`[${id}] ${campo}: ${p.msg} («${m[0]}»)`);
  }
  if (/!/.test(testo(s))) errors.push(`[${id}] ${campo}: punto esclamativo (tono promozionale)`);
  // Registro: niente "Lei/Suo" di cortesia a metà frase.
  const formale = testo(s).match(/[^.?!:]\s(Lei|Suo|Sua|Suoi|Sue)\b/);
  if (formale) warnings.push(`[${id}] ${campo}: registro formale («${formale[1]}»), il sito dà del tu`);
}

/**
 * @param configs Array config tool
 * @param site    content/site.json
 * @param pages   Array config pagine istituzionali (content/pagine/*.json)
 */
export function controllaQualita(configs, site, pages = []) {
  const errors = [];
  const warnings = [];

  // --- Strumenti ---
  for (const cfg of configs) {
    const id = cfg.slug;
    for (const [campo, s] of prosaTool(cfg)) controllaProsa(id, campo, s, errors, warnings);

    const nSpieg = parole(spiegazioneTesto(cfg.spiegazione)).length;
    const fiscale = cfg.cluster === "calcolatori";
    const min = fiscale ? 600 : 180;
    const max = fiscale ? 1400 : 700;
    if (nSpieg < min) errors.push(`[${id}] spiegazione di ${nSpieg} parole (minimo ${min} per ${fiscale ? "i calcolatori fiscali" : "questo tipo di strumento"})`);
    if (nSpieg > max) warnings.push(`[${id}] spiegazione di ${nSpieg} parole (oltre ${max}: verificare che ogni paragrafo serva)`);

    const g = gulpease(spiegazioneTesto(cfg.spiegazione));
    if (g < 40) warnings.push(`[${id}] spiegazione poco leggibile (Gulpease ${g.toFixed(0)} < 40)`);

    const fonti = cfg.fonti || [];
    const primarie = fonti.filter((f) => f.url && PRIMARIE.some((d) => new URL(f.url).hostname.endsWith(d)));
    if (!fonti.length) errors.push(`[${id}] nessuna fonte`);
    else if (!primarie.length) errors.push(`[${id}] nessuna fonte primaria (domini ammessi in qualita.mjs)`);
    else if (fiscale && primarie.length < 2) errors.push(`[${id}] calcolatore fiscale con ${primarie.length} fonte primaria (minimo 2)`);
    if (fiscale && !cfg.disclaimer) errors.push(`[${id}] calcolatore fiscale senza disclaimer`);
  }

  // --- Somiglianza fra spiegazioni (pagine fatte con lo stampo) ---
  const sh = configs.map((c) => [c.slug, shingles(spiegazioneTesto(c.spiegazione))]);
  for (let i = 0; i < sh.length; i++) {
    for (let j = i + 1; j < sh.length; j++) {
      const s = jaccard(sh[i][1], sh[j][1]);
      if (s > SOGLIA_SOMIGLIANZA) {
        errors.push(`[${sh[i][0]} ↔ ${sh[j][0]}] spiegazioni troppo simili (Jaccard ${s.toFixed(2)} > ${SOGLIA_SOMIGLIANZA})`);
      }
    }
  }

  // --- Domande FAQ identiche su pagine diverse ---
  const domande = new Map();
  for (const c of configs) {
    for (const f of c.faq || []) {
      const k = f.domanda.trim().toLowerCase();
      if (domande.has(k)) errors.push(`[${c.slug}] FAQ duplicata di "${domande.get(k)}": «${f.domanda}»`);
      else domande.set(k, c.slug);
    }
  }

  // --- Aree e pagine istituzionali ---
  for (const [key, c] of Object.entries(site.clusters || {})) {
    controllaProsa(`area:${key}`, "intro", c.intro, errors, warnings);
    (c.faq || []).forEach((f, i) => controllaProsa(`area:${key}`, `faq[${i}]`, `${f.domanda} ${f.risposta}`, errors, warnings));
  }
  controllaProsa("home", "intro", site.home && site.home.intro, errors, warnings);
  for (const p of pages) {
    (p.sezioni || []).forEach((s, i) => {
      controllaProsa(`pagina:${p.slug}`, `sezioni[${i}]`, [s.titolo, ...(s.paragrafi || []), ...(s.elenco || [])].join(" "), errors, warnings);
    });
  }

  // --- Segnaposto non compilati ---
  const json = JSON.stringify(site);
  if (/TUO-DOMINIO/.test(json)) warnings.push("site.json: dominio ancora segnaposto (domain)");
  if (site.titolare && /^\[/.test(site.titolare.nome || "")) warnings.push("site.json: nome del titolare ancora segnaposto (titolare.nome) — obbligatorio per la privacy policy");

  return { errors, warnings };
}
