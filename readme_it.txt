================================================================
BOOKMARK VAULT
Estensione Chrome - Descrizione e guida d'uso (IT)
================================================================

L'interfaccia dell'estensione è in inglese.


----------------------------------------------------------------
1. COSA FA
----------------------------------------------------------------
Bookmark Vault protegge UNA cartella dei preferiti di Chrome
con una password.

Il Lock ("Lock & Hide") esegue questi passaggi, in quest'ordine:
  1. serializza l'albero della cartella
  2. lo critta con la tua password
  3. salva il backup crittato (storage locale o Google Drive)
  4. verifica che il backup sia stato realmente scritto
  5. e solo dopo cancella la cartella dai preferiti

L'Unlock ("Unlock & Show") scarica l'ultimo backup, lo decifra
e ricrea la cartella nella posizione originale. Se lì esiste già
una cartella con lo stesso nome, i preferiti vengono uniti a
quella esistente invece di sostituirla.

La password non viene mai salvata. Viene conservato solamente un
verificatore cifrato, che non permette di recuperare la password.

Requisito minimo: Chrome 120 o successivo.


----------------------------------------------------------------
2. INSTALLAZIONE
----------------------------------------------------------------
1. Apri chrome://extensions
2. Attiva "Modalità sviluppatore" (angolo in alto a destra)
3. Clicca "Carica espansa"
4. Seleziona la cartella bookmark-vault

Cliccando l'icona nella barra degli strumenti si apre la pagina
delle impostazioni.

Ogni esito (elaborazione in corso, successo, errore) viene
mostrato in una finestra popup centrata con pulsante OK.


----------------------------------------------------------------
3. CONFIGURAZIONE INIZIALE
----------------------------------------------------------------
Alla prima aperta delle impostazioni compare "Initial setup":

  - Folder to protect: scegli una normale cartella dei preferiti
    (una cartella dentro "Barra dei segnalibri", "Altri
    preferiti", ecc.)
  - Password: almeno 12 caratteri
  - Confirm password
  - Backup storage: Google Drive (consigliato) o Local storage

Poi premi "Configure Bookmark Vault".

Se scegli Google Drive, Chrome chiede una volta sola
l'autorizzazione all'estensione. Nella tua Drive viene creata
automaticamente una cartella chiamata "Bookmark Vault".


----------------------------------------------------------------
4. LOCK & HIDE (BLOCCA)
----------------------------------------------------------------
1. Premi "Lock & Hide"
2. Inserisci la password

La cartella viene salvata in backup (crittata) e poi rimossa
dai preferiti. L'indicatore di stato diventa "Locked" e il
pulsante Lock viene disabilitato.

Attenzione: finché la cartella è bloccata non puoi cambiare la
cartella protetta.


----------------------------------------------------------------
5. UNLOCK & SHOW (SBLOCCA)
----------------------------------------------------------------
1. Premi "Unlock & Show"
2. Inserisci la password

L'ultimo backup viene scaricato dallo storage, decifrato e la
cartella viene ripristinata. Se la cartella genitore non esiste
più, lo sblocco fallisce: non cancellare la cartella genitore
mentre il vault è bloccato.


----------------------------------------------------------------
6. CAMBIARE LA CARTELLA PROTETTA
----------------------------------------------------------------
Disponibile solo quando il vault è SBLOCCATO.

1. Sezione "Change protected folder"
2. Scegli la nuova cartella
3. Inserisci la password
4. Premi "Change protected folder"

I backup salvati vengono conservati: cambia solo la cartella
puntata.


----------------------------------------------------------------
7. CAMBIARE LA PASSWORD
----------------------------------------------------------------
Sezione "Change password":

  - Current password
  - New password (almeno 12 caratteri)
  - Confirm new password

Tutti i backup vengono ricrittati con la nuova password prima
del salvataggio. Se perdi la password i backup non saranno più
decifrabili: conservala con cura.


----------------------------------------------------------------
8. STORAGE DEI BACKUP
----------------------------------------------------------------
Sezione "Backup storage":

  - Current: Google Drive o Local storage
  - "Change storage location": sposta tutti i backup
    nell'altra destinazione (serve la password). Nulla viene
    cancellato prima che la copia abbia successo.
  - "Connect Google Drive": forza l'autorizzazione Google
  - "Disconnect Google Drive": cancella solo i token di
    autorizzazione in cache; i backup non vengono toccati.

Dettagli Google Drive:
  - L'estensione usa il scope drive.file, quindi può accedere
    solo ai file che ha creato lei.
  - I backup sono nella cartella "Bookmark Vault" come file
    bookmark-vault-AAAA-MM-GG-HH-MM-SS.bmbkp che contengono
    solo ciphertext.
  - Accanto a essi viene salvato un config.json con metadati
    non sensibili (percorso cartella, date, id dei backup).


----------------------------------------------------------------
9. BACKUP: ESPORTAZIONE E IMPORTAZIONE
----------------------------------------------------------------
L'estensione conserva GLI ULTIMI TRE backup. Quelli più vecchi
vengono eliminati automaticamente.

Ogni riga di backup ha un pulsante "Export": scarica quel backup
come file .bmbkp (scegli tu dove salvarlo).

Per ripristinare un file:
  1. Sezione "Backups" -> "Import backup"
  2. Seleziona il file .bmbkp
  3. Inserisci la password usata alla creazione del backup
  4. Premi "Import backup"

In questo modo puoi spostare i backup tra computer o tenerne una
copia fuori dal browser.


----------------------------------------------------------------
10. "ASK FOR LOCKING ON BROWSER CLOSING"
----------------------------------------------------------------
Casella di spunta nella dashboard, ATTIVA di default.

Chrome non permette a un'estensione di mostrare un dialogo
mentre il browser si chiude, quindi l'opzione funziona in due
modi:

  a) All'avvio del browser: se il vault è ancora sbloccato, la
     pagina delle impostazioni si apre da sola e chiede
     "Lock it now?" - conferma, inserisci la password, fatto.
  b) Finché la pagina delle impostazioni è aperta: se il vault
     è sbloccato e chiudi quel tab (o la finestra), il browser
     mostra un avviso prima di uscire dalla pagina.

