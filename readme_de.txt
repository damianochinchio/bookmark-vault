================================================================
BOOKMARK VAULT
Chrome-Erweiterung - Beschreibung und Benutzeranleitung (DE)
================================================================

Die Benutzeroberfläche der Erweiterung ist englisch.


----------------------------------------------------------------
1. WAS ES MACHT
----------------------------------------------------------------
Bookmark Vault schützt EINEN Chrome-Lesezeichenordner mit einem
Passwort.

Das Sperren ("Lock & Hide") führt diese Schritte in dieser
Reihenfolge aus:
  1. den Ordnerbaum serialisieren
  2. mit deinem Passwort verschlüsseln
  3. die verschlüsselte Sicherung speichern (lokaler Speicher
     oder Google Drive)
  4. prüfen, dass die Sicherung wirklich geschrieben wurde
  5. erst DANACH den Ordner aus den Lesezeichen löschen

Das Entsperren ("Unlock & Show") lädt die letzte Sicherung herunter,
entschlüsselt sie und stellt den Ordner an seiner ursprünglichen
Position wieder her. Existiert dort bereits ein Ordner mit demselben
Namen, werden die Lesezeichen eingefügt statt ihn zu ersetzen.

Dein Passwort wird nie gespeichert. Nur ein kleiner verschlüsselter
Prüfwert bleibt erhalten, mit dem sich das Passwort nicht
zurückgewinnen lässt.

Voraussetzung: Chrome 120 oder neuer.


----------------------------------------------------------------
2. INSTALLATION
----------------------------------------------------------------
1. chrome://extensions öffnen
2. "Entwicklermodus" aktivieren (oben rechts)
3. "Entpackte Erweiterung laden" klicken
4. den Ordner bookmark-vault auswählen

Ein Klick auf das Symbol in der Symbolleiste öffnet die
Einstellungsseite.

Jedes Ergebnis (läuft, Erfolg, Fehler) erscheint in einem
zentrierten Popup-Fenster mit einer OK-Schaltfläche.


----------------------------------------------------------------
3. ERSTEINRICHTUNG
----------------------------------------------------------------
Beim ersten Öffnen erscheint "Initial setup":

  - Folder to protect: einen normalen Lesezeichenordner wählen
    (ein Ordner in "Lesezeichenleiste", "Andere Lesezeichen" usw.)
  - Password: mindestens 12 Zeichen
  - Confirm password
  - Backup storage: Google Drive (empfohlen) oder Local storage

Dann "Configure Bookmark Vault" klicken.

Bei Google Drive fragt Chrome die Berechtigung einmal ab. In
deinem Drive wird automatisch ein Ordner namens "Bookmark Vault"
angelegt.


----------------------------------------------------------------
4. LOCK & HIDE (SPERREN)
----------------------------------------------------------------
1. "Lock & Hide" klicken
2. dein Passwort eingeben

Der Ordner wird gesichert (verschlüsselt) und danach aus den
Lesezeichen entfernt. Die Anzeige wechselt zu "Locked", die
Lock-Schaltfläche wird deaktiviert.

Beachte: Solange der Ordner gesperrt ist, lässt sich der
geschützte Ordner nicht ändern.


----------------------------------------------------------------
5. UNLOCK & SHOW (ENTSPERREN)
----------------------------------------------------------------
1. "Unlock & Show" klicken
2. dein Passwort eingeben

Die letzte Sicherung wird vom Speicher geladen, entschlüsselt
und der Ordner wiederhergestellt. Ist der übergeordnete Ordner
nicht mehr vorhanden, schlägt das Entsperren fehl - lösche den
übergeordneten Ordner nicht, solange das Vault gesperrt ist.


----------------------------------------------------------------
6. GESCHÜTZTEN ORDNER ÄNDERN
----------------------------------------------------------------
Nur verfügbar, wenn das Vault ENTSPERRT ist.

1. Abschnitt "Change protected folder"
2. den neuen Ordner wählen
3. dein Passwort eingeben
4. "Change protected folder" klicken

Die gespeicherten Sicherungen bleiben erhalten: nur das
Zielobjekt ändert sich.


----------------------------------------------------------------
7. PASSWORT ÄNDERN
----------------------------------------------------------------
Abschnitt "Change password":

  - Current password
  - New password (mindestens 12 Zeichen)
  - Confirm new password

Alle Sicherungen werden vor dem Speichern mit dem neuen
Passwort neu verschlüsselt. Ohne Passwort lassen sich die
Sicherungen nicht mehr entschlüsseln - bewahre es sorgfältig auf.


----------------------------------------------------------------
8. SPEICHERORT DER SICHERUNGEN
----------------------------------------------------------------
Abschnitt "Backup storage":

  - Current: Google Drive oder Local storage
  - "Change storage location": verschiebt alle Sicherungen an
    den anderen Speicherort (Passwort erforderlich). Vor
    erfolgreichem Kopieren wird nichts gelöscht.
  - "Connect Google Drive": Google-Berechtigung erzwingen
  - "Disconnect Google Drive": löscht nur die zwischengespeicherten
    Berechtigungstoken; deine Sicherungen bleiben erhalten.

