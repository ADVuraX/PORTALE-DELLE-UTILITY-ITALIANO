# Brief di ricerca — TFR / Trattamento di Fine Rapporto (2026)

> Fonte di verità per i valori codificati nel calcolatore TFR (`public/assets/js/calculators/tfr.js`
> + eventuale `public/assets/js/data/tfr-2026.js`).
> Convenzione progetto: **prima le fonti, poi il codice**. Ogni valore qui ha una fonte.
> Riferimento normativo base: **art. 2120 Codice Civile** (istituto TFR) e **L. 297/1982**.

---

## 1. Accantonamento annuo (quota TFR)

Ogni anno il datore accantona una quota della retribuzione:

```
quotaLorda   = retribuzioneUtileAnnua / 13.5
contributoFP = retribuzioneImponibileAnnua * 0.005     // 0,50% -> vedi §2
quotaNetta   = quotaLorda - contributoFP               // quota che alimenta il fondo TFR
```

- **Divisore 13,5 — CONFERMATO** (art. 2120 c.c.). Deriva da: la quota annua è `retribuzione / 13,5`,
  pari al **7,4074%** della retribuzione utile (`1 / 13,5 = 0,074074`). Al netto dello 0,50% (§2)
  l'aliquota effettiva scende a circa **6,91%**.
- **Retribuzione utile**: salvo diversa previsione del CCNL, **tutte le somme corrisposte in
  dipendenza del rapporto di lavoro a titolo NON occasionale**, incluse mensilità aggiuntive
  (13ª, 14ª), con **esclusione** dei rimborsi spese e delle somme occasionali. Nel calcolatore si
  può usare la RAL come proxy della retribuzione utile (semplificazione dichiarata, come per
  stipendio-netto).

Fonti: art. 2120 c.c.; guide §FONTI.

---

## 2. Contributo 0,50% (Fondo Adeguamento Pensioni, L. 297/1982)

Il datore versa all'INPS un contributo dello **0,50%** della retribuzione imponibile previdenziale
(FAP — "Fondo Adeguamento Pensioni"). Per legge questo importo è **recuperato dal datore
detraendolo dalla quota TFR accantonata**: quindi riduce di fatto il TFR maturato dal lavoratore.

```
contributoFP = imponibilePrevidenziale * 0.005
quotaNetta   = (RAL / 13.5) - contributoFP
```

- Si sottrae lo **0,50% della retribuzione imponibile** dalla quota annua lorda. **CONFERMATO.**
- Semplificazione calcolatore: `imponibilePrevidenziale ≈ RAL`.

---

## 3. Rivalutazione annua del TFR maturato

Il fondo TFR **già accumulato al 31/12 dell'anno precedente** si rivaluta ogni anno (art. 2120 c.c.):

```
coeffRivalutazione = 0.015 + 0.75 * (FOI_dicembre_anno / FOI_dicembre_annoPrec - 1)
rivalutazioneAnnua = montanteAl31Dic_annoPrec * coeffRivalutazione
```

- Componente fissa: **1,5%** annuo.
- Componente variabile: **75%** dell'aumento dell'indice **ISTAT FOI** (prezzi al consumo per le
  Famiglie di Operai e Impiegati, **al netto dei tabacchi**) rispetto a dicembre dell'anno precedente.
- **IMPORTANTE**: la rivalutazione si applica al **montante al 31/12 dell'anno precedente**, NON alla
  quota maturata nell'anno in corso (la quota dell'anno entra nel montante e verrà rivalutata dal
  1º gennaio successivo). **CONFERMATO.**

### Coefficienti annuali di riferimento (rivalutazione dicembre-su-dicembre)

| Anno | FOI dicembre | Aumento FOI su dic. prec. | Coefficiente annuo TFR |
|---|---|---|---|
| **2025** | **121,5** | +1,1% | **2,311148%** |
| **2024** | **120,2** | ~+1,1% | **2,320017%** |

- Default consigliato nel calcolatore (stima annua costante): **~2,3%** (usare **2,311148%** = ultimo
  dato consolidato dic. 2025).
- Verifica formula 2025: `1,5% + 0,75 × (121,5/120,2 − 1) = 1,5% + 0,75 × 1,0815% = 2,311%`. ✓

Fonti: ISTAT (comunicato 16/01/2026, FOI dic. 2025 = 121,5); §FONTI.

---

## 4. Imposta sostitutiva sulla rivalutazione (17%)

