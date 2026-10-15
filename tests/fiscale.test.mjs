/**
 * VERIFICA DEI CALCOLATORI FISCALI — livello 2 del metodo (docs/verifica/metodo.md).
 *
 * Tre tipi di controllo:
 *  1. Casi ancorati: valori calcolati a mano dalla norma, scritti come numeri
 *     letterali con il procedimento nel commento. Se il calcolatore cambia, il
 *     test lo dice.
 *  2. Riferimento indipendente: una seconda implementazione scritta da zero
 *     dal testo delle norme (le regioni come formule esplicite, non dalla
 *     tabella dati del calcolatore), confrontata su una griglia di redditi
 *     che attraversa tutte le soglie, per tutte le regioni e i tipi di rapporto.
 *  3. Regressioni: i difetti trovati in verifica, perché non tornino.
 *
 * Tolleranza: ±1 € di netto mensile è la soglia del metodo; qui si pretende
 * molto di più (±0,01 € annui) perché le due implementazioni devono coincidere.
 * Esecuzione: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcolatore } from "./carica.mjs";

const stipendio = calcolatore("stipendio-netto-v1", "stipendio-netto.js", ["fisco-2026.js"]);
const tfr = calcolatore("tfr-v1", "tfr.js", ["tfr-2026.js"]);
const forfettario = calcolatore("forfettario-v1", "partita-iva-forfettario.js", ["forfettario-2026.js"]);

const vicino = (reale, atteso, tol, msg) =>
  assert.ok(Math.abs(reale - atteso) <= tol, `${msg}: ottenuto ${reale}, atteso ${atteso} (±${tol})`);

/* ======================= RIFERIMENTO INDIPENDENTE ======================= */

const INF = Infinity;
const tronca4 = (x) => Math.floor(x * 10000 + 1e-9) / 10000;
/** Imposta progressiva: fasce [[limite superiore, aliquota], …]. */
function progressiva(R, fasce) {
  let tot = 0, prev = 0;
  for (const [lim, al] of fasce) {
    if (R > prev) tot += (Math.min(R, lim) - prev) * al;
    prev = lim;
  }
  return tot;
}

/** Addizionale regionale 2026, una formula per regione (testo MEF, gen–giu 2026). */
const REGIONI = {
  "abruzzo": (R) => progressiva(R, [[28000, 0.0167], [50000, 0.0287], [INF, 0.0333]]),
  "basilicata": (R) => R * 0.0123,
  "provincia-bolzano": (R) => {
    let imp = progressiva(R, [[50000, 0.0123], [INF, 0.0173]]);
    if (R <= 90000) imp -= 430.5;                                   // lett. a
    if (R > 50000) imp -= Math.min(125, 125 * (R - 50000) / 25000); // lett. b
    return Math.max(0, imp);
  },
  "calabria": (R) => R * 0.0173,
  "campania": (R) => progressiva(R, [[15000, 0.0173], [28000, 0.0296], [50000, 0.032], [INF, 0.0333]]),
  "emilia-romagna": (R) => progressiva(R, [[15000, 0.0133], [28000, 0.0193], [50000, 0.0278], [INF, 0.0333]]),
  "friuli-venezia-giulia": (R) => (R <= 15000 ? R * 0.007 : R * 0.0123), // aliquota sull'intero importo
  "lazio": (R) => {
    if (R <= 28000) return R * 0.0173;                             // L.R. 20/2025 art. 2 c. 2
    const imp = progressiva(R, [[15000, 0.0173], [INF, 0.0333]]);
    return Math.max(0, imp - (R <= 30000 ? 60 : 0));               // art. 2 c. 3
  },
  "liguria": (R) => progressiva(R, [[28000, 0.0123], [50000, 0.0318], [INF, 0.0323]]),
  "lombardia": (R) => progressiva(R, [[15000, 0.0123], [28000, 0.0158], [50000, 0.0172], [INF, 0.0173]]),
  "marche": (R) => progressiva(R, [[15000, 0.0123], [28000, 0.0153], [50000, 0.017], [INF, 0.0173]]),
  "molise": (R) => progressiva(R, [[15000, 0.0203], [28000, 0.0223], [INF, 0.0363]]),
  "piemonte": (R) => progressiva(R, [[15000, 0.0162], [28000, 0.0268], [50000, 0.0331], [INF, 0.0333]]),
  "puglia": (R) => progressiva(R, [[15000, 0.0133], [28000, 0.0213], [50000, 0.0323], [INF, 0.0333]]),
  "sardegna": (R) => R * 0.0123,
  "sicilia": (R) => R * 0.0123,
  "toscana": (R) => progressiva(R, [[15000, 0.0142], [28000, 0.0143], [50000, 0.0332], [INF, 0.0333]]),
  "provincia-trento": (R) => (R <= 30000 ? 0 : progressiva(R, [[50000, 0.0123], [INF, 0.0173]])),
  "umbria": (R) => {
    if (R <= 28000) return R * 0.0123;                             // maggiorazioni non applicate
    const imp = progressiva(R, [[15000, 0.0173], [28000, 0.0302], [50000, 0.0312], [INF, 0.0333]]);
    return Math.max(0, imp - (R <= 50000 ? 150 : 0));
  },
  "valle-d-aosta": (R) => (R <= 15000 ? 0 : R * 0.0123),
  "veneto": (R) => R * 0.0123,
};

