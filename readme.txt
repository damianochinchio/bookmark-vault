bookmark-vault/
├── manifest.json
├── background.js
├── options.html
├── options.css
└── options.js


Due aspetti che considero importanti nella v1
1. La password non finisce in chrome.storage
La configurazione contiene solamente un verifier cifrato. Anche quello non è un hash della password utilizzabile direttamente: è un piccolo oggetto cifrato con una chiave derivata dalla password.

I backup contengono:

PBKDF2
   ↓
AES-256-GCM
   ↓
ciphertext

e ogni backup ha un salt e un iv nuovi.

2. Il backup viene creato prima di cancellare la cartella
La sequenza è volutamente:

Bookmark folder
      │
      ▼
serialize
      │
      ▼
encrypt
      │
      ▼
save/upload backup
      │
      ▼
verify success
      │
      ▼
removeTree()

L'API removeTree() elimina ricorsivamente la cartella, quindi non vogliamo mai chiamarla prima che il backup sia stato scritto con successo. 
C
Chrome for Developers

3. I backup precedenti non vengono sovrascritti
Ad ogni Lock & Hide:

backup 4 ← nuovo
backup 3
backup 2
backup 1

diventa:

backup 3 ← nuovo
backup 2
backup 1

quindi conserviamo sempre gli ultimi 3.

4. Google Drive non vede i bookmark
Drive vede qualcosa del tipo:

bookmark-vault-2026-09-30-08-31-22.bmbkp

il cui contenuto è ciphertext.

La cartella Drive viene creata dall'estensione e i backup sono caricati come file creati dall'app. La Drive API supporta il caricamento multipart e l'aggiornamento tramite PATCH. 
G
Google for Developers
+1