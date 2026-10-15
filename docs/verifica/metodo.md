# Metodo di verifica dei contenuti

Ogni pagina del sito — strumento, area, pagina istituzionale — passa da quattro
livelli di controllo prima della pubblicazione. Un contenuto che fallisce un
livello viene riscritto e ricontrollato da capo, finché non li supera tutti.

Il metodo esiste perché il sito tratta denaro, tasse e dati personali: un
errore qui non è un refuso, è una persona che firma un contratto o compila una
dichiarazione sulla base di un numero sbagliato.

## Gerarchia delle fonti

| Livello | Esempi | Uso |
|---|---|---|
| **Primaria** | Gazzetta Ufficiale, Normattiva, Agenzia delle Entrate (circolari, istruzioni dei modelli), INPS (circolari), MEF – Dipartimento Finanze, ISTAT, COVIP, Garante privacy, testo del GDPR, IETF (RFC), ISO, NIST, BIPM, W3C, BCE, pagine ufficiali di policy Google | Obbligatoria: ogni fatto ne ha almeno una |
| **Istituzionale derivata** | Siti delle Regioni che riportano il testo di una norma, NoiPA | Ammessa come conferma |
| **Secondaria** | Testate specializzate (EcNews, IPSOA, FiscoOggi), guide di settore | Solo come seconda fonte, mai da sola |
| **Esclusa** | Forum, blog anonimi, contenuti generati, calcolatori concorrenti come fonte di una regola | Mai |

I calcolatori pubblici di terzi sono ammessi **solo come termine di confronto
numerico** (livello 2), non come fonte di una regola.

## Livello 1 — Fatti

Ogni affermazione verificabile (un'aliquota, una soglia, una data, una norma,
una proprietà tecnica) entra nel registro (`registro-fiscale.md` per il fisco,
`registro-contenuti.md` per il resto) con:

- valore esatto;
- almeno **due fonti**, di cui almeno **una primaria**;
- data di verifica;
- pagine in cui compare.

Regole:

1. **Un'affermazione non verificabile su fonte primaria si elimina**, non si
   ammorbidisce. "Circa", "generalmente", "di solito" non rendono vera una
   frase incerta.
2. **Fatto e ipotesi si distinguono.** Le scelte del modello (RAL costante negli
   anni, rendimento ipotizzato del fondo pensione) sono ammesse solo se
   dichiarate come ipotesi nella pagina, con il loro effetto quando è
   quantificabile.
3. **Le attribuzioni normative vanno verificate quanto i numeri.** Citare la
   legge sbagliata per una regola giusta è un errore.
4. Una fonte secondaria che contraddice una primaria si scarta; due primarie in
   contrasto si segnalano nel registro e si sceglie la più recente, dichiarandolo.

## Livello 2 — Calcoli

Per ogni strumento esiste un test automatico (`npm test`):

- **Casi ancorati**: valori calcolati a mano dalla norma, scritti come numeri
  nel test insieme al procedimento.
- **Riferimento indipendente** (strumenti fiscali): una seconda
  implementazione scritta da zero dal testo delle norme, confrontata con il
  calcolatore su una griglia che attraversa tutte le soglie (no tax area,
  15.000, 28.000, 50.000, fasce del cuneo, soglie regionali) per tutte le
  regioni e i tipi di rapporto. Le due devono coincidere entro ±0,01 € annui.
- **Esempi pubblicati**: ogni esempio numerico mostrato in pagina viene
  ricalcolato dal codice a ogni test. Un esempio che non torna blocca il rilascio.
- **Confronto esterno**: almeno due calcolatori o esempi pubblici
  indipendenti. Tolleranza **±1 € di netto mensile**; ogni scarto oltre la
  tolleranza va **spiegato** (voce mancante nell'altro calcolatore, ipotesi
  diversa) e la spiegazione va nel registro. Uno scarto non spiegato è un errore.
- **Regressioni**: ogni difetto trovato diventa un test, perché non torni.
- Strumenti non fiscali: convertitori contro le definizioni esatte delle unità,
  validatori contro vettori ufficiali e un checksum ricalcolato a parte,
  generatori contro le proprietà richieste dalle specifiche.

