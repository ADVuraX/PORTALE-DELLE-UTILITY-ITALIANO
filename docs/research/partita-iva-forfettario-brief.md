# Brief: Calcolatore Regime Forfettario (Partita IVA) — 2026

> Fonte di verità per il calcolatore `regime-forfettario` / `partita-iva-forfettario`.
> Ricerca da fonti ufficiali (INPS, Agenzia Entrate) e autorevoli (fiscoetasse, flextax, soluzionetasse, studioedi).
> **Costanti verificate per l'anno d'imposta 2026.** Le costanti INPS derivano dalle circolari INPS n. 6/2026 (artigiani/commercianti) e n. 8/2026 (gestione separata).
> Ultimo aggiornamento ricerca: luglio 2026.

---

## 1. Soglia ricavi/compensi

| Voce | Valore 2026 | Note |
|---|---|---|
| Soglia di accesso/permanenza | **85.000 €** | Ricavi/compensi dell'anno precedente. Confermata per il 2026. |
| Soglia di fuoriuscita immediata | **100.000 €** | Superamento in corso d'anno → uscita **immediata** dal regime nello stesso anno, con IVA dovuta dalle operazioni successive. |

Regole:
- Ricavi/compensi **> 85.000 € ma ≤ 100.000 €**: si resta nel forfettario per l'anno in corso; si passa al regime ordinario **dall'anno successivo**.
- Ricavi/compensi **> 100.000 €**: **uscita immediata** nell'anno stesso.
- Soglia riferita ai ricavi/compensi **percepiti** (principio di cassa), ragguagliata ad anno per attività iniziate in corso d'anno.

---

## 2. Coefficienti di redditività per gruppo ATECO

