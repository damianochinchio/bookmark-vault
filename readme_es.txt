================================================================
BOOKMARK VAULT
Extensión de Chrome - Descripción y guía de uso (ES)
================================================================

La interfaz de la extensión está en inglés.


----------------------------------------------------------------
1. QUÉ HACE
----------------------------------------------------------------
Bookmark Vault protege UNA carpeta de marcadores de Chrome con
una contraseña.

El bloqueo ("Lock & Hide") realiza estos pasos, en este orden:
  1. serializa el árbol de la carpeta
  2. lo cifra con tu contraseña
  3. guarda la copia de seguridad cifrada (almacenamiento local
     o Google Drive)
  4. comprueba que la copia se haya escrito realmente
  5. y solo entonces borra la carpeta de los marcadores

La desbloqueo ("Unlock & Show") descarga la última copia, la
descifra y recrea la carpeta en su posición original. Si allí
ya existe una carpeta con el mismo nombre, los marcadores se
fusionan con ella en lugar de sustituirla.

La contraseña nunca se guarda. Solo se almacena un pequeño
verificador cifrado, que no permite recuperar la contraseña.

Requisito mínimo: Chrome 120 o superior.


----------------------------------------------------------------
2. INSTALACIÓN
----------------------------------------------------------------
1. Abre chrome://extensions
2. Activa "Modo de desarrollador" (esquina superior derecha)
3. Pulsa "Cargar descomprimida"
4. Selecciona la carpeta bookmark-vault

Al pulsar el icono de la barra de herramientas se abre la
página de configuración.

Cada resultado (en curso, éxito, error) se muestra en una
ventana emergente centrada con un botón OK.


----------------------------------------------------------------
3. CONFIGURACIÓN INICIAL
----------------------------------------------------------------
La primera vez que abres la configuración aparece "Initial
setup":

  - Folder to protect: elige una carpeta de marcadores normal
    (una carpeta dentro de "Barra de marcadores", "Otros
    marcadores", etc.)
  - Password: al menos 12 caracteres
  - Confirm password
  - Backup storage: Google Drive (recomendado) o Local storage

Después pulsa "Configure Bookmark Vault".

Si eliges Google Drive, Chrome te pedirá autorizar la extensión
una sola vez. En tu Drive se creará automáticamente una carpeta
llamada "Bookmark Vault".


----------------------------------------------------------------
4. LOCK & HIDE (BLOQUEAR)
----------------------------------------------------------------
1. Pulsa "Lock & Hide"
2. Introduce tu contraseña

La carpeta se guarda en copia de seguridad (cifrada) y después
se elimina de los marcadores. El indicador pasa a "Locked" y el
botón Lock se desactiva.

Ten en cuenta: mientras la carpeta esté bloqueada no puedes
cambiar la carpeta protegida.


----------------------------------------------------------------
5. UNLOCK & SHOW (DESBLOQUEAR)
----------------------------------------------------------------
1. Pulsa "Unlock & Show"
2. Introduce tu contraseña

Se descarga la última copia del almacenamiento, se descifra y
se restaura la carpeta. Si la carpeta padre ya no existe, el
desbloqueo falla: no borres la carpeta padre mientras el vault
esté bloqueado.


----------------------------------------------------------------
6. CAMBIAR LA CARPETA PROTEGIDA
----------------------------------------------------------------
Solo disponible mientras el vault está DESBLOQUEADO.

1. Sección "Change protected folder"
2. Elige la nueva carpeta
3. Introduce tu contraseña
4. Pulsa "Change protected folder"

Las copias guardadas se conservan: solo cambia la carpeta
seleccionada.


----------------------------------------------------------------
7. CAMBIAR LA CONTRASEÑA
----------------------------------------------------------------
Sección "Change password":

  - Current password
  - New password (al menos 12 caracteres)
  - Confirm new password

Todas las copias se vuelven a cifrar con la contraseña nueva
antes de guardar. Si pierdes la contraseña, las copias ya no
podrán descifrarse: guárdala en un lugar seguro.


----------------------------------------------------------------
8. ALMACENAMIENTO DE LAS COPIAS
----------------------------------------------------------------
Sección "Backup storage":

  - Current: Google Drive o Local storage
  - "Change storage location": migra todas las copias al otro
    destino (requiere contraseña). No se borra nada antes de
    que la copia tenga éxito.
  - "Connect Google Drive": fuerza la autorización de Google
  - "Disconnect Google Drive": solo borra los tokens de
    autorización en caché; tus copias no se eliminan.

Detalles de Google Drive:
  - La extensión usa el ámbito drive.file, por lo que solo
    puede acceder a archivos creados por ella misma.
  - Las copias están en la carpeta "Bookmark Vault" como
    archivos bookmark-vault-AAAA-MM-DD-HH-MM-SS.bmbkp que
    contienen solo texto cifrado.
  - Junto a ellas se guarda un config.json con metadatos no
    sensibles (ruta de la carpeta, fechas, id de las copias).


----------------------------------------------------------------
9. COPIAS: EXPORTAR E IMPORTAR
----------------------------------------------------------------
La extensión conserva LAS TRES ÚLTIMAS copias. Las antiguas se
eliminan automáticamente.

Cada fila de copia tiene un botón "Export": descarga esa copia
como archivo .bmbkp (tú eliges dónde guardarla).

Para restaurar un archivo:
  1. Sección "Backups" -> "Import backup"
  2. Selecciona el archivo .bmbkp
  3. Introduce la contraseña usada al crear la copia
  4. Pulsa "Import backup"

Así puedes mover copias entre ordenadores o guardar una copia
fuera del navegador.


----------------------------------------------------------------
10. "ASK FOR LOCKING ON BROWSER CLOSING"
----------------------------------------------------------------
Casilla en el panel, ACTIVADA por defecto.

Chrome no permite que una extensión muestre un diálogo mientras
el navegador se cierra, así que la opción funciona de dos formas:

  a) Al iniciar el navegador: si el vault sigue desbloqueado,
     la página de configuración se abre sola y pregunta
     "¿Bloquear ahora?" - confirma, introduce la contraseña y
     listo.
  b) Mientras la página de configuración está abierta: si el
     vault está desbloqueado y cierras esa pestaña (o la
     ventana), el navegador muestra un aviso antes de salir.

