================================================================
BOOKMARK VAULT
Extension Chrome - Description et guide d'utilisation (FR)
================================================================

L'interface de l'extension est en anglais.


----------------------------------------------------------------
1. À QUOI ÇA SERT
----------------------------------------------------------------
Bookmark Vault protège UN dossier de marque-pages de Chrome avec
un mot de passe.

Le verrouillage ("Lock & Hide") effectue ces étapes, dans cet
ordre :
  1. sérialise l'arbre du dossier
  2. le chiffre avec votre mot de passe
  3. enregistre la sauvegarde chiffrée (stockage local ou
     Google Drive)
  4. vérifie que la sauvegarde a bien été écrite
  5. et seulement après, supprime le dossier des marque-pages

Le déverrouillage ("Unlock & Show") télécharge la dernière
sauvegarde, la déchiffre et recrée le dossier à sa position
d'origine. Si un dossier du même nom existe déjà à cet emplacement,
les marque-pages y sont fusionnés au lieu de le remplacer.

Votre mot de passe n'est jamais stocké. Seul un petit vérificateur
chiffré est conservé, et il ne permet pas de retrouver le mot de
passe.

Prérequis : Chrome 120 ou plus récent.


----------------------------------------------------------------
2. INSTALLATION
----------------------------------------------------------------
1. Ouvre chrome://extensions
2. Active le "Mode développeur" (coin supérieur droit)
3. Clique sur "Charger l'extension non empaquetée"
4. Sélectionne le dossier bookmark-vault

Cliquer sur l'icône de la barre d'outils ouvre la page de
configuration.

Chaque résultat (en cours, succès, erreur) apparaît dans une
fenêtre popup centrée avec un bouton OK.


----------------------------------------------------------------
3. CONFIGURATION INITIALE
----------------------------------------------------------------
À la première ouverture, la section "Initial setup" s'affiche :

  - Folder to protect : choisissez un dossier de marque-pages
    normal (un dossier dans "Barre de marque-pages", "Autres
    marque-pages", etc.)
  - Password : au moins 12 caractères
  - Confirm password
  - Backup storage : Google Drive (recommandé) ou Local storage

Puis cliquez sur "Configure Bookmark Vault".

Si vous choisissez Google Drive, Chrome demande une seule fois
l'autorisation de l'extension. Un dossier nommé "Bookmark Vault"
est créé automatiquement dans votre Drive.


----------------------------------------------------------------
4. LOCK & HIDE (VERROUILLER)
----------------------------------------------------------------
1. Cliquez sur "Lock & Hide"
2. Saisissez votre mot de passe

Le dossier est sauvegardé (chiffré) puis retiré des marque-pages
L'indicateur passe à "Locked" et le bouton Lock est désactivé.

À noter : tant que le dossier est verrouillé, vous ne pouvez pas
changer le dossier protégé.


----------------------------------------------------------------
5. UNLOCK & SHOW (DÉVERROUILLER)
----------------------------------------------------------------
1. Cliquez sur "Unlock & Show"
2. Saisissez votre mot de passe

La dernière sauvegarde est téléchargée depuis le stockage,
déchiffrée et le dossier est restauré. Si le dossier parent n'existe
plus, le déverrouillage échoue : ne supprimez pas le dossier parent
tant que le vault est verrouillé.


----------------------------------------------------------------
6. CHANGER LE DOSSIER PROTÉGÉ
----------------------------------------------------------------
Disponible uniquement quand le vault est DÉVERROUILLÉ.

1. Section "Change protected folder"
2. Choisissez le nouveau dossier
3. Saisissez votre mot de passe
4. Cliquez sur "Change protected folder"

Les sauvegardes existantes sont conservées : seul le dossier cible
change.


----------------------------------------------------------------
7. CHANGER LE MOT DE PASSE
----------------------------------------------------------------
Section "Change password" :

  - Current password
  - New password (au moins 12 caractères)
  - Confirm new password

Toutes les sauvegardes sont ré-chiffrées avec le nouveau mot de
passe avant l'enregistrement. Si vous perdez le mot de passe, les
sauvegardes ne pourront plus être déchiffrées - conservez-le
soigneusement.


----------------------------------------------------------------
8. STOCKAGE DES SAUVEGARDES
----------------------------------------------------------------
Section "Backup storage" :

  - Current : Google Drive ou Local storage
  - "Change storage location" : migre toutes les sauvegardes vers
    l'autre destination (mot de passe requis). Rien n'est supprimé
    avant que la copie n'ait réussi.
  - "Connect Google Drive" : force l'autorisation Google
  - "Disconnect Google Drive" : efface seulement les jetons
    d'autorisation en cache ; vos sauvegardes ne sont pas
    supprimées.

Détails Google Drive :
  - L'extension utilise la portée drive.file : elle ne peut
    accéder qu'aux fichiers qu'elle a créés.
  - Les sauvegardes sont dans le dossier "Bookmark Vault" sous la
    forme de fichiers bookmark-vault-AAAA-MM-JJ-HH-MM-SS.bmbkp ne
    contenant que du texte chiffré.
  - Un config.json avec des métadonnées non sensibles (chemin du
    dossier, dates, identifiants des sauvegardes) est enregistré
    à côté.


----------------------------------------------------------------
9. SAUVEGARDES : EXPORT ET IMPORT
----------------------------------------------------------------
L'extension conserve LES TROIS DERNIÈRES sauvegardes. Les plus
anciennes sont supprimées automatiquement.

Chaque ligne de sauvegarde possède un bouton "Export" : il
télécharge cette sauvegarde au format .bmbkp (vous choisissez où
l'enregistrer).

Pour restaurer un fichier :
  1. Section "Backups" -> "Import backup"
  2. Sélectionnez le fichier .bmbkp
  3. Saisissez le mot de passe utilisé à la création
  4. Cliquez sur "Import backup"

Cela vous permet de déplacer des sauvegardes entre ordinateurs ou
de conserver une copie hors du navigateur.


----------------------------------------------------------------
10. "ASK FOR LOCKING ON BROWSER CLOSING"
----------------------------------------------------------------
Case à cocher dans le tableau de bord, ACTIVE par défaut.

Chrome n'autorise pas une extension à afficher une boîte de
dialogue pendant la fermeture du navigateur ; l'option agit donc
de deux façons :

  a) Au démarrage du navigateur : si le vault est encore
     déverrouillé, la page de configuration s'ouvre
     automatiquement et demande "Lock it now ?" - confirmez,
     saisissez le mot de passe, terminé.
  b) Tant que la page de configuration est ouverte : si le vault
     est déverrouillé et que vous fermez cet onglet (ou la
     fenêtre), le navigateur affiche un avertissement avant de
     quitter la page.

