/**
 * Calcolo semplificato Lordo -> Netto (IRPEF 2024/2026, 3 scaglioni).
 * Funzione pura: stessi input => stesso output. Portabile 1:1 in
 * /lib/calculators/stipendio-netto.ts quando si migra a Next.js.
 */
function calcolaStipendioNetto({ ral, mensilita, figliACarico }) {
  const ALIQUOTA_INPS = 0.0919;
  const contributiInps = ral * ALIQUOTA_INPS;
  const imponibileIrpef = ral - contributiInps;

  const scaglioni = [
    { fino: 28000, aliquota: 0.23 },
    { fino: 50000, aliquota: 0.35 },
    { fino: Infinity, aliquota: 0.43 }
  ];
  let irpefLorda = 0;
  let precedente = 0;
  for (const s of scaglioni) {
    if (imponibileIrpef > precedente) {
      const base = Math.min(imponibileIrpef, s.fino) - precedente;
      irpefLorda += base * s.aliquota;
      precedente = s.fino;
    }
  }

  let detrazioneLavoro = 0;
  if (imponibileIrpef <= 15000) {
    detrazioneLavoro = Math.max(1955, imponibileIrpef * 0.069);
  } else if (imponibileIrpef <= 28000) {
    detrazioneLavoro = 1910 + 1190 * ((28000 - imponibileIrpef) / 13000);
  } else if (imponibileIrpef <= 50000) {
    detrazioneLavoro = 1910 * ((50000 - imponibileIrpef) / 22000);
  }

  const detrazioneFigli = figliACarico * 950;

  const irpefTotale = Math.max(0, irpefLorda - detrazioneLavoro - detrazioneFigli);
  const nettoAnnuo = ral - contributiInps - irpefTotale;
  const nettoMensile = nettoAnnuo / mensilita;
  const aliquotaEffettiva = ral > 0 ? irpefTotale / ral : 0;

  return { nettoMensile, nettoAnnuo, contributiInps, irpefTotale, aliquotaEffettiva };
}

if (typeof registerCalculator === "function") {
  registerCalculator("stipendio-netto-v1", calcolaStipendioNetto);
}
