================================================================
BOOKMARK VAULT
Chrome extension - Description and user guide (EN)
================================================================

The interface of the extension is in English.


----------------------------------------------------------------
1. WHAT IT DOES
----------------------------------------------------------------
Bookmark Vault protects ONE Chrome bookmark folder with a
password.

Lock ("Lock & Hide") performs these steps, in this order:
  1. serialize the folder tree
  2. encrypt it with your password
  3. write the encrypted backup (local storage or Google Drive)
  4. verify that the backup was really saved
  5. only then delete the folder from your bookmarks

Unlock ("Unlock & Show") downloads the latest backup, decrypts
it and recreates the folder in its original position. If a
folder with the same name already exists there, the bookmarks
are merged into it instead of replacing it.

Your password is never stored. Only a small encrypted verifier
is saved, and it cannot be used to recover the password.

Minimum requirement: Chrome 120 or newer.


----------------------------------------------------------------
2. INSTALLATION
----------------------------------------------------------------
1. Open chrome://extensions
2. Enable "Developer mode" (top-right corner)
3. Click "Load unpacked"
4. Select the bookmark-vault folder

Clicking the toolbar icon opens the settings page.

Every result (working, success, error) is shown in a centered
popup window with an OK button.


----------------------------------------------------------------
3. FIRST-TIME SETUP
----------------------------------------------------------------
The first time you open the settings page you see "Initial
setup":

  - Folder to protect: pick a normal bookmark folder (a folder
    that lives inside "Bookmarks bar", "Other bookmarks", etc.)
  - Password: at least 12 characters
  - Confirm password
  - Backup storage: Google Drive (recommended) or Local storage

Then press "Configure Bookmark Vault".

If you choose Google Drive, Chrome asks you to authorize the
extension once. A folder named "Bookmark Vault" is created
automatically in your Drive.


----------------------------------------------------------------
4. LOCK & HIDE
----------------------------------------------------------------
1. Press "Lock & Hide"
2. Enter your password

The folder is backed up (encrypted) and then removed from the
bookmark tree. The status badge changes to "Locked" and the
Lock button becomes disabled.

Keep in mind: while the folder is locked you cannot change the
protected folder or its name.


----------------------------------------------------------------
5. UNLOCK & SHOW
----------------------------------------------------------------
1. Press "Unlock & Show"
2. Enter your password

The latest backup is downloaded from the storage, decrypted and
the folder is restored. If the parent folder no longer exists,
unlocking fails, so do not delete the parent folder while the
vault is locked.


----------------------------------------------------------------
6. CHANGE THE PROTECTED FOLDER
----------------------------------------------------------------
Available only while the vault is UNLOCKED.

1. Section "Change protected folder"
2. Choose the new folder
3. Enter your password
4. Press "Change protected folder"

The stored backups are kept: only the target folder changes.


----------------------------------------------------------------
7. CHANGE PASSWORD
----------------------------------------------------------------
Section "Change password":

  - Current password
  - New password (at least 12 characters)
  - Confirm new password

All stored backups are re-encrypted with the new password
before it is saved. If you forget the password, the backups
cannot be decrypted anymore - keep it safe.


----------------------------------------------------------------
8. BACKUP STORAGE
----------------------------------------------------------------
Section "Backup storage":

  - Current: Google Drive or Local storage
  - "Change storage location": migrates every backup to the
    other location (password required). Nothing is deleted
    before the copy succeeds.
  - "Connect Google Drive": forces the Google authorization
  - "Disconnect Google Drive": clears the cached authorization
    tokens only; your backups are not deleted.

Google Drive details:
  - The extension uses the drive.file scope, so it can only
    access files it created itself.
  - Backups are stored in a folder named "Bookmark Vault" as
    bookmark-vault-YYYY-MM-DD-HH-MM-SS.bmbkp files containing
    only ciphertext.
  - A config.json with non-sensitive metadata (folder path,
    timestamps, backup ids) is stored next to them.


----------------------------------------------------------------
9. BACKUPS: EXPORT AND IMPORT
----------------------------------------------------------------
The extension keeps the LATEST THREE backups. Older ones are
removed automatically.

Each backup row has an "Export" button: it downloads that
backup as a .bmbkp file (you choose where to save it).

To restore a file:
  1. Section "Backups" -> "Import backup"
  2. Select the .bmbkp file
  3. Enter the password used when the backup was created
  4. Press "Import backup"

This lets you move backups between computers or keep a copy
outside the browser.


----------------------------------------------------------------
10. "ASK FOR LOCKING ON BROWSER CLOSING"
----------------------------------------------------------------
Checkbox in the dashboard, ON by default.

Chrome does not allow an extension to show a dialog while the
browser is closing, so the option works in two ways:

  a) On browser startup: if the vault is still unlocked, the
     settings page opens automatically and asks
     "Lock it now?" - confirm, enter the password, done.
  b) While the settings page is open: if the vault is
     unlocked and you close that tab (or the window), the
     browser shows a warning before leaving the page.

Uncheck the box if you prefer to lock it manually.


----------------------------------------------------------------
11. SECURITY NOTES
----------------------------------------------------------------
  - KDF: PBKDF2-SHA256, 600,000 iterations
  - Cipher: AES-256-GCM, new random salt and IV for every
    backup
  - The password is never written to storage
  - The encrypted backup is written and verified BEFORE the
    bookmark folder is deleted
  - Old backups are never overwritten; only the three most
    recent are kept
  - Google Drive receives ciphertext only

WARNING: there is no password recovery. If you lose the
password, the locked data cannot be restored.


----------------------------------------------------------------
12. MESSAGES YOU MAY SEE
----------------------------------------------------------------
  "No backup is available."
      No encrypted backup exists yet in the storage.

  "The original parent folder could not be found."
      The parent folder of the protected folder was deleted
      while the vault was locked.

  "Incorrect password."
      Wrong password (also for import and password change).

  "The protected folder could not be found."
      The folder was renamed, moved or deleted while
      unlocked.

  "Google Drive error ..."
      Drive refused the request (authorization, quota, file
      not found). Press "Connect Google Drive" to renew the
      authorization.


----------------------------------------------------------------
13. FILES
----------------------------------------------------------------
bookmark-vault/
  manifest.json    extension manifest (permissions, icons)
  background.js    service worker: crypto, Drive, bookmarks
  options.html     settings page
  options.css      settings style
  options.js       settings logic
  icons/           icon16, icon32, icon48, icon128
  readme_*.txt     this guide in other languages
  tests/           maintenance tests (node --test tests)


----------------------------------------------------------------
14. LICENSE
----------------------------------------------------------------
Free to use, including for commercial purposes. You may copy
and modify it.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND. The author accepts no responsibility or liability for
any malfunction, data loss, damaged bookmarks or any other
problem arising from the use of this extension.

Use it at your own risk.
================================================================