Décochez la case si vous préférez verrouiller manuellement.


----------------------------------------------------------------
11. NOTES DE SÉCURITÉ
----------------------------------------------------------------
  - KDF : PBKDF2-SHA256, 600 000 itérations
  - Chiffrement : AES-256-GCM, sel et IV aléatoires nouveaux
    pour chaque sauvegarde
  - Le mot de passe n'est jamais écrit dans le stockage
  - La sauvegarde chiffrée est écrite et vérifiée AVANT la
    suppression du dossier de marque-pages
  - Les anciennes sauvegardes ne sont jamais écrasées ; seules
    les trois plus récentes sont conservées
  - Google Drive ne reçoit que du texte chiffré

ATTENTION : il n'y a aucune récupération de mot de passe. Si vous
le perdez, les données verrouillées sont définitivement
inaccessibles.


----------------------------------------------------------------
12. MESSAGES POSSIBLES
----------------------------------------------------------------
  "No backup is available."
      Aucune sauvegarde chiffrée n'existe encore.

  "The original parent folder could not be found."
      Le dossier parent du dossier protégé a été supprimé
      pendant que le vault était verrouillé.

  "Incorrect password."
      Mot de passe incorrect (aussi à l'import et au changement
      de mot de passe).

  "The protected folder could not be found."
      Le dossier a été renommé, déplacé ou supprimé pendant
      qu'il était déverrouillé.

  "Google Drive error ..."
      Drive a refusé la requête (autorisation, quota, fichier
      introuvable). Cliquez sur "Connect Google Drive" pour
      renouveler l'autorisation.


----------------------------------------------------------------
13. FICHIERS
----------------------------------------------------------------
bookmark-vault/
  manifest.json    manifeste (permissions, icônes)
  background.js    service worker : chiffrement, Drive, marque-pages
  options.html     page de configuration
  options.css      styles de la configuration
  options.js       logique de la configuration
  icons/           icon16, icon32, icon48, icon128
  readme_*.txt     ce guide dans d'autres langues
  tests/           tests de maintenance (node --test tests)


----------------------------------------------------------------
14. LICENCE
----------------------------------------------------------------
Utilisation libre, y compris à des fins commerciales. Vous
pouvez le copier et le modifier.

LE LOGICIEL EST FOURNI "EN L'ÉTAT", SANS AUCUNE GARANTIE.
L'auteur décline toute responsabilité en cas de
dysfonctionnement, de perte de données, de marque-pages
endommagés ou de tout autre problème découlant de
l'utilisation de cette extension.

À utiliser à vos propres risques.
================================================================