## Livello 3 — Policy

Checklist applicata a ogni pagina e al sito nel suo insieme:

**Google AdSense** (norme del programma, contenuti richiesti, posizionamento)
- informativa privacy con: cookie di Google e di fornitori terzi per gli
  annunci, uso delle visite precedenti, link a Impostazioni annunci e
  aboutads.info;
- nessun invito a cliccare, nessuna freccia o elemento grafico che punti agli
  annunci, etichette solo "Pubblicità" o "Annunci";
- nessun annuncio in script che creano caselle mobili; annunci fissi manuali
  solo su desktop, larghezza ≤ 300 px, **uno solo visibile alla volta**, mai
  speculari ai due lati; l'annuncio ancorato in basso solo nel formato ufficiale
  Google;
- nessun annuncio a ridosso dei pulsanti degli strumenti (clic accidentali);
- contenuto originale e utile: niente pagine fatte con lo stampo.

**Privacy e cookie** (GDPR art. 13, linee guida cookie del Garante, art. 122 Codice privacy)
- titolare, finalità, basi giuridiche, destinatari, trasferimenti extra UE,
  conservazione, diritti, reclamo al Garante;
- banner con "Accetta" e "Rifiuta" (o "X" di rifiuto) di pari evidenza, nessuna
  casella pre-spuntata, scroll non vale come consenso, nessun cookie wall,
  scelta riproposta non prima di 6 mesi, possibilità di cambiare idea in ogni
  momento;
- ogni servizio terzo contattato dalla pagina è dichiarato.

**Contenuti YMYL** (denaro, fisco)
- data di aggiornamento visibile, fonti visibili, perimetro del calcolo
  dichiarato (cosa include e cosa no), invito a rivolgersi a un professionista
  per decisioni vincolanti;
- mai presentare una stima come risultato ufficiale.

## Livello 4 — Qualità editoriale

Controlli automatici eseguiti a ogni `npm run build` (`scripts/lib/qualita.mjs`).
Gli errori bloccano la build; gli avvisi si risolvono prima della pubblicazione.

| Controllo | Soglia | Esito |
|---|---|---|
| Frasi fatte e formule promozionali (elenco in `qualita.mjs`) | 0 occorrenze | errore |
| Affermazioni di ufficialità ("calcolo ufficiale", "garantito", "100% sicuro") | 0 | errore |
| Somiglianza fra pagine (Jaccard su sequenze di 4 parole della spiegazione) | ≤ 0,15 | errore |
| Fonti per strumento | ≥ 1; fiscali ≥ 2 primarie | errore |
| Registro: "tu" coerente, niente "Lei/Suo" | 0 | avviso |
| Leggibilità (indice Gulpease della spiegazione) | ≥ 40 | avviso |
| Segnaposto non compilati (dominio, titolare) | 0 prima del rilascio | avviso |

E controlli manuali, a ogni revisione:

- ogni paragrafo dice qualcosa che il lettore non sapeva prima; se non lo fa, si toglie;
- esempi italiani reali al posto di esempi generici;
- nessuna ripetizione fra spiegazione, FAQ ed esempi della stessa pagina;
- tono: tecnico trasparente e spiegato, rivolto al "tu", senza pareri personali.

## Ciclo

```
scrivi → livello 1 (registro) → livello 2 (npm test) → livello 3 (checklist)
       → livello 4 (npm run build) → tutto verde? ──no──▶ riscrivi
                                                └─sì──▶ pubblica, annota data
```

## Aggiornamento periodico

- **Gennaio**: nuova legge di bilancio, nuove circolari INPS (contributi,
  fasce), tabelle MEF delle addizionali regionali (pubblicate fra gennaio e
  giugno: ricontrollare ogni mese fino a giugno).
- **Febbraio–maggio**: istruzioni dei modelli 730 e Redditi (conferma delle formule).
- **Ogni mese**: coefficiente di rivalutazione TFR (ISTAT).
- **Ogni modifica normativa**: un solo file di dati in `public/assets/js/data/`,
  poi `npm test` e `npm run build`.