Desactiva la casilla si prefieres bloquear manualmente.


----------------------------------------------------------------
11. NOTAS DE SEGURIDAD
----------------------------------------------------------------
  - KDF: PBKDF2-SHA256, 600.000 iteraciones
  - Cifrado: AES-256-GCM, salt e IV aleatorios nuevos en cada
    copia
  - La contraseña nunca se escribe en el almacenamiento
  - La copia cifrada se escribe y se comprueba ANTES de borrar
    la carpeta de marcadores
  - Las copias antiguas nunca se sobrescriben; solo se
    conservan las tres más recientes
  - Google Drive solo recibe texto cifrado

ADVERTENCIA: no hay recuperación de contraseña. Si la pierdes,
los datos bloqueados no se podrán restaurar.


----------------------------------------------------------------
12. MENSAJES QUE PUEDES VER
----------------------------------------------------------------
  "No backup is available."
      Todavía no existe ninguna copia cifrada.

  "The original parent folder could not be found."
      La carpeta padre de la carpeta protegida se borró
      mientras el vault estaba bloqueado.

  "Incorrect password."
      Contraseña incorrecta (también en importación y cambio
      de contraseña).

  "The protected folder could not be found."
      La carpeta se renombró, se movió o se borró mientras
      estaba desbloqueada.

  "Google Drive error ..."
      Drive rechazó la solicitud (autorización, cuota, archivo
      no encontrado). Pulsa "Connect Google Drive" para
      renovar la autorización.


----------------------------------------------------------------
13. ARCHIVOS
----------------------------------------------------------------
bookmark-vault/
  manifest.json    manifiesto (permisos, iconos)
  background.js    service worker: cifrado, Drive, marcadores
  options.html     página de configuración
  options.css      estilos de la configuración
  options.js       lógica de la configuración
  icons/           icon16, icon32, icon48, icon128
  readme_*.txt     esta guía en otros idiomas
  tests/           pruebas de mantenimiento (node --test tests)


----------------------------------------------------------------
14. LICENCIA
----------------------------------------------------------------
Uso libre, también con fines comerciales. Puedes copiarlo y
modificarlo.

EL SOFTWARE SE PROPORCIONA "TAL CUAL", SIN GARANTÍA DE NINGÚN
TIPO. El autor no asume ninguna responsabilidad por
malfuncionamientos, pérdida de datos, marcadores dañados ni
ningún otro problema derivado del uso de esta extensión.

Úsalo bajo tu propia responsabilidad.
================================================================