const INPS = { privato: 0.0919, pubblico: 0.088, apprendista: 0.0584 };

/** Netto annuo a tempo pieno per un anno intero, scritto dalle norme. */
function riferimento({ ral, tipo, regione, figli = 0, ascendenti = 0 }) {
  const inps = ral * INPS[tipo] + Math.max(0, ral - 56224) * 0.01;
  const R = ral - inps;
  const lorda = progressiva(R, [[28000, 0.23], [50000, 0.33], [INF, 0.43]]);

  let detLavoro = 0;
  if (R <= 15000) detLavoro = 1955;
  else if (R <= 28000) detLavoro = 1910 + 1190 * tronca4((28000 - R) / 13000);
  else if (R <= 50000) detLavoro = 1910 * tronca4((50000 - R) / 22000);
  if (R > 25000 && R <= 35000) detLavoro += 65;

  const den = 95000 + 15000 * Math.max(0, figli - 1);
  const detFigli = figli ? 950 * figli * Math.max(0, tronca4((den - R) / den)) : 0;
  const detAsc = ascendenti ? 750 * ascendenti * Math.max(0, tronca4((80000 - R) / 80000)) : 0;

  const irpefNetta = Math.max(0, lorda - detLavoro - detFigli - detAsc);

  const somma = R <= 20000 ? R * (R <= 8500 ? 0.071 : R <= 15000 ? 0.053 : 0.048) : 0;
  let ulteriore = 0;
  if (R > 20000 && R <= 32000) ulteriore = 1000;
  else if (R > 32000 && R < 40000) ulteriore = 1000 * (40000 - R) / 8000;
  ulteriore = Math.min(ulteriore, irpefNetta);

  let ti = 0;
  if (R <= 15000) ti = lorda > detLavoro - 75 ? 1200 : 0;
  else if (R <= 28000) ti = Math.min(1200, Math.max(0, detLavoro + detFigli + detAsc - lorda));

  const add = irpefNetta - ulteriore > 0 ? REGIONI[regione](R) : 0;
  return R - irpefNetta - add + somma + ulteriore + ti;
}

/* ============================ 1. CASI ANCORATI ============================ */

test("RAL 30.000, privato, Lombardia, 13 mensilità — calcolo a mano", () => {
  // INPS 30.000 × 9,19% = 2.757,00 → R = 27.243,00
  // IRPEF lorda 27.243 × 23% = 6.265,89
  // Detrazione: 1.910 + 1.190 × 0,0582 (757/13.000 troncato) = 1.979,258 + 65 = 2.044,258
  // IRPEF netta 4.221,632 · ulteriore detrazione cuneo 1.000 · TI 0 (detrazioni < lorda)
  // Addizionale Lombardia: 15.000 × 1,23% + 12.243 × 1,58% = 184,50 + 193,4394 = 377,9394
  // Netto = 27.243 − 4.221,632 − 377,9394 + 1.000 = 23.643,4286 → 1.818,73 €/mese
  const o = stipendio({ ral: 30000, mensilita: 13, tipoLavoratore: "privato", tipoContratto: "indeterminato", regione: "lombardia" });
  vicino(o.contributiInps, 2757, 0.005, "INPS");
  vicino(o.irpefTotale, 4221.632, 0.005, "IRPEF netta");
  vicino(o.addizionali, 377.9394, 0.005, "addizionale");
  vicino(o.nettoAnnuo, 23643.4286, 0.01, "netto annuo");
  vicino(o.nettoMensile, 1818.7253, 0.01, "netto mensile");
});

test("RAL 45.000, privato, Lazio, 14 mensilità — oltre 28.000 si torna agli scaglioni", () => {
  // R = 45.000 − 4.135,50 = 40.864,50 · lorda 6.440 + 12.864,50 × 33% = 10.685,285
  // Detrazione 1.910 × 0,4152 = 793,032 → IRPEF netta 9.892,253 · niente cuneo (R > 40.000)
  // Lazio: 15.000 × 1,73% + 25.864,50 × 3,33% = 1.120,788 (nessuna detrazione: R > 30.000)
  // Netto 29.851,459 → 2.132,25 €/mese
  const o = stipendio({ ral: 45000, mensilita: 14, tipoLavoratore: "privato", tipoContratto: "indeterminato", regione: "lazio" });
  vicino(o.addizionali, 1120.788, 0.005, "addizionale Lazio");
  vicino(o.nettoMensile, 2132.247, 0.01, "netto mensile");
});

