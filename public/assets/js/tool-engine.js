/**
 * TOOL ENGINE — motore config-driven della "fabbrica di tool".
 * In produzione (Next.js) questa logica si divide in Server Components
 * (SEO, spiegazione, esempi, FAQ, related — statici) e un piccolo
 * Client Component solo per il tool interattivo.
 */

const CALCULATORS = {};

function registerCalculator(logicId, fn) {
  CALCULATORS[logicId] = fn;
}

function formatValue(value, format) {
  if (format === "currency") {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  }
  if (format === "percent") {
    return new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 1 }).format(value);
  }
  return value;
}

function renderInputs(config, container) {
  container.innerHTML = "";
  config.tool.inputs.forEach((input) => {
    const field = document.createElement("div");
    field.className = "field";
    const label = document.createElement("label");
    label.setAttribute("for", `in-${input.id}`);
    label.textContent = input.label;
    field.appendChild(label);

    let control;
    if (input.type === "select") {
      control = document.createElement("select");
      input.options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt; o.textContent = opt;
        if (opt === input.default) o.selected = true;
        control.appendChild(o);
      });
    } else {
      control = document.createElement("input");
      control.type = "number";
      if (input.min !== undefined) control.min = input.min;
      if (input.max !== undefined) control.max = input.max;
      if (input.step !== undefined) control.step = input.step;
      control.value = input.default;
    }
    control.id = `in-${input.id}`;
    control.dataset.inputId = input.id;
    control.addEventListener("input", () => runCalculation(config, container.parentElement));
    field.appendChild(control);
    container.appendChild(field);
  });
}

function collectInputValues(config, root) {
  const values = {};
  config.tool.inputs.forEach((input) => {
    const el = root.querySelector(`#in-${input.id}`);
    values[input.id] = input.type === "select" ? Number(el.value) || el.value : Number(el.value);
  });
  return values;
}

function runCalculation(config, toolCard) {
  const values = collectInputValues(config, toolCard);
  const calc = CALCULATORS[config.tool.logicId];
  if (!calc) {
    console.warn(`Nessun calcolatore registrato per logicId: ${config.tool.logicId}`);
    return;
  }
  const outputs = calc(values);

  const primaryEl = toolCard.querySelector(".result-primary .value");
  primaryEl.textContent = formatValue(outputs[config.tool.outputPrimary.id], config.tool.outputPrimary.format);

  const secondaryContainer = toolCard.querySelector(".result-secondary");
  secondaryContainer.innerHTML = "";
  config.tool.outputSecondary.forEach((out) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `<span class="label">${out.label}</span>${formatValue(outputs[out.id], out.format)}`;
    secondaryContainer.appendChild(item);
  });
}

function renderToolPage(config, rootEl) {
  rootEl.querySelector("[data-bind=breadcrumb]").textContent = `${config.cluster} / ${config.slug}`;
  rootEl.querySelector("[data-bind=eyebrow]").textContent = config.tema.toUpperCase();
  rootEl.querySelector("[data-bind=title]").textContent = config.seo.title.replace(/\s*[–-].*$/, "");
  rootEl.querySelector("[data-bind=intro]").textContent = config.intro;

  const inputsContainer = rootEl.querySelector("[data-bind=tool-inputs]");
  renderInputs(config, inputsContainer);
  rootEl.querySelector(".result-primary .label").textContent = config.tool.outputPrimary.label;

  rootEl.querySelector("[data-bind=spiegazione-titolo]").textContent = config.spiegazione.titolo;
  rootEl.querySelector("[data-bind=spiegazione-corpo]").textContent = config.spiegazione.corpo;

  const esempiContainer = rootEl.querySelector("[data-bind=esempi]");
  esempiContainer.innerHTML = "";
  config.esempi.forEach((es) => {
    const card = document.createElement("div");
    card.className = "example-card";
    card.innerHTML = `<div>${es.titolo}</div><div class="result">${es.risultatoAtteso}</div>`;
    esempiContainer.appendChild(card);
  });

  const faqContainer = rootEl.querySelector("[data-bind=faq]");
  faqContainer.innerHTML = "";
  config.faq.forEach((f) => {
    const item = document.createElement("details");
    item.className = "faq-item";
    item.innerHTML = `<summary>${f.domanda}</summary><p>${f.risposta}</p>`;
    faqContainer.appendChild(item);
  });

  const relatedContainer = rootEl.querySelector("[data-bind=related]");
  relatedContainer.innerHTML = "";
  config.relatedTools.forEach((slug) => {
    const a = document.createElement("a");
    a.className = "related-card";
    a.href = `/calcolatori/${slug}/`;
    a.innerHTML = `<span class="eyebrow">Tool correlato</span><span class="name">${slug.replace(/-/g, " ")}</span>`;
    relatedContainer.appendChild(a);
  });

  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": config.jsonLd.type,
    "name": config.seo.title,
    "applicationCategory": config.jsonLd.applicationCategory,
    "description": config.seo.metaDescription
  });
  document.head.appendChild(ld);

  runCalculation(config, rootEl.querySelector(".tool-card"));
}