Tabella **completa** (9 gruppi). Coefficienti **invariati** rispetto al 2025.
(Nota: con l'aggiornamento della classificazione ATECO 2025, in vigore dal 1° aprile 2025, la corrispondenza dei codici può essere ri-mappata dal MEF, ma i **coefficienti** e il **raggruppamento per tipo di attività** restano quelli sotto.)

| # | Gruppo attività | Codici ATECO | Coefficiente |
|---|---|---|---|
| 1 | Industrie alimentari e delle bevande | 10 – 11 | **40%** |
| 2 | Commercio all'ingrosso e al dettaglio | 45 – (da 46.2 a 46.9) – (da 47.1 a 47.7) – 47.9 | **40%** |
| 3 | Commercio ambulante di prodotti alimentari e bevande | 47.81 | **40%** |
| 4 | Commercio ambulante di altri prodotti | 47.82 – 47.89 | **54%** |
| 5 | Costruzioni e attività immobiliari | 41 – 42 – 43 – 68 | **86%** |
| 6 | Intermediari del commercio | 46.1 | **62%** |
| 7 | Attività dei servizi di alloggio e di ristorazione | 55 – 56 | **40%** |
| 8 | Attività professionali, scientifiche, tecniche, sanitarie, di istruzione, servizi finanziari e assicurativi | 64 – 65 – 66 – (da 69 a 75) – (da 85 a 88) | **78%** |
| 9 | Altre attività economiche | (da 01 a 03) – (da 05 a 09) – (da 12 a 33) – (da 35 a 39) – 53 – (da 58 a 63) – (da 77 a 84) – (da 90 a 99) | **67%** |

Note d'uso:
- Il coefficiente **78%** copre i professionisti (avvocati, commercialisti, consulenti, medici, ingegneri, ecc.).
- Il coefficiente **67%** è il "catch-all" per le altre attività di servizi non professionali.
- Nel calcolatore, esporre una `select` con questi 9 gruppi (label leggibile + coefficiente), non i singoli codici ATECO.

---

## 3. Reddito imponibile — definizione

```
redditoLordoForfettario = ricavi × coefficienteRedditività
imponibileFiscale       = redditoLordoForfettario − contributiPrevidenzialiVersati
```

- Il reddito forfettario è **presunto**: NON si scaricano i costi reali (già inglobati nel coefficiente).
- I **contributi previdenziali obbligatori versati** sono l'**unica** deduzione ammessa dal reddito lordo forfettario.
- **Attenzione al segno**: `imponibileFiscale` non può essere negativo → `max(0, redditoLordoForfettario − contributi)`.

---

## 4. Imposta sostitutiva

Sostituisce IRPEF, addizionali regionale/comunale e IRAP.

| Aliquota | Quando |
|---|---|
| **15%** | Regime ordinario forfettario. |
| **5%** | **Nuove attività**, per i **primi 5 anni** (anno di inizio + 4 successivi). |

Condizioni per l'aliquota ridotta **5%** (start-up — tutte necessarie):
1. Il contribuente **non ha esercitato** attività artistica, professionale o d'impresa (anche associata/familiare) nei **3 anni precedenti** l'inizio.
2. L'attività **non è mera prosecuzione** di altra attività svolta come lavoro dipendente/autonomo (salvo periodo di pratica obbligatoria per una professione).
3. Se si prosegue un'attività altrui (es. subentro), i ricavi/compensi del periodo precedente **non superano 85.000 €**.

```
aliquotaImposta = start_up_valida ? 0.05 : 0.15
impostaSostitutiva = imponibileFiscale × aliquotaImposta
```

---

## 5. Contributi INPS 2026

### 5.a — Gestione Separata (professionisti senza cassa)

Professionista con P.IVA **non** iscritto ad altra gestione previdenziale obbligatoria e **senza** cassa di categoria.

| Voce | Valore 2026 |
|---|---|
| **Aliquota (senza altra copertura)** | **26,07%** (25,00% IVS + 0,72% maternità/malattia/congedo + 0,35% ISCRO) |
| Aliquota (già pensionato o iscritto ad altra gestione) | 24,00% |
| Base di calcolo | Reddito imponibile = `ricavi × coefficiente` (**NON** ridotto dai contributi) |
| Massimale reddito 2026 | **122.295 €** |
| Minimale / contributo fisso | **NESSUNO** — si versa solo in % sul reddito effettivo |

```
contributiGestioneSeparata = (ricavi × coefficiente) × 0.2607
```

> Nella gestione separata **non c'è contributo minimo fisso**: se il reddito è zero, i contributi sono zero.

### 5.b — Artigiani

| Voce | Valore 2026 |
|---|---|
| Aliquota IVS (fino al minimale e fino a 56.224 €) | **24,00%** |
| Aliquota sul reddito oltre **56.224 €** | **25,00%** (+1%) |
| Reddito **minimale** annuo | **18.808 €** |
| **Contributo fisso minimo** annuo (sul minimale, incl. maternità) | **4.521,36 €** |
| Massimale imponibile — iscritti **ante 1996** | **93.707 €** |
| Massimale imponibile — iscritti **dal 1996** | **122.295 €** |

### 5.c — Commercianti

| Voce | Valore 2026 |
|---|---|
| Aliquota IVS (fino al minimale e fino a 56.224 €) | **24,48%** (24,00% IVS + **0,48%** indennizzo cessazione) |
| Aliquota sul reddito oltre **56.224 €** | **25,48%** (+1%) |
| Reddito **minimale** annuo | **18.808 €** |
| **Contributo fisso minimo** annuo (sul minimale, incl. maternità) | **4.611,64 €** |
| Massimale imponibile — iscritti **ante 1996** | **93.707 €** |
| Massimale imponibile — iscritti **dal 1996** | **122.295 €** |

**Formula artigiani/commercianti** (base = reddito lordo forfettario = `ricavi × coefficiente`):

```
base = ricavi × coefficiente

se base <= 18.808:
    contributi = FISSO                         # 4.521,36 (art.) / 4.611,64 (comm.)
altrimenti:
    baseCap   = min(base, MASSIMALE)           # 122.295 (post-96) o 93.707 (ante-96)
    eccedenza = baseCap − 18.808
    # aliquota a scaglioni sull'eccedenza:
    quota1 = min(eccedenza, 56.224 − 18.808) × aliqBase      # 24,00% art / 24,48% comm
    quota2 = max(0, baseCap − 56.224)          × aliqBase+1%  # 25,00% art / 25,48% comm
    contributi = FISSO + quota1 + quota2
```

- Il contributo fisso è **dovuto comunque**, anche a reddito zero (a differenza della gestione separata).
- Soglia scaglione superiore: **56.224 €** di reddito d'impresa (oltre → aliquota +1%).

### 5.d — Riduzione 35% (forfettari artigiani/commercianti)

- I forfettari iscritti a gestione **artigiani o commercianti** possono chiedere la **riduzione del 35%** dei contributi (fissi **e** a percentuale).
- **Opzionale**, su **domanda** all'INPS (entro il 28 febbraio per l'anno in corso, o all'iscrizione).
- Riduce l'accredito contributivo ai fini pensionistici in proporzione.
- **NON** si applica alla gestione separata.

```
se forfettario_artig_comm AND riduzione35_richiesta:
    contributi = contributi × (1 − 0.35)   # = contributi × 0.65
```

Valori indicativi del **fisso ridotto 2026**: artigiani ≈ **2.938,88 €** (4.521,36 × 0,65), commercianti ≈ **2.997,57 €** (4.611,64 × 0,65).

### 5.e — Casse professionali private (cenno)

Professionisti iscritti a un **albo con cassa di previdenza privata** (es. avvocati → Cassa Forense, ingegneri/architetti → Inarcassa, commercialisti → CNPADC, medici → ENPAM) **non** versano alla gestione separata: versano alla **propria cassa**, con regole, aliquote, minimi e massimali **specifici per ciascuna cassa**. Nel calcolatore: prevedere un'opzione "Cassa professionale" che, per la stima, applica un'aliquota parametrica indicativa (tipicamente **~10–16%** soggettivo sul reddito + contributo integrativo, molto variabile) oppure lasciare l'utente inserire l'importo. **Non modellare ogni cassa** in dettaglio.

---

## 6. Ordine di calcolo (flusso confermato)

```
INPUT: ricavi, gruppoAttivita → coefficiente, gestione (separata|artigiani|commercianti|cassa),
       startup (bool), riduzione35 (bool, solo art/comm), anteo96 (bool, solo art/comm)

1. redditoLordoForfettario = ricavi × coefficiente

2. contributiINPS = f(gestione, redditoLordoForfettario, riduzione35, ante96)
     - gestione separata : redditoLordoForfettario × 0.2607        (nessun minimo)
     - artigiani/comm.   : fisso + scaglioni sull'eccedenza il minimale, cap al massimale
                           (× 0.65 se riduzione35)

3. imponibileFiscale = max(0, redditoLordoForfettario − contributiINPS)

4. impostaSostitutiva = imponibileFiscale × (startup ? 0.05 : 0.15)

5. nettoAnnuo = ricavi − contributiINPS − impostaSostitutiva
```

> **Confermato**: i contributi INPS si calcolano sul **reddito lordo forfettario** (`ricavi × coefficiente`), **non** sull'imponibile fiscale. L'imponibile fiscale è invece **al netto** dei contributi versati. Netto = ricavi − contributi − imposta.

---

## 7. Esempio numerico (verifica)

**Professionista in Gestione Separata, primo anno (aliquota 5%), coefficiente 78%, ricavi 50.000 €**

```
redditoLordoForfettario = 50.000 × 0,78            = 39.000,00 €
contributiINPS          = 39.000 × 0,2607          = 10.167,30 €
imponibileFiscale       = 39.000 − 10.167,30       = 28.832,70 €
impostaSostitutiva      = 28.832,70 × 0,05         =  1.441,64 €  (arrotondato)
nettoAnnuo              = 50.000 − 10.167,30 − 1.441,64 = 38.391,06 €
```

| Voce | Importo |
|---|---|
| Ricavi | 50.000,00 € |
| Reddito lordo forfettario (78%) | 39.000,00 € |
| Contributi INPS gestione separata (26,07%) | 10.167,30 € |
| Imponibile fiscale | 28.832,70 € |
| Imposta sostitutiva (5%) | 1.441,64 € |
| **Netto annuo** | **38.391,06 €** |

Con imposta ordinaria **15%** (dal 6° anno): imposta = 28.832,70 × 0,15 = 4.324,91 € → netto = 35.507,79 €.

---

## FONTI

Ufficiali:
- INPS — Gestioni artigiani e commercianti: i contributi per il 2026 (Circ. INPS n. 6/2026): https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.gestioni-artigiani-e-commercianti-i-contributi-per-il-2026.html
- INPS — Gestione Separata: le aliquote contributive per il 2026 (Circ. INPS n. 8/2026): https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.gestione-separata-le-aliquote-contributive-per-il-2026.html
- Agenzia delle Entrate — Regime forfetario: https://www.agenziaentrate.gov.it/portale/web/guest/regime-forfetario-imprese-professionisti

Autorevoli (verifica coefficienti, aliquote, esempi):
- FiscoeTasse — Regime forfettario 2026: tutte le regole: https://www.fiscoetasse.com/approfondimenti/15066-regime-forfettario-2026-tutte-le-regole.html
- Flextax — Coefficiente di redditività (tabella completa): https://flextax.it/regime-forfettario-coefficiente-di-redditivita/
- Flextax — Aliquota gestione separata INPS 2026: https://flextax.it/aliquota-gestione-separata-inps-2026/
- SoluzioneTasse — Contributi artigiani e commercianti 2026: https://www.soluzionetasse.com/contributi-artigiani-e-commercianti/
- StudioEdi — INPS 2026: aliquote artigiani, commercianti e gestione separata: https://www.studioedi.it/inps-2026-aliquote-contributive-per-artigiani-commercianti-e-gestione-separata
- CalcolatoriFiscali — Contributi INPS nel forfettario 2026: https://www.calcolatorifiscali.it/guide/contributi-inps-forfettario-2026
- Confcommercio — Contributi artigiani e commercianti 2026: https://www.confcommercio.it/-/gestioni-artigiani-e-commercianti-i-contributi