Ogni anno, sulla **sola rivalutazione** maturata, il datore versa un'imposta sostitutiva:

```
impostaSostitutiva = rivalutazioneAnnua * 0.17
rivalutazioneNetta = rivalutazioneAnnua - impostaSostitutiva
```

- Aliquota **17%** (dal 01/01/2015; prima era 11%). Si applica **annualmente** alla rivalutazione,
  non al montante. **CONFERMATO.**
- Conseguenza chiave per §5: le rivalutazioni **sono già tassate al 17%** e vanno **escluse** dalla
  base della tassazione separata IRPEF alla liquidazione.

---

## 5. Tassazione del TFR alla liquidazione (tassazione separata)

Il TFR gode di **tassazione separata** (art. 19 TUIR): non concorre al reddito complessivo dell'anno,
ma si tassa con un'aliquota media legata alla "storia" retributiva.

### Base imponibile

```
imponibileTFR = TFR_lordo_totale - rivalutazioni_totali   // le rivalutazioni sono già tassate al 17% (§4)
```

### Metodo passo-passo (aliquota media)

```
1) redditoRiferimento = (imponibileTFR / anniServizio) * 12
2) irpefTeorica        = IRPEF_scaglioni(redditoRiferimento)      // scaglioni 2026, §sotto
3) aliquotaMedia       = irpefTeorica / redditoRiferimento
4) impostaTFR          = imponibileTFR * aliquotaMedia
5) nettoTFR            = imponibileTFR - impostaTFR + rivalutazioniNette
                       = imponibileTFR - impostaTFR + (rivalutazioni_totali * 0.83)
```

- `anniServizio` può essere frazionario (mesi/12). Convenzione: frazioni ≥ 15 giorni = mese intero.
- Le rivalutazioni **nette** (già tassate 17%) si ri-aggiungono al netto finale (punto 5).

### Scaglioni IRPEF 2026 (per il calcolo dell'aliquota media)

| Scaglione | Aliquota |
|---|---|
| fino a 28.000 € | 23% |
| 28.000 – 50.000 € | 33% |
| oltre 50.000 € | 43% |

```
function irpef2026(r){
  let t = 0;
  t += Math.min(r, 28000) * 0.23;
  if (r > 28000) t += (Math.min(r, 50000) - 28000) * 0.33;
  if (r > 50000) t += (r - 50000) * 0.43;
  return t;
}
```

- Nota: l'Agenzia delle Entrate **riliquida** dopo 3–4 anni sulla media effettiva del reddito degli
  ultimi 5 anni (conguaglio/rimborso). Il calcolatore fornisce una **stima** con gli scaglioni
  correnti — dichiararlo in pagina.

Fonte scaglioni 2026: identica a stipendio-netto-brief §2 (Agenzia Entrate).

---

## 6. Destinazione del TFR (impatto sul calcolo)

| Destinazione | Rivalutazione | Tassazione alla liquidazione |
|---|---|---|
| **TFR in azienda** (< 50 dip.) | FOI: 1,5% + 75% ISTAT (§3), imposta sost. 17% sulla rival. (§4) | Tassazione separata, aliquota media IRPEF (§5) |
| **Fondo Tesoreria INPS** (aziende ≥ **50 dip.**) | **Identica** al TFR in azienda (stesso 1,5%+75% FOI, stesso 17%). Cambia solo chi custodisce/paga i fondi (INPS anziché azienda) | **Identica** (tassazione separata §5) |
| **Fondo pensione complementare** | **NON** si rivaluta col FOI: cresce secondo il **rendimento del fondo** (imposta sui rendimenti **20%**, non 17%) | **Tassazione agevolata 15%**, che scende di **0,30% per ogni anno oltre il 15º** di adesione, fino a un minimo del **9%** (35+ anni) |

- **Fondo Tesoreria INPS**: rilevante per aziende con **≥ 50 dipendenti**; ai fini del calcolo del TFR
  lordo/netto è **equivalente** al TFR in azienda (stesse formule §3-§5).
- **Fondo pensione**: regime completamente diverso. Formula aliquota:
  ```
  aliquotaFP = max(0.15 - 0.003 * max(anniAdesione - 15, 0), 0.09)
  ```
  Il montante non segue il FOI ma il rendimento di mercato del comparto scelto → il calcolatore, se
  copre questo scenario, deve chiedere un rendimento annuo atteso (input) invece del coeff. FOI.