Details zu Google Drive:
  - Die Erweiterung nutzt den Umfang drive.file und kann daher
    nur auf selbst erstellte Dateien zugreifen.
  - Sicherungen liegen im Ordner "Bookmark Vault" als Dateien
    bookmark-vault-JJJJ-MM-TT-HH-MM-SS.bmbkp mit reinem
    Chiffrat.
  - Daneben wird ein config.json mit nicht sensiblen Metadaten
    (Ordnerpfad, Zeitstempel, Sicherungs-IDs) abgelegt.


----------------------------------------------------------------
9. SICHERUNGEN: EXPORT UND IMPORT
----------------------------------------------------------------
Die Erweiterung behält DIE LETZTEN DREI Sicherungen. Ältere
werden automatisch entfernt.

Jede Sicherungszeile hat eine "Export"-Schaltfläche: Sie lädt
diese Sicherung als .bmbkp-Datei herunter (den Speicherort
wählst du selbst).

So stellst du eine Datei wieder her:
  1. Abschnitt "Backups" -> "Import backup"
  2. die .bmbkp-Datei auswählen
  3. das Passwort eingeben, das beim Erstellen galt
  4. "Import backup" klicken

So kannst du Sicherungen zwischen Rechnern verschieben oder eine
Kopie außerhalb des Browsers aufbewahren.


----------------------------------------------------------------
10. "ASK FOR LOCKING ON BROWSER CLOSING"
----------------------------------------------------------------
Checkbox im Dashboard, standardmäßig AKTIV.

Chrome erlaubt einer Erweiterung kein Dialogfenster beim
Schließen des Browsers. Die Option greift daher auf zwei Wegen:

  a) Beim Browserstart: Ist das Vault noch entsperrt, öffnet
     sich die Einstellungsseite automatisch und fragt
     "Lock it now?" - bestätigen, Passwort eingeben, fertig.
  b) Solange die Einstellungsseite offen ist: Ist das Vault
     entsperrt und du schließt diesen Tab (oder das Fenster),
     zeigt der Browser vor dem Verlassen eine Warnung an.

Deaktiviere das Häkchen, wenn du lieber manuell sperrst.


----------------------------------------------------------------
11. SICHERHEITSHINWEISE
----------------------------------------------------------------
  - KDF: PBKDF2-SHA256, 600.000 Iterationen
  - Chiffre: AES-256-GCM, jedes Mal neuer zufälliger Salt und IV
  - Das Passwort wird nie in den Speicher geschrieben
  - Die verschlüsselte Sicherung wird geschrieben und geprüft,
    BEVOR der Lesezeichenordner gelöscht wird
  - Alte Sicherungen werden nie überschrieben; nur die drei
    neuesten bleiben erhalten
  - Google Drive erhält ausschließlich Chiffrat

ACHTUNG: Es gibt keine Passwort-Wiederherstellung. Ohne Passwort
sind die gesperrten Daten endgültig unzugänglich.


----------------------------------------------------------------
12. MÖGLICHE MELDUNGEN
----------------------------------------------------------------
  "No backup is available."
      Es existiert noch keine verschlüsselte Sicherung.

  "The original parent folder could not be found."
      Der übergeordnete Ordner des geschützten Ordners wurde
      gelöscht, während das Vault gesperrt war.

  "Incorrect password."
      Falsches Passwort (auch bei Import und Passwortänderung).

  "The protected folder could not be found."
      Der Ordner wurde umbenannt, verschoben oder gelöscht,
      während er entsperrt war.

  "Google Drive error ..."
      Drive hat die Anfrage abgelehnt (Berechtigung, Kontingent,
      Datei nicht gefunden). "Connect Google Drive" klicken, um
      die Berechtigung zu erneuern.


----------------------------------------------------------------
13. DATEIEN
----------------------------------------------------------------
bookmark-vault/
  manifest.json    Manifest (Berechtigungen, Symbole)
  background.js    Service Worker: Krypto, Drive, Lesezeichen
  options.html     Einstellungsseite
  options.css      Stil der Einstellungen
  options.js       Logik der Einstellungen
  icons/           icon16, icon32, icon48, icon128
  readme_*.txt     diese Anleitung in anderen Sprachen
  tests/           Wartungstests (node --test tests)


----------------------------------------------------------------
14. LIZENZ
----------------------------------------------------------------
Frei zur Nutzung, auch kommerziell. Du darfst den Code kopieren
und verändern.

DIE SOFTWARE WIRD "WIE SIE IST" BEREITGESTELLT, OHNE
JEGLICHE GARANTIE. Der Autor übernimmt keine Haftung für
Fehlfunktionen, Datenverlust, beschädigte Lesezeichen oder
andere Probleme, die aus der Verwendung dieser Erweiterung
entstehen.

Verwendung auf eigenes Risiko.
================================================================
