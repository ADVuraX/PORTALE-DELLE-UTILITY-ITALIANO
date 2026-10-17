# Guida alla pubblicazione di utilityitalia.it

Ordine obbligato: ogni passo dipende dal precedente. Tempi indicativi fra parentesi.

## 0. Prima di iniziare

- **Dominio.** `utilityitalia.it` è registrato su Aruba dal 17 ottobre 2026 (scadenza 17 ottobre 2027); passi 1–3 completati lo stesso giorno. Basta il solo dominio, con la gestione DNS inclusa; non servono hosting né caselle email Aruba.
- Account Cloudflare: è già quello collegato al repository GitHub, dove esiste il Worker `portaledelleutilityitaliano` che pubblica il sito a ogni push su `main`.
- Accesso al pannello Aruba: [admin.aruba.it](https://admin.aruba.it).
- Sul tuo computer, dalla cartella del progetto (quella che contiene `wrangler.toml`):

```bash
npm test
```

```bash
npm run build
```

Entrambi devono finire senza errori.

## 1. Aggiungi il dominio a Cloudflare (5 minuti)

1. Nel dashboard Cloudflare: **Aggiungi un dominio** → scrivi `utilityitalia.it` → scegli il piano **Free**.
2. Cloudflare importa i record DNS che trova. **Elimina** quelli con nome `utilityitalia.it` o `www` di tipo A, AAAA o CNAME: sono i puntamenti di Aruba e impedirebbero di collegare il sito.
3. Cloudflare ti mostra **due nameserver** (del tipo `nome.ns.cloudflare.com`). Copiali: servono al passo 2.

## 2. Cambia i nameserver su Aruba (5 minuti + propagazione)

1. Se nel pannello Aruba il **DNSSEC** del dominio risulta attivo, disattivalo prima di continuare.
2. [admin.aruba.it](https://admin.aruba.it) → seleziona `utilityitalia.it` → **Gestione DNS e Name Server** (se compare il pulsante **Attiva**, confermalo).
3. Nella sezione **Name Server** scegli l'opzione per sostituire i name server con quelli esterni e inserisci i due nameserver di Cloudflare. Se il modulo chiede anche un indirizzo IP, ricavalo dal terminale per ciascun nameserver:

```bash
nslookup nome.ns.cloudflare.com
```

4. Conferma con **Sostituisci** e poi **Prosegui**.

Cosa cambia: da questo momento i record DNS si gestiscono solo su Cloudflare e la casella email di Aruba legata al dominio smette di ricevere posta (la sostituisce Email Routing, passo 6).

La propagazione richiede da pochi minuti a 24–48 ore. Cloudflare ti manda un'email quando il dominio diventa **Attivo**: non andare avanti prima.

Guida Aruba: [gestire i name server](https://guide.aruba.it/hosting-e-domini/gestione-dns/gestione-name-server-e-record/gestire-name-server).

## 3. Collega il dominio al sito (5 minuti)

Il sito si pubblica già da solo: Cloudflare è collegato al repository e a ogni push su `main` ricarica il Worker `portaledelleutilityitaliano`. Finché il dominio non è attivo, lo trovi all'indirizzo `workers.dev` indicato in **Workers & Pages** → `portaledelleutilityitaliano`.

Quando Cloudflare segna `utilityitalia.it` come **Attivo**:

1. In `wrangler.toml` togli il `#` dalle tre righe del blocco `[[routes]]` (`pattern = "utilityitalia.it"`, `custom_domain = true`), oppure chiedilo a Claude.
2. Fai commit e push su `main`. Il deploy automatico crea il dominio personalizzato e il suo certificato HTTPS.
3. Dopo un paio di minuti apri [https://utilityitalia.it](https://utilityitalia.it). In **Workers & Pages** → `portaledelleutilityitaliano` → **Deployments** vedi l'esito di ogni pubblicazione.

Non attivare il blocco prima che il dominio sia attivo: il deploy fallirebbe perché Cloudflare non trova il dominio.

Il comando `npm run deploy` (dopo `npx wrangler login`) pubblica lo stesso Worker dal tuo computer: è un'alternativa, ma con il collegamento a GitHub non serve.

## 4. Reindirizza www verso il dominio principale (5 minuti)

1. **DNS** → **Aggiungi record**: tipo `A`, nome `www`, IPv4 `192.0.2.1`, proxy **attivo** (nuvola arancione). L'indirizzo è un segnaposto: il traffico viene reindirizzato prima di raggiungerlo.
2. **Regole** → **Crea regola** → **Redirect Rule** → modello **Redirect from WWW to root** → codice **301** → salva.
3. Verifica: `https://www.utilityitalia.it/convertitori/` deve portarti a `https://utilityitalia.it/convertitori/`.

## 5. HTTPS sempre attivo (1 minuto)

**SSL/TLS** → **Edge Certificates** → attiva **Always Use HTTPS**.

## 6. Email info@utilityitalia.it (10 minuti)

1. Dominio → **Email** → **Email Routing** → **Inizia**.
2. **Indirizzi di destinazione** → aggiungi la tua casella personale (per esempio Gmail) e apri il link di verifica che Cloudflare ti manda.
3. **Regole di instradamento** → crea l'indirizzo `info` → azione **Invia a un'email** → destinazione: la casella appena verificata.
4. Quando Cloudflare propone di aggiungere i record **MX** e **SPF**, conferma. Se trova record MX importati da Aruba (la vecchia posta), ti chiede di eliminarli: accetta, perché Email Routing funziona solo con i suoi.
5. Prova: da un account **diverso** da quello di destinazione scrivi a `info@utilityitalia.it` e controlla anche lo spam.

Email Routing riceve e inoltra, ma non invia: rispondi dalla tua casella personale.

## 7. Statistiche con Cloudflare Web Analytics (5 minuti)

1. **Analytics e log** → **Web Analytics** → **Aggiungi un sito** → `utilityitalia.it`.
2. Scegli l'installazione **con snippet JS**, non quella automatica: lo snippet lo inserisce il sito, e averli entrambi raddoppierebbe i conteggi.
3. Dallo snippet copia solo il valore del token: `data-cf-beacon='{"token": "QUESTO"}'`.
4. Incollalo in `content/site.json` → `analytics.cloudflareToken`, poi esegui `npm run build` e fai push su `main` (o chiedilo a Claude).

La sezione sulle statistiche compare da sola in privacy e cookie policy. Il servizio non usa cookie, quindi non serve il banner di consenso.

## 8. Google Search Console (10 minuti)

1. [search.google.com/search-console](https://search.google.com/search-console) → **Aggiungi proprietà** → tipo **Dominio** → `utilityitalia.it`.
2. Google chiede un record TXT: aggiungilo nel DNS di Cloudflare (o usa la verifica automatica proposta per Cloudflare).
3. **Sitemap** → invia `https://utilityitalia.it/sitemap.xml`.

## 9. AdSense (ultimo passo, dopo qualche settimana online)

1. Iscriviti su [adsense.google.com](https://adsense.google.com) indicando `utilityitalia.it`.
2. Copia il tuo ID publisher `ca-pub-…` in `content/site.json` → `annunci.client`, poi `npm run build` e push su `main`. Il sito genera da solo il meta di verifica, `ads.txt` e le sezioni su annunci e cookie in privacy e cookie policy.
3. In AdSense → **Privacy e messaggi** → messaggio per i regolamenti europei: opzioni **Acconsento, Non acconsento o Gestisci opzioni**, attiva **Chiudi (non acconsentire)**, collega `https://utilityitalia.it/privacy/`.
4. Richiedi la revisione e attendi l'esito.
5. Dopo l'approvazione: crea tre unità display (una verticale 160×600 per il rail, due 300×250 per il fondo pagina), inserisci gli ID in `annunci.slot` (`rail`, `fondo1`, `fondo2`), imposta `annunci.attivi` a `true`, `npm run build` e push su `main`. L'annuncio ancorato in basso si attiva dalla console: **Annunci automatici** → solo formato **ancorato**.

## Prima di ogni aggiornamento del sito

```bash
npm test
```

```bash
npm run build
```

```bash
npm run verifica:link
```

Poi commit e push su `main`: la pubblicazione è automatica.