test("Lazio sotto 28.000: aliquota unica 1,73% sull'intero imponibile", () => {
  // RAL 28.500 → R = 25.880,85 → 25.880,85 × 1,73% = 447,7387
  const o = stipendio({ ral: 28500, mensilita: 13, tipoLavoratore: "privato", tipoContratto: "indeterminato", regione: "lazio" });
  vicino(o.addizionali, 447.7387, 0.005, "addizionale Lazio ≤ 28.000");
});

test("P.A. Bolzano: la detrazione di 430,50 € azzera l'addizionale fino a 35.000 €", () => {
  // R ≈ 31.783,50 × 1,23% = 390,94 < 430,50 → 0
  const o = stipendio({ ral: 35000, mensilita: 13, tipoLavoratore: "privato", tipoContratto: "indeterminato", regione: "provincia-bolzano" });
  assert.equal(o.addizionali, 0);
});

/* ====================== 2. RIFERIMENTO INDIPENDENTE ====================== */

const RAL = [
  4000, 8000, 8500, 9000, 9100, 9200, 9400, 10000, 12000, 15000, 16000, 16500, 17000,
  20000, 21000, 22000, 22100, 24000, 27500, 28000, 28500, 30000, 30800, 31000, 33000,
  35000, 38000, 39000, 42000, 43000, 44000, 50000, 55000, 56224, 60000, 62000, 80000,
  100000, 150000, 250000,
];

test("griglia: 40 redditi × 21 regioni × 3 rapporti × carichi familiari", () => {
  let casi = 0, peggiore = 0;
  for (const regione of Object.keys(REGIONI)) {
    for (const tipo of Object.keys(INPS)) {
      for (const ral of RAL) {
        for (const [figli, ascendenti] of [[0, 0], [2, 0], [1, 1]]) {
          const atteso = riferimento({ ral, tipo, regione, figli, ascendenti });
          const o = stipendio({
            ral, mensilita: 13, tipoLavoratore: tipo, tipoContratto: "indeterminato",
            regione, figliACarico2129: figli, altriFamiliari: ascendenti,
          });
          const scarto = Math.abs(o.nettoAnnuo - atteso);
          peggiore = Math.max(peggiore, scarto);
          assert.ok(scarto <= 0.01,
            `${regione}/${tipo}/RAL ${ral}/figli ${figli}/asc ${ascendenti}: calcolatore ${o.nettoAnnuo.toFixed(2)} vs norma ${atteso.toFixed(2)}`);
          casi++;
        }
      }
    }
  }
  assert.ok(casi === 21 * 3 * RAL.length * 3);
});

/* ============================ 3. REGRESSIONI ============================ */

test("regressione: trattamento integrativo con la riduzione di 75 € (RAL 9.100)", () => {
  // R = 8.263,71 · lorda 1.900,65 > 1.955 − 75 = 1.880 → spetta 1.200 €
  // (prima della correzione si confrontava con 1.955 e il TI risultava 0)
  const o = stipendio({ ral: 9100, mensilita: 13, tipoLavoratore: "privato", tipoContratto: "indeterminato", regione: "veneto" });
  assert.equal(o.trattamentoIntegrativo, 1200);
});

test("regressione: niente addizionale regionale se l'IRPEF netta è zero (art. 50 D.Lgs. 446/1997)", () => {
  const o = stipendio({ ral: 9000, mensilita: 13, tipoLavoratore: "privato", tipoContratto: "indeterminato", regione: "molise" });
  assert.equal(o.irpefTotale, 0);
  assert.equal(o.addizionali, 0);
});

test("regressione: Friuli Venezia Giulia applica l'aliquota sull'intero importo, non per fasce", () => {
  // R = 18.162 (RAL 20.000 privato) → 18.162 × 1,23% = 223,39 (non 15.000 × 0,70% + resto × 1,23%)
  const o = stipendio({ ral: 20000, mensilita: 13, tipoLavoratore: "privato", tipoContratto: "indeterminato", regione: "friuli-venezia-giulia" });
  vicino(o.addizionali, 18162 * 0.0123, 0.01, "addizionale FVG");
});

test("tempo determinato: la detrazione del periodo non scende sotto 1.380 €", () => {
  const o = stipendio({ ral: 15000, mensilita: 13, tipoLavoratore: "privato", tipoContratto: "determinato", giorniLavorati: 60, regione: "veneto" });
  assert.ok(o.detrazioneLavoro >= 1380 - 0.005, `detrazione periodo ${o.detrazioneLavoro}`);
});