Deseleziona la casella se preferisci bloccare manualmente.


----------------------------------------------------------------
11. NOTE SICUREZZA
----------------------------------------------------------------
  - KDF: PBKDF2-SHA256, 600.000 iterazioni
  - Cifrario: AES-256-GCM, salt e IV casuali nuovi per ogni
    backup
  - La password non viene mai scritta nello storage
  - Il backup crittato viene scritto e verificato PRIMA che la
    cartella dei preferiti venga cancellata
  - I vecchi backup non vengono mai sovrascritti; si tengono
    solo i tre più recenti
  - Google Drive riceve solo ciphertext

ATTENZIONE: non esiste recupero della password. Se perdi la
password, i dati bloccati non sono più recuperabili.


----------------------------------------------------------------
12. MESSAGGI CHE PUOI VEDERE
----------------------------------------------------------------
  "No backup is available."
      Non esiste ancora alcun backup crittato nello storage.

  "The original parent folder could not be found."
      La cartella genitore della cartella protetta è stata
      cancellata mentre il vault era bloccato.

  "Incorrect password."
      Password errata (anche per import e cambio password).

  "The protected folder could not be found."
      La cartella è stata rinominata, spostata o cancellata
      mentre era sbloccata.

  "Google Drive error ..."
      Drive ha rifiutato la richiesta (autorizzazione, quota,
      file non trovato). Premi "Connect Google Drive" per
      rinnovare l'autorizzazione.


----------------------------------------------------------------
13. FILE
----------------------------------------------------------------
bookmark-vault/
  manifest.json    manifest (permessi, icone)
  background.js    service worker: critto, Drive, preferiti
  options.html     pagina delle impostazioni
  options.css      stile delle impostazioni
  options.js       logica delle impostazioni
  icons/           icon16, icon32, icon48, icon128
  readme_*.txt     questa guida in altre lingue
  tests/           test di manutenzione (node --test tests)


----------------------------------------------------------------
14. LICENZA
----------------------------------------------------------------
Utilizzazione libera, anche a fini commerciali. Puoi copiarlo
e modificarlo.

IL SOFTWARE È FORNITO "COSÌ COMÈ", SENZA ALCUNA GARANZIA.
L'autore non si assume alcuna responsabilità per
malfunzionamenti, perdita di dati, preferiti danneggiati o
qualsiasi altro problema derivante dall'uso di questa
estensione.

Usala a tuo rischio e pericolo.
================================================================
