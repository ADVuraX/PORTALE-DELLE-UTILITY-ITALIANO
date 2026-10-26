# Registro contenuti non fiscali — verifica ottobre 2026

Affermazioni verificabili di generatori, convertitori, validatori e pagine
istituzionali, con le fonti. Stato: **V** verificato · **C** corretto · **I** ipotesi/convenzione dichiarata.

## Generatori

| Affermazione | Fonte | Stato |
|---|---|---|
| Lunghezza minima password: 15 (fattore unico), 8 (più fattori); almeno 64 caratteri accettati; nessuna regola di composizione imposta | [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html) | V |
| getRandomValues fornisce valori crittograficamente robusti; Math.random non è adatto alla sicurezza | [W3C Web Crypto L2](https://www.w3.org/TR/webcrypto-2/), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) | V |
| Soglie Debole/Media/Forte/Eccellente (40/64/80 bit) | — | I · convenzione dello strumento, dichiarata |
| "Stessa sorgente di casualità di HTTPS/TLS" | non verificabile | **C** · rimossa |
| UUID: RFC 9562 (maggio 2024) sostituisce RFC 4122; v4 = 122 bit casuali; v7 ordinato nel tempo; scarsa località negli indici per v4; GUID = sinonimo | [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html) | V · **C** (era RFC 4122) |
| 50% di probabilità di collisione a ≈ 2,7 × 10¹⁸ UUID v4 | calcolo: √(2 ln2 · 2¹²²) | V |
| "Unicità garantita" | — | **C** · rimossa (probabilità, non certezza) |
| QR: correzione L 7% · M 15% · Q 25% · H 30%, Reed-Solomon; max 7.089 cifre; 21×21–177×177 moduli; zona di silenzio 4 moduli; M il più usato | [DENSO WAVE](https://www.qrcode.com/en/about/standards.html) | V |
| Standard in vigore ISO/IEC 18004:2024 (ed. 4) | [ISO](https://www.iso.org/standard/83389.html) | V |
| "Libreria conforme a ISO/IEC 18004" | non verificata per la libreria | **C** · riformulata |
| Libreria QR Code Generator di Kazuhiko Arase, MIT; "QR Code" marchio DENSO WAVE | intestazione di `qrcode.js` | V |
| Calcolo CF: cognome (art. 3: tre consonanti; due + prima vocale; una + due vocali; una + una vocale + X; due vocali + X; parti come unica successione; donne coniugate: cognome da nubile); nome (art. 4: con 4+ consonanti la 1ª, 3ª e 4ª); anno, lettere dei mesi, giorno + 40 per le donne, codice del comune o dello Stato estero (art. 5); omocodia (art. 6); carattere di controllo (art. 7) | D.M. 23/12/1976 ([GU](https://www.gazzettaufficiale.it/eli/id/1977/01/20/077U0006/sg), pubblicato nella GU n. 345 del 29/12/1976, S.O.): letto il 26/10/2026 nella trascrizione integrale di [dossier.net](https://www.dossier.net/utilities/codice-fiscale/decreto1976_13813.html), perché la GU del 1976 è solo in scansione e il supplemento non è scaricabile; le tabelle dell'art. 7 coincidono con quelle già verificate nel validatore | V · trascrizione secondaria, da riconfrontare con la scansione GU se reperibile |
| Codici catastali: 7.896 comuni attivi (colonna «Codice Catastale del comune»), 232 Stati esteri con codice dell'Agenzia delle Entrate | [ISTAT comuni](https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/), [ISTAT SITUAS, report 466](https://www.istat.it/classificazione/classificazione-degli-stati-esteri/), scaricati il 26/10/2026 con `npm run luoghi` | V |
| Omonimi fra comuni (es. Castro BG/LE, San Teodoro ME/SS, Samone TO/TN) | elenco ISTAT, controllo nei test | V |
| L'unico codice fiscale valido è quello rilasciato dall'Agenzia delle Entrate | [AdE, il codice fiscale](https://www.agenziaentrate.gov.it/portale/codice-fiscale-e-tessera-sanitaria/che-cos-) | V |
| Il codice del luogo occupa i caratteri dal 12° al 15° | D.M. art. 2 (3+3+2+1+2 caratteri prima del luogo) | V · **C** nel validatore (diceva «dall'undicesimo al quattordicesimo») |

## Convertitori

| Affermazione | Fonte | Stato |
|---|---|---|
| Fattori esatti di pollice, piede, iarda, miglio, miglio nautico, libbra, oncia, acro, galloni, pinta, oncia fluida, psi, mmHg, atm, BTU (IT), caloria termochimica | [NIST SP 811 App. B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) | V · test `strumenti.test.mjs` |
| km/h, nodo e psi prima arrotondati | — | **C** · ora 1/3,6, 1852/3600, 6894,757293168 |
| Prefissi binari KiB/MiB/GiB/TiB; prefissi SI solo potenze di 10 | [IEC](https://www.iec.ch/prefixes-binary-multiples), [BIPM](https://www.bipm.org/en/publications/si-brochure) | V |
| Visura catastale: ettari/are/centiare (sintetica), m² (analitica) | [AdE](https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/visura-catastale/come-leggere-la-visura) | V |
| Etichette: energia in kJ e kcal; riferimento 8.400 kJ / 2.000 kcal | [Reg. UE 1169/2011](https://eur-lex.europa.eu/legal-content/IT/TXT/HTML/?uri=CELEX:02011R1169-20250401) | V |
| Mach: 340,29 m/s (atmosfera standard, 15 °C); varia con la temperatura | [NASA Glenn](https://www.grc.nasa.gov/www/k-12/BGP/sound.html); NASA SP-4219 (1.116,4–1.116,9 ft/s) | V · I (valore di riferimento) |
| Limite autostradale 130 km/h | [CdS art. 142](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-04-30;285~art142) | V |
| Mese 30,4375 giorni, anno 365,25 (giuliano) | — | I · convenzione dichiarata |
| Formula "1 settimane", "1 anni" | — | **C** · singolare corretto |
| BCE: tassi stabiliti ~14:10, pubblicati ~16:00 CET, scopo informativo, rublo sospeso dal 2/3/2022 | [BCE](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html) | V |
| Il convertitore valuta usa anche open.er-api.com come riserva; RUB/AED/SAR non BCE | codice `valute-live.js` | V · **C** (la scheda diceva "Tassi BCE live") |

## Validatori

| Affermazione | Fonte | Stato |
|---|---|---|
| Struttura CF, tabelle dispari/pari, omocodia L–V | [D.M. 23/12/1976](https://www.gazzettaufficiale.it/eli/id/1977/01/20/077U0006/sg), [AdE](https://www.agenziaentrate.gov.it/portale/codice-fiscale-e-tessera-sanitaria/che-cos-) | V |
| Esempi CF pubblicati (RSSMRA85M01H501U "valido") | algoritmo indipendente in `strumenti.test.mjs` | **C** · erano sbagliati (corretti: …Q, …U) |
| CF: date inesistenti accettate, omocodia non segnalata, anno corrente fisso | — | **C** · codice corretto + test |
| Unico CF valido è quello rilasciato dall'AdE; servizio gratuito di verifica | [AdE](https://www.agenziaentrate.gov.it/portale/verifica-codice-fiscale) | V |
| Lunghezze IBAN di 36 paesi; esempi IT60X…, DE89…, GB82… | [SWIFT IBAN Registry](https://www.swift.com/standards/data-standards/iban-international-bank-account-number) | V |
| Mod-97 intercetta sempre una singola cifra sbagliata | dimostrazione: 97 primo, d·10ᵏ non divisibile per 97 | V · **C** ("qualsiasi carattere" era troppo forte) |
| Verifica del beneficiario gratuita e obbligatoria dal 9/10/2025 nei paesi euro | [Reg. UE 2024/886](https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=OJ:L_202400886) | V |
| Esito "IBAN valido" | — | **C** · ora "formalmente valido" |
| Partita IVA: 11 cifre = matricola (7), codice dell'ufficio legato alla provincia (3), controllo (1); calcolo della cifra di controllo | D.M. 23/12/1976 artt. 8–9 (trascrizione [dossier.net](https://www.dossier.net/utilities/codice-fiscale/decreto1976_13813.html), letta il 26/10/2026) | V · trascrizione secondaria |
| La partita IVA segue quella struttura: l'AdE indica «Codice Fiscale e Partita Iva: 06363391001» (controllo corretto); INPS «P.IVA 02121151001» (controllo corretto) | [AdE, verifica partita IVA](https://telematici.agenziaentrate.gov.it/VerificaPIVA/IVerificaPiva.jsp), sito INPS, letti il 26/10/2026 | V |
| Numero invariato fino alla cessazione; da indicare in dichiarazioni, home page del sito web, documenti | DPR 633/1972 art. 35 c. 1 (Normattiva, vigente 30/01/2026) | V |
| Servizio AdE: per un numero registrato mostra stato (attiva, sospesa, cessata), titolare, date | pagina del servizio AdE | V |
| VIES: motore di ricerca (non banca dati) della Commissione sulle banche dati nazionali; «non valido» = non esiste, non abilitata intra-UE, registrazione non ultimata | [Your Europe](https://europa.eu/youreurope/business/finance-and-tax/vat/check-vat-number-vies/index_it.htm) | V |
| Il controllo intercetta sempre una singola cifra sbagliata | dimostrazione: raddoppio ridotto è una permutazione delle cifre 0–9; test esaustivo su 99 sostituzioni | V |
| BIC: ISO 9362, SWIFT autorità di registrazione; 8 caratteri (4 istituto, 2 paese ISO 3166-1, 2 località) + 3 facoltativi di filiale; directory SWIFT | [SWIFT, BIC](https://www.swift.com/standards/data-standards/bic-business-identifier-code) (letto il 26/10/2026), [ISO 9362:2022](https://www.iso.org/standard/84108.html) | V |
| BIC senza cifre di controllo, non ricavabile dall'IBAN con un calcolo | struttura ISO 9362 (nessun elemento di controllo); Reg. UE 260/2012, considerando 8 (le banche usano elenchi per associare BIC e IBAN) | V |
| BIC non più richiesto per bonifici e addebiti in euro nell'UE dal 1/2/2016 | [Reg. UE 260/2012](https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32012R0260), art. 5 par. 4, 5, 7 e art. 16 par. 6 | V |

## Privacy, cookie, annunci

| Affermazione | Fonte | Stato |
|---|---|---|
| CMP certificata TCF obbligatoria per annunci personalizzati in UE dal 16/01/2024 | [AdSense](https://support.google.com/adsense/answer/13554116) | V |
| Banner: rifiuta/X con pari evidenza, niente scroll come consenso, niente caselle pre-spuntate, niente cookie wall | linee guida Garante 10/06/2021 (via iubenda, Legiscope) | V |
| Messaggio Google: "Acconsento / Non acconsento / Gestisci opzioni" + "Chiudi (non acconsentire)" | [AdSense](https://support.google.com/adsense/answer/10960768) | V · da attivare in console |
| Informativa AdSense: cookie Google e terzi, visite precedenti, Impostazioni annunci, aboutads.info | [AdSense, contenuti richiesti](https://support.google.com/adsense/answer/1348695) | V |
| Annunci in caselle mobili vietati; sticky manuali solo desktop, ≤ 300 px, uno solo, mai speculari | [Norme AdSense](https://support.google.com/adsense/answer/48182), [Ad formats FAQ](https://support.google.com/adsense/answer/10734935) | V · **C** (rimossi rail sinistro e anchor fatto in casa) |
| Cloudflare: DPF + SCC; Web Analytics senza cookie né fingerprinting | [Cloudflare GDPR](https://www.cloudflare.com/trust-hub/gdpr/), [blog](https://blog.cloudflare.com/privacy-first-web-analytics/) | V |
| Google LLC certificata DPF (attiva fino al 13/09/2027) | [DPF](https://www.dataprivacyframework.gov/participant/5780) | V |
| Fraunces e IBM Plex: SIL OFL 1.1 | [Fraunces](https://github.com/undercasetype/Fraunces), [IBM Plex](https://github.com/IBM/plex) | V |