Fonti: COVIP, §FONTI.

---

## 7. Esempio numerico completo

**Dati**: RAL 30.000 €, 10 anni di servizio, TFR lasciato in azienda, rivalutazione ~2,3%/anno.

```
Quota lorda annua   = 30.000 / 13,5           = 2.222,22 €
Contributo 0,50%    = 30.000 * 0,005          =   150,00 €
Quota netta annua   = 2.222,22 - 150,00       = 2.072,22 €   (alimenta il fondo)
```

Simulazione 10 anni (rivalutazione 2,3% sul montante di inizio anno, quota aggiunta a fine anno):

| Voce | Importo |
|---|---|
| Somma quote nette (10 × 2.072,22) = **imponibile TFR** | **20.722,20 €** |
| Rivalutazioni lorde totali (~2,3%/anno composto) | ~2.281,74 € |
| **TFR LORDO totale** (imponibile + rivalutazioni) | **~23.003,94 €** |
| Imposta sostitutiva 17% sulle rivalutazioni (già pagata) | ~387,90 € |
| Rivalutazioni nette (× 0,83) | ~1.893,84 € |

Tassazione separata sull'imponibile:

```
redditoRiferimento = (20.722,20 / 10) * 12 = 24.866,64 €   (interamente nel 1º scaglione)
irpefTeorica       = 24.866,64 * 0,23      =  5.719,33 €
aliquotaMedia      = 5.719,33 / 24.866,64  =  23,0%
impostaTFR         = 20.722,20 * 0,23      =  4.766,11 €
```

**Risultato**:

```
TFR lordo  ≈ 23.004 €
TFR netto  = 20.722,20 - 4.766,11 + 1.893,84 ≈ 17.850 €
```

(Valori indicativi; l'aliquota reale è soggetta a riliquidazione AdE sulla media quinquennale.)

---

## FONTI

- Art. 2120 Codice Civile — disciplina TFR, divisore 13,5, rivalutazione 1,5% + 75% FOI
- L. 297/1982 — istituzione TFR e contributo 0,50% (FAP)
- Art. 19 TUIR (DPR 917/1986) — tassazione separata TFR
- Agenzia delle Entrate — Imposta sostitutiva TFR (F24): https://www.agenziaentrate.gov.it/portale/schede/pagamenti/f24-imposta-sostitutiva-tfr/cosa-f24-imposta-sostitutiva-tfr-enti-e-pa
- Agenzia delle Entrate — Aliquote IRPEF: https://www.agenziaentrate.gov.it/portale/imposta-sul-reddito-delle-persone-fisiche-irpef-/aliquote-e-calcolo-dell-irpef
- ISTAT — Indici prezzi per rivalutazioni monetarie (FOI): https://www.istat.it/notizia/indice-dei-prezzi-per-le-rivalutazioni-monetarie/
- IPSOA — TFR e crediti di lavoro, rilevazioni ISTAT dicembre 2025: https://www.ipsoa.it/documents/quotidiano/2026/01/17/tfr-crediti-lavoro-rilevazioni-istat-dicembre-2025
- Edotto — Coefficiente rivalutazione TFR dicembre 2025 (FOI 121,5; coeff. 2,311148%): https://www.edotto.com/articolo/rivalutazione-tfr-pubblicato-il-coefficiente-di-dicembre-2025
- Avvocato Andreani — Coefficienti rivalutazione TFR (formula): https://www.avvocatoandreani.it/servizi/coefficienti-rivalutazione-tfr.php
- COVIP — Trattamento fiscale previdenza complementare (15%→9%, rendimenti 20%): https://www.covip.it/per-il-cittadino/educazione-previdenziale/faq/trattamento-fiscale
- Centro Fiscale — Guida TFR 2026 (calcolo, accantonamento, 0,50%): https://centrofiscale.com/guida-tfr-calcolo-accantonamento-anticipo-2026/
- Centro Fiscale — Tassazione TFR 2026, aliquota media: https://centrofiscale.com/tassazione-tfr-2026-aliquote-calcolo-netto-esempi/
- Fisco e Tasse — Fondi pensione: regole, TFR, tassazione: https://www.fiscoetasse.com/approfondimenti/15800-fondi-pensione-regole-tfr-tassazione-prevista.html
- PMI.it — Guida al TFR, calcolo e anticipi: https://www.pmi.it/impresa/normativa/9507/guida-al-tfr-calcolo-accantonamento-e-anticipi.html