test("il netto mensile non dipende dalla durata del contratto a termine", () => {
  const pieno = stipendio({ ral: 26000, mensilita: 13, tipoLavoratore: "privato", tipoContratto: "indeterminato", regione: "piemonte" });
  const breve = stipendio({ ral: 26000, mensilita: 13, tipoLavoratore: "privato", tipoContratto: "determinato", giorniLavorati: 120, regione: "piemonte" });
  vicino(breve.nettoMensile, pieno.nettoMensile, 0.001, "netto mensile");
});

/* ================================== TFR ================================== */

function tfrRiferimento(ral, anni, coeff) {
  const quota = ral / 13.5 - ral * 0.005;          // art. 2120 c.c. − contributo 0,50% (L. 297/1982)
  let fondo = 0, rivalLorde = 0, rivalNette = 0;
  for (let i = 0; i < anni; i++) {
    const r = (fondo + rivalNette) * coeff;       // rivaluta il fondo al 31/12 precedente
    rivalLorde += r;
    rivalNette += r * 0.83;                        // imposta sostitutiva 17%
    fondo += quota;
  }
  const rr = (fondo / anni) * 12;                  // reddito di riferimento (art. 19 TUIR)
  const aliq = progressiva(rr, [[28000, 0.23], [50000, 0.33], [INF, 0.43]]) / rr;
  return { netto: fondo * (1 - aliq) + rivalNette, lordo: fondo + rivalLorde };
}

test("TFR in azienda: RAL 30.000, 10 anni, rivalutazione 2,311148% (ISTAT dic. 2025)", () => {
  // Quota annua 2.222,22 − 150 = 2.072,22 €
  const o = tfr({ ral: 30000, anni: 10, destinazione: "azienda", rivalutazioneAnnua: 2.311148 });
  const r = tfrRiferimento(30000, 10, 0.02311148);
  vicino(o.quotaAnnua, 2072.2222, 0.001, "quota annua");
  vicino(o.nettoTfr, r.netto, 0.01, "netto TFR");
  vicino(o.lordo, r.lordo, 0.01, "lordo TFR");
});

test("TFR al fondo pensione: aliquota finale 15% fino al 15° anno, poi −0,30%/anno, minimo 9%", () => {
  const a10 = tfr({ ral: 30000, anni: 10, destinazione: "fondo-pensione", rendimentoFondo: 0 });
  const a25 = tfr({ ral: 30000, anni: 25, destinazione: "fondo-pensione", rendimentoFondo: 0 });
  const a40 = tfr({ ral: 30000, anni: 40, destinazione: "fondo-pensione", rendimentoFondo: 0 });
  vicino(a10.aliquotaMedia, 0.15, 1e-9, "10 anni");
  vicino(a25.aliquotaMedia, 0.12, 1e-9, "25 anni");   // 15% − 10 × 0,30%
  vicino(a40.aliquotaMedia, 0.09, 1e-9, "40 anni");   // tetto di riduzione 6 punti
});

/* =========================== REGIME FORFETTARIO =========================== */

test("forfettario, gestione separata 26,07%: ricavi 50.000 €, coefficiente 78%", () => {
  // Reddito 39.000 · contributi 10.167,30 · imponibile 28.832,70 · imposta 15% 4.324,905
  // Netto 50.000 − 10.167,30 − 4.324,905 = 35.507,795
  const o = forfettario({ ricavi: 50000, coefficiente: 78, gestioneInps: "gestione-separata" });
  vicino(o.contributiInps, 10167.3, 0.005, "contributi");
  vicino(o.netto, 35507.795, 0.01, "netto");
});

test("forfettario, commercianti sotto il minimale con riduzione 35% e aliquota 5%", () => {
  // Reddito 16.000 < minimale 18.808 → contributo fisso 4.611,64 × 0,65 = 2.997,566
  // Imponibile 13.002,434 × 5% = 650,1217
  const o = forfettario({ ricavi: 40000, coefficiente: 40, gestioneInps: "commercianti", riduzione35: true, startup: true });
  vicino(o.contributiInps, 2997.566, 0.005, "contributi");
  vicino(o.impostaSostitutiva, 650.1217, 0.005, "imposta");
});

test("forfettario, artigiani oltre la 1ª fascia: 24% fino a 56.224 €, poi 25%", () => {
  // Reddito 68.800 → 4.521,36 + (56.224 − 18.808) × 24% + (68.800 − 56.224) × 25% = 16.645,20
  const o = forfettario({ ricavi: 80000, coefficiente: 86, gestioneInps: "artigiani" });
  vicino(o.contributiInps, 16645.2, 0.005, "contributi");
});
