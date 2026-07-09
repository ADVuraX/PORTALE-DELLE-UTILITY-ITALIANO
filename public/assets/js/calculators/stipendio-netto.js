/**
 * Calcolo Lordo -> Netto (dipendente, anno 2026). Funzione pura: stessi input
 * => stesso output. Le costanti fiscali stanno in /assets/js/data/fisco-2026.js
 * (globalThis.FISCO["2026"]). Vedi il metodo in docs/research/stipendio-netto-brief.md.
 *
 * Perimetro v2: dipendente privato / pubblico / apprendista. Include:
 * contributi INPS per tipo, IRPEF a scaglioni, detrazione lavoro (art.13),
 * detrazioni figli 21–29 e altri familiari a carico (art.12), taglio del cuneo,
 * trattamento integrativo e ADDIZIONALE REGIONALE. NON incluse: addizionale
 * comunale, coniuge a carico, premi/welfare/conguagli, particolarità CCNL.
 * Base reddito per le detrazioni = imponibile fiscale (RAL − contributi INPS).
 */
function calcolaStipendioNetto(input) {
  var F = (typeof window !== "undefined" ? window : globalThis).FISCO["2026"];
  var ralAnnua = Number(input.ral) || 0;
  var mensilita = Number(input.mensilita) || 13;
  var tipoLavoratore = input.tipoLavoratore || "privato";
  var tipoContratto = input.tipoContratto || "indeterminato";
  var regione = input.regione || "";
  var nFigli = Math.max(0, Math.floor(Number(input.figliACarico2129) || 0));
  var nFamiliari = Math.max(0, Math.floor(Number(input.altriFamiliari) || 0));

  // 0. Tempo determinato: la RAL è il tasso ANNUO. I giorni lavorati (1..365)
  //    riproporzionano SOLO gli importi del periodo (retribuzione lorda RL e i
  //    relativi totali). Il calcolo fiscale gira sempre sul tasso annuo pieno
  //    (ragguaglio ad anno, come in busta paga): un contratto più corto NON
  //    aumenta lo stipendio mensile, riduce solo quanto incassi nell'anno.
  var giorniAnno = F.giorniAnno || 365;
  var giorni = tipoContratto === "determinato"
    ? Math.min(giorniAnno, Math.max(1, Math.floor(Number(input.giorniLavorati) || giorniAnno)))
    : giorniAnno;
  var fattorePeriodo = giorni / giorniAnno;
  var ral = ralAnnua; // calcolo fiscale sempre sul tasso annuo pieno

  // 1. Contributi INPS (IVS) — aliquota per tipo di rapporto (+1% oltre soglia).
  var aliquotaInps = (F.inps.perTipo && F.inps.perTipo[tipoLavoratore]) || F.inps.aliquota;
  var contributiInps = ral * aliquotaInps;
  if (ral > F.inps.sogliaAggiuntiva) {
    contributiInps += (ral - F.inps.sogliaAggiuntiva) * F.inps.aliquotaAggiuntiva;
  }

  // 2. Imponibile fiscale = reddito di riferimento.
  var imponibile = ral - contributiInps;
  var R = imponibile;

  // 3. IRPEF lorda a scaglioni.
  var irpefLorda = 0, prev = 0;
  F.irpef.scaglioni.forEach(function (s) {
    if (R > prev) {
      irpefLorda += (Math.min(R, s.fino) - prev) * s.aliquota;
      prev = s.fino;
    }
  });

  // 4. Detrazione per lavoro dipendente (art. 13 TUIR). La formula dà l'importo
  //    annuo teorico sul reddito (del periodo, per il tempo determinato).
  var d = F.detrazioneLavoro;
  var detrazioneTeorica = 0;
  if (R <= 15000) {
    detrazioneTeorica = d.fino15k;
  } else if (R <= d.sup2) {
    detrazioneTeorica = d.base2 + d.quota2 * ((d.sup2 - R) / d.ampiezza2);
  } else if (R <= d.sup3) {
    detrazioneTeorica = d.base3 * ((d.sup3 - R) / d.ampiezza3);
  }
  // Maggiorazione +65 € per reddito complessivo 25.001–35.000 (art. 13 c.1 TUIR,
  // L. 207/2024): a cavallo del 2° e 3° scaglione, non solo entro 28.000.
  if (R > d.maggiorazioneDa && R <= d.maggiorazioneA) detrazioneTeorica += d.maggiorazione;
  // Detrazione al tasso annuo pieno (il riproporzionamento del periodo è a fine
  // funzione, uguale per tutte le voci del bilancio).
  var detrazioneLavoro = detrazioneTeorica;

  // 4-bis. Detrazioni per figli 21–29 (art. 12) — decrescente col reddito.
  var detrFigli = 0;
  if (nFigli > 0) {
    var df = F.detrazioniFigli;
    var denom = df.denomBase + df.denomPerFiglioExtra * (nFigli - 1);
    var ratio = Math.max(0, (denom - R) / denom);
    detrFigli = df.teorica * nFigli * ratio;
  }

  // 4-ter. Detrazioni altri familiari a carico (ascendenti conviventi, art. 12).
  var detrFamiliari = 0;
  if (nFamiliari > 0) {
    var da = F.detrazioniAltriFamiliari;
    var ratioF = Math.max(0, (da.tettoReddito - R) / da.tettoReddito);
    detrFamiliari = da.teorica * nFamiliari * ratioF;
  }

  var detrazioniFamiliari = detrFigli + detrFamiliari;

  // IRPEF netta: detrazioni capienti (non generano credito).
  var irpefTotale = Math.max(0, irpefLorda - detrazioneLavoro - detrazioniFamiliari);

  // 5. Taglio del cuneo fiscale 2026.
  //    Parte A — bonus esente (% del reddito) per R ≤ 20.000.
  var cuneoBonus = 0;
  for (var i = 0; i < F.cuneo.bonus.length; i++) {
    if (R <= F.cuneo.bonus[i].fino) { cuneoBonus = R * F.cuneo.bonus[i].perc; break; }
  }
  //    Parte B — ulteriore detrazione per 20.001–40.000, capiente sull'IRPEF.
  var c = F.cuneo.detrazione;
  var cuneoDetrazione = 0;
  if (R > c.da && R <= c.fissoFino) cuneoDetrazione = c.importo;
  else if (R > c.fissoFino && R < c.azzeraA) cuneoDetrazione = c.importo * ((c.azzeraA - R) / (c.azzeraA - c.fissoFino));
  cuneoDetrazione = Math.min(cuneoDetrazione, irpefTotale);
  var cuneo = cuneoBonus + cuneoDetrazione;
  // Natura del cuneo per fascia di reddito (sotto-etichetta automatica nel bilancio):
  // ≤ 20.000 è una somma esente in busta paga; oltre, un'ulteriore detrazione IRPEF.
  var cuneoSub = cuneoBonus > 0
    ? "Somma esente in busta paga"
    : (cuneoDetrazione > 0 ? "Ulteriore detrazione IRPEF" : "");

  // 6. Trattamento integrativo (ex Bonus Renzi). Capienza valutata (per norma)
  //    contro la sola detrazione per lavoro dipendente.
  var ti = F.trattamentoIntegrativo;
  var trattamentoIntegrativo = 0;
  if (R <= ti.sogliaPiena) {
    if (irpefLorda > detrazioneLavoro) trattamentoIntegrativo = ti.importo;
  } else if (R <= ti.sogliaMax) {
    // 15.001–28.000: spetta solo se la SOMMA delle detrazioni "specifiche" supera
    // l'IRPEF lorda; l'importo è la differenza, entro il tetto (1.200 €). Nel
    // perimetro di questo tool le detrazioni sommate sono lavoro (art.13) +
    // familiari a carico (art.12); mutuo, locazioni ed edilizie restano fuori.
    var capienza = (detrazioneLavoro + detrazioniFamiliari) - irpefLorda;
    if (capienza > 0) trattamentoIntegrativo = Math.min(ti.importo, capienza);
  }

  // 7. Addizionale regionale (progressiva a scaglioni o fissa).
  var reg = F.addizionaleRegionale && F.addizionaleRegionale[regione];
  var addizionali = addizionaleRegionale(R, reg);
  var notaRegione = reg && reg.affidabilita === "provvisoria"
    ? "Dati regionali 2026 non ancora pubblicati dal MEF: stima da fonti secondarie, in aggiornamento."
    : "";

  // 8. Netto ANNUO al tasso pieno → netto MENSILE (identico per determinato e
  //    indeterminato: il contratto a termine non cambia lo stipendio mensile).
  var nettoAnnuoFull = imponibile - irpefTotale - addizionali + cuneo + trattamentoIntegrativo;
  var nettoMensile = nettoAnnuoFull / mensilita;
  var aliquotaEffettiva = ral > 0 ? (ral - nettoAnnuoFull) / ral : 0; // prelievo totale su lordo (invariante)

  // Riproporzionamento del periodo (solo tempo determinato): ogni voce del
  // bilancio scala coi giorni lavorati. Il mensile qui sopra NON si tocca.
  var nettoAnnuo = nettoAnnuoFull * fattorePeriodo; // "netto totale" del periodo
  var lordoPeriodo = ral * fattorePeriodo;
  contributiInps *= fattorePeriodo;
  imponibile *= fattorePeriodo;
  irpefLorda *= fattorePeriodo;
  detrazioneLavoro *= fattorePeriodo;
  detrazioniFamiliari *= fattorePeriodo;
  irpefTotale *= fattorePeriodo;
  cuneo *= fattorePeriodo;
  trattamentoIntegrativo *= fattorePeriodo;
  addizionali *= fattorePeriodo;

  return {
    lordo: lordoPeriodo,
    contributiInps: contributiInps,
    imponibile: imponibile,
    irpefLorda: irpefLorda,
    detrazioneLavoro: detrazioneLavoro,
    detrazioniFamiliari: detrazioniFamiliari,
    irpefTotale: irpefTotale,
    cuneo: cuneo,
    cuneoSub: cuneoSub,
    trattamentoIntegrativo: trattamentoIntegrativo,
    addizionali: addizionali,
    nettoAnnuo: nettoAnnuo,
    nettoMensile: nettoMensile,
    aliquotaEffettiva: aliquotaEffettiva,
    notaRegione: notaRegione,
  };
}

/** Addizionale regionale su imponibile R. Scaglioni = progressiva per fascia. */
function addizionaleRegionale(R, reg) {
  if (!reg || R <= 0) return 0;
  if (reg.esenzioneFino && R <= reg.esenzioneFino) return 0;
  if (reg.tipo === "fissa") return R * (reg.aliquota || 0);
  if (reg.tipo === "scaglioni" && reg.scaglioni) {
    var tot = 0, prev = 0;
    for (var i = 0; i < reg.scaglioni.length; i++) {
      var s = reg.scaglioni[i];
      var fino = s.fino == null ? Infinity : s.fino;
      if (R > prev) { tot += (Math.min(R, fino) - prev) * s.aliquota; prev = fino; }
    }
    return tot;
  }
  return 0;
}

if (typeof registerCalculator === "function") {
  registerCalculator("stipendio-netto-v1", calcolaStipendioNetto);
}
