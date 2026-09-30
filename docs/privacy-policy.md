# Privacy Policy — Bookmark Vault

_Last updated: 30 September 2026_

Bookmark Vault (hereinafter "the extension") protects a single
Google Chrome bookmark folder with a password and stores an
encrypted backup of it.

## Data the extension accesses

- **Bookmark data** (folder names, bookmark titles, URLs and the
  folder structure). Read from Chrome's local bookmark storage
  when you lock or unlock the protected folder.
- **Files created by the extension in your Google Drive.** Only if
  you choose Google Drive as the backup location, the extension
  creates a folder named `Bookmark Vault` and stores encrypted
  `.bmbkp` files inside it. The extension uses the
  `https://www.googleapis.com/auth/drive.file` scope, which means
  it can only see and modify files it created itself; it cannot
  read any other file in your Drive.
- **Local extension storage** (chrome.storage.local): your
  settings, the list of backups, and a password verifier.

## How the data is used

- The bookmark tree is encrypted **on your device** with your
  password, using AES-256-GCM with a key derived through
  PBKDF2-SHA256 (600,000 iterations).
- The encrypted backup is written to your device and/or to your
  own Google Drive. The extension reads the backup back after
  writing it to confirm it was saved correctly, and only then may
  the original folder be removed from your bookmarks.
- Your password is **never stored** and never transmitted
  anywhere. Only a password verifier (an encrypted fixed value,
  useless for recovering the password) is kept in local extension
  storage so the password can be checked when unlocking.
- The most recent 3 backups are kept. Older backups are deleted
  automatically, both from local storage and from your Google
  Drive.

## What is not collected

- No analytics, no tracking, no advertising, no profiling.
- The developer has no backend or server: bookmark data, backup
  files and your password never reach the developer.
- The extension does not collect personal data, device
  identifiers, or usage statistics.

## Third parties

Only the Google services you explicitly use:

- the Chrome bookmarks API (local storage of your bookmarks);
- Google Drive (storage of your encrypted backups, only if you
  enable it);
- Google Sign-In, used solely to authorize access to your Drive.

No other third party receives data from the extension.

## Retention and deletion

- Backups stored on your device are limited to the last 3 and are
  deleted from the settings page or when replaced by newer ones.
- Backups stored in Google Drive remain until you delete them.
  Uninstalling the extension does **not** delete the `Bookmark
  Vault` folder from your Drive: remove it manually from Drive if
  you want to erase everything.
- Deleting the configuration from the extension removes the local
  settings, the password verifier and the local backups.

## Security

Backups are encrypted before they leave the device; the files in
your Google Drive are unreadable without your password. No method
of transmission or storage is 100% secure, so keep your password
safe: without it the backups cannot be opened.

## Children

The extension is not directed to children under 13 and does not
knowingly collect data from them.

## Changes

This policy may be updated; the current version is always
published at this address. Material changes will be announced in
the extension's store listing.

## Contact

Questions about this policy: **damiano.chinchio@gmail.com**
