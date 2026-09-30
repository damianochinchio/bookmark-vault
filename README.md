# Bookmark Vault

Protect a **Chrome bookmark folder with a password**.

"Lock & Hide" encrypts the folder with your password, writes an
encrypted backup (your device or your own Google Drive), verifies
that the backup was really saved — and only then removes the
folder from your bookmarks. "Unlock & Show" downloads the backup,
decrypts it and recreates the folder in its original position.

Your password is never stored.

## Features

- AES-256-GCM, key derived with PBKDF2-SHA256 (600,000 iterations)
- backup written **and read back** before anything is deleted
- last 3 backups kept, older ones removed automatically
- storage on your device or in your own Google Drive folder
  (the extension only ever sees the files it created, scope `drive.file`)
- merge instead of overwrite if a folder with the same name exists
- export / import an encrypted backup file
- change the protected folder at any time
- ask to lock the vault when the browser starts
- warning before closing the tab while the vault is unlocked
- free to use, including commercially — no account, no tracking, no ads

Requires Chrome 120 or newer (Manifest V3).

## Install (from source)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right corner)
3. Click **Load unpacked**
4. Select this folder

## Documentation

- [readme_en.txt](readme_en.txt) — full user guide (EN)
- [readme_it.txt](readme_it.txt) — guida utente (IT)
- [readme_es.txt](readme_es.txt) · [readme_fr.txt](readme_fr.txt) ·
  [readme_de.txt](readme_de.txt) — otras guías
- [docs/privacy-policy.md](docs/privacy-policy.md) — privacy policy

## Development

```
node --check background.js
node --check options.js
node --test tests
```

`tests/` contains the maintenance checks (no dependencies, plain
Node). The store package is built without `tests/`, `docs/` and
`store-listing/`.

## Privacy

No account, no analytics, no developer server. Bookmark data is
encrypted on your device and stored only in your own Google Drive
if you enable that option. See the
[privacy policy](docs/privacy-policy.md)
([published version](https://damianochinchio.github.io/bookmark-vault/privacy-policy.html)).

## License

Free to use, including for commercial purposes. You may copy and
modify it.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
The author accepts no responsibility or liability for any
malfunction, data loss, damaged bookmarks or any other problem
arising from the use of this extension.

Use it at your own risk.
