const $ = id =>
  document.getElementById(id);

function send(action, data = {}, workingText = null) {
  if (workingText) {
    showWorking(workingText);
  }

  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      {
        action,
        ...data
      },
      response => {
        const lastError =
          chrome.runtime.lastError;

        if (workingText) {
          hideMessage();
        }

        if (!response) {
          resolve({
            success: false,
            error:
              lastError?.message ||
              "The extension could not be reached. Reload it from chrome://extensions."
          });
          return;
        }

        resolve(response);
      }
    );
  });
}

function renderOverlay(text, kind) {
  $("message").textContent = text;

  $("overlayCard")
    .dataset
    .kind = kind;

  $("overlaySpinner")
    .classList
    .toggle("hidden", kind !== "working");

  $("overlayOk")
    .classList
    .toggle("hidden", kind === "working");

  $("overlay")
    .classList
    .remove("hidden");
}

function showMessage(text, error = false) {
  renderOverlay(
    text,
    error ? "error" : "success"
  );
}

function showWorking(text) {
  renderOverlay(text, "working");
}

function hideMessage() {
  $("overlay")
    .classList
    .add("hidden");
}

$("overlayOk")
  .addEventListener("click", hideMessage);

document.addEventListener(
  "keydown",
  event => {
    if (event.key !== "Escape") {
      return;
    }

    if (
      !$("overlay")
        .classList
        .contains("hidden") &&
      $("overlayCard").dataset.kind !==
        "working"
    ) {
      hideMessage();
    }
  }
);

function beforeUnloadWarning(event) {
  event.preventDefault();
  event.returnValue = "";
  return "";
}

function setUnloadWarning(enabled) {
  if (enabled) {
    window.addEventListener(
      "beforeunload",
      beforeUnloadWarning
    );
  } else {
    window.removeEventListener(
      "beforeunload",
      beforeUnloadWarning
    );
  }
}

function selectedStorageMode() {
  return document.querySelector(
    'input[name="storage"]:checked'
  ).value;
}

async function loadFolders(selectId = "folder") {
  const response =
    await send("getFolders");

  if (!response.success) {
    throw new Error(
      response.error
    );
  }

  const select =
    $(selectId);

  select.innerHTML = "";

  for (const folder of response.result) {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      folder.id;

    option.textContent =
      folder.displayPath;

    select.appendChild(
      option
    );

    console.log(
        "Bookmark Vault folder option:",
        folder.id,
        option.value,
        option.textContent
    );
  }
}

function formatDate(value) {
  return new Date(
    value
  ).toLocaleString();
}

// async function render() {
//   hideMessage();

//   const response =
//     await send("getConfig");

//   if (!response.success) {
//     showMessage(
//       response.error,
//       true
//     );
//     return;
//   }

//   const config =
//     response.result;

//   if (!config.configured) {
//     $("setup")
//       .classList
//       .remove("hidden");

//     $("dashboard")
//       .classList
//       .add("hidden");

//     $("storageSection")
//       .classList
//       .add("hidden");

//     $("passwordSection")
//       .classList
//       .add("hidden");

//     $("backupSection")
//       .classList
//       .add("hidden");

//     await loadFolders();

//     return;
//   }

//   $("setup")
//     .classList
//     .add("hidden");

//   $("dashboard")
//     .classList
//     .remove("hidden");

//   $("storageSection")
//     .classList
//     .remove("hidden");

//   $("passwordSection")
//     .classList
//     .remove("hidden");

//   $("backupSection")
//     .classList
//     .remove("hidden");

//   $("folderName")
//     .textContent =
//       config.folderPath.join(
//         " / "
//       );

// //   if (config.hidden) {
// //     $("statusBadge")
// //       .textContent =
// //       "🔒 Hidden";

// //     $("hide").disabled =
// //       true;

// //     $("show").disabled =
// //       false;
// //   } else {
// //     $("statusBadge")
// //       .textContent =
// //       "🔓 Visible";

// //     $("hide").disabled =
// //       false;

// //     $("show").disabled =
// //       true;
// //   }

// if (config.hidden) {
//   $("statusBadge").textContent =
//     "🔒 Locked";

//   $("hide").disabled = true;
//   $("show").disabled = false;
// } else {
//   $("statusBadge").textContent =
//     "🔓 Unlocked";

//   $("hide").disabled = false;
//   $("show").disabled = true;
// }


//   $("storageMode")
//     .textContent =
//       config.storageMode ===
//       "drive"
//         ? "Google Drive"
//         : "Local";

//   renderBackups(
//     config.backups || []
//   );
// }

async function render() {
  const response =
    await send("getConfig");

  if (!response.success) {
    showMessage(
      response.error,
      true
    );

    setUnloadWarning(false);

    return;
  }

  const config =
    response.result;

  /*
   * ============================================================
   * SETUP
   * ============================================================
   */

  if (!config.configured) {
    $("setup")
      .classList
      .remove("hidden");

    $("dashboard")
      .classList
      .add("hidden");

    $("storageSection")
      .classList
      .add("hidden");

    $("passwordSection")
      .classList
      .add("hidden");

    $("backupSection")
      .classList
      .add("hidden");

    $("folderSection")
      .classList
      .add("hidden");

    setUnloadWarning(false);

    await loadFolders();

    return;
  }

  /*
   * ============================================================
   * CONFIGURED
   * ============================================================
   */

  $("setup")
    .classList
    .add("hidden");

  $("dashboard")
    .classList
    .remove("hidden");

  $("storageSection")
    .classList
    .remove("hidden");

  $("passwordSection")
    .classList
    .remove("hidden");

  $("backupSection")
    .classList
    .remove("hidden");

  $("folderSection")
    .classList
    .remove("hidden");

  $("folderName")
    .textContent =
      config.folderPath.join(" / ");

  $("folderChangeCurrent")
    .textContent =
      config.folderPath.join(" / ");

  await loadFolders("folderChange");

  const currentPath =
    config.folderPath.join(" / ");

  const folderSelect =
    $("folderChange");

  for (const option of folderSelect.options) {
    if (option.textContent === currentPath) {
      folderSelect.value = option.value;
      break;
    }
  }

  $("askLockOnClose")
    .checked =
      config.askLockOnClose !== false;

  setUnloadWarning(
    config.askLockOnClose !== false &&
    config.hidden === false
  );

  /*
   * ============================================================
   * VAULT STATUS
   * ============================================================
   */

  if (config.hidden === true) {
    $("statusBadge")
      .textContent =
      "🔒 Locked";

    $("hide").disabled = true;
    $("show").disabled = false;

    $("hide").title =
      "The protected bookmark folder is already locked.";

    $("show").title =
      "Enter your password to restore the protected bookmarks.";
  } else {
    $("statusBadge")
      .textContent =
      "🔓 Unlocked";

    $("hide").disabled = false;
    $("show").disabled = true;

    $("hide").title =
      "Create an encrypted backup and hide the protected bookmark folder.";

    $("show").title =
      "The protected bookmark folder is already visible.";
  }

  /*
   * The folder can only be changed while the vault
   * is unlocked (the folder exists).
   */

  $("folderSection")
    .classList
    .toggle(
      "hidden",
      config.hidden === true
    );

  /*
   * ============================================================
   * STORAGE
   * ============================================================
   */

  $("storageMode")
    .textContent =
      config.storageMode === "drive"
        ? "Google Drive"
        : "Local storage";

  /*
   * ============================================================
   * BACKUPS
   * ============================================================
   */

  renderBackups(
    config.backups || []
  );
}


async function downloadBackup({
  encrypted,
  filename
}) {
  const blob = new Blob(
    [
      JSON.stringify(
        encrypted,
        null,
        2
      )
    ],
    {
      type:
        "application/octet-stream"
    }
  );

  const url =
    URL.createObjectURL(blob);

  try {
    await chrome.downloads.download({
      url,
      filename,
      saveAs: true
    });
  } catch {
    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  setTimeout(
    () => URL.revokeObjectURL(url),
    30000
  );
}


function renderBackups(backups) {
  const container =
    $("backups");

  container.innerHTML = "";

  if (!backups.length) {
    container.textContent =
      "No backups yet.";
    return;
  }

  for (const backup of backups) {
    const element =
      document.createElement(
        "div"
      );

    element.className =
      "backup";

    const date =
      formatDate(
        backup.createdAt
      );

    element.innerHTML = `
      <strong>${date}</strong>
      <br>
      <button data-id="${backup.id}">
        Export
      </button>
    `;

    element
      .querySelector("button")
      .addEventListener(
        "click",
        async () => {

          const response =
            await send(
              "exportBackup",
              {
                backupId:
                  backup.id
              },
              "Preparing the backup file…"
            );

          if (!response.success) {
            showMessage(
              response.error,
              true
            );
            return;
          }

          showWorking(
            "Saving the backup file…"
          );

          let saved = true;

          try {
            await downloadBackup(
              response.result
            );
          } catch {
            saved = false;
          }

          hideMessage();

          if (!saved) {
            showMessage(
              "The backup file could not be saved.",
              true
            );
            return;
          }

          showMessage(
            "Backup exported."
          );
        }
      );

    container.appendChild(
      element
    );
  }
}


/* ============================================================
   INITIAL CONFIGURATION
   ============================================================ */

$("configure")
  .addEventListener(
    "click",
    async () => {

      const password =
        $("setupPassword")
          .value;

      const confirmation =
        $("setupPasswordConfirm")
          .value;

      if (password.length < 12) {
        showMessage(
          "Use a password with at least 12 characters.",
          true
        );
        return;
      }

      if (
        password !==
        confirmation
      ) {
        showMessage(
          "Passwords do not match.",
          true
        );
        return;
      }

    console.log(
        "Bookmark Vault selected folder:",
        $("folder").value,
        $("folder").selectedIndex,
        $("folder").options[
            $("folder").selectedIndex
        ]
    );      
      const response =
        await send(
          "configure",
          {
            folderId:
              $("folder").value,

            password,

            storageMode:
              selectedStorageMode()
          },
          "Configuring Bookmark Vault…"
        );

      if (!response.success) {
        showMessage(
          response.error,
          true
        );
        return;
      }

      $("setupPassword")
        .value = "";

      $("setupPasswordConfirm")
        .value = "";

      showMessage(
        "Bookmark Vault configured."
      );

      const verify =
  await send("getConfig");

console.log(
  "CONFIG AFTER SETUP:",
  JSON.stringify(
    verify.result,
    null,
    2
  )
);

      await render();
    }
  );


/* ============================================================
   HIDE
   ============================================================ */

$("hide")
  .addEventListener(
    "click",
    async () => {

      const password =
        prompt(
          "Enter your Bookmark Vault password:"
        );

      if (password === null) {
        return;
      }

      const response =
        await send(
          "hide",
          { password },
          "Locking the vault and creating the encrypted backup…"
        );

      if (!response.success) {
        showMessage(
          response.error,
          true
        );
        return;
      }

      showMessage(
        "The protected folder has been hidden and backed up."
      );

      await render();
    }
  );


/* ============================================================
   SHOW
   ============================================================ */

$("show")
  .addEventListener(
    "click",
    async () => {

      const password =
        prompt(
          "Enter your Bookmark Vault password:"
        );

      if (password === null) {
        return;
      }

      const response =
        await send(
          "show",
          { password },
          "Unlocking and restoring the bookmarks…"
        );

      if (!response.success) {
        showMessage(
          response.error,
          true
        );
        return;
      }

      showMessage(
        "The protected bookmarks have been restored."
      );

      await render();
    }
  );


/* ============================================================
   CHANGE PROTECTED FOLDER
   ============================================================ */

$("changeFolderBtn")
  .addEventListener(
    "click",
    async () => {

      const folderId =
        $("folderChange").value;

      const password =
        $("folderChangePassword")
          .value;

      if (!folderId) {
        showMessage(
          "Select a bookmark folder.",
          true
        );
        return;
      }

      if (!password) {
        showMessage(
          "Enter your password.",
          true
        );
        return;
      }

      const response =
        await send(
          "changeFolder",
          { folderId, password },
          "Changing the protected folder…"
        );

      if (!response.success) {
        showMessage(
          response.error,
          true
        );
        return;
      }

      $("folderChangePassword")
        .value = "";

      showMessage(
        response.result.changed
          ? "The protected folder has been changed."
          : "That is already the protected folder."
      );

      await render();
    }
  );


/* ============================================================
   ASK FOR LOCKING ON BROWSER CLOSING
   ============================================================ */

$("askLockOnClose")
  .addEventListener(
    "change",
    async event => {

      const previous =
        !event.target.checked;

      const response =
        await send(
          "setAskLockOnClose",
          {
            enabled:
              event.target.checked
          },
          "Saving…"
        );

      if (!response.success) {
        event.target.checked =
          previous;

        showMessage(
          response.error,
          true
        );

        return;
      }

      showMessage(
        response.result.askLockOnClose
          ? "You will be asked to lock the vault when the browser starts."
          : "Locking will not be requested on browser closing."
      );

      setUnloadWarning(
        response.result.askLockOnClose &&
        $("hide").disabled === false
      );
    }
  );


/* ============================================================
   CHANGE PASSWORD
   ============================================================ */

$("changePassword")
  .addEventListener(
    "click",
    async () => {

      const oldPassword =
        $("oldPassword").value;

      const newPassword =
        $("newPassword").value;

      const confirmation =
        $("newPasswordConfirm")
          .value;

      if (
        newPassword.length < 12
      ) {
        showMessage(
          "Use at least 12 characters for the new password.",
          true
        );
        return;
      }

      if (
        newPassword !==
        confirmation
      ) {
        showMessage(
          "New passwords do not match.",
          true
        );
        return;
      }

      const response =
        await send(
          "changePassword",
          {
            oldPassword,
            newPassword
          },
          "Changing the password and re-encrypting the backups…"
        );

      if (!response.success) {
        showMessage(
          response.error,
          true
        );
        return;
      }

      $("oldPassword")
        .value = "";

      $("newPassword")
        .value = "";

      $("newPasswordConfirm")
        .value = "";

      showMessage(
        "Password changed successfully."
      );

      await render();
    }
  );


/* ============================================================
   STORAGE
   ============================================================ */

$("changeStorage")
  .addEventListener(
    "click",
    async () => {

      const password =
        prompt(
          "Enter your current password:"
        );

      if (password === null) {
        return;
      }

      const newMode =
        confirm(
          "Use Google Drive for backups?\n\nOK = Google Drive\nCancel = Local"
        )
          ? "drive"
          : "local";

      const response =
        await send(
          "changeStorageMode",
          {
            storageMode:
              newMode,
            password
          },
          "Migrating the backups to the new location…"
        );

      if (!response.success) {
        showMessage(
          response.error,
          true
        );
        return;
      }

      showMessage(
        `Backup storage changed to ${newMode}.`
      );

      await render();
    }
  );


$("connectDrive")
  .addEventListener(
    "click",
    async () => {

      const response =
        await send(
          "connectDrive",
          {},
          "Connecting Google Drive…"
        );

      if (!response.success) {
        showMessage(
          response.error,
          true
        );
        return;
      }

      showMessage(
        "Google Drive connected."
      );
    }
  );


$("disconnectDrive")
  .addEventListener(
    "click",
    async () => {

      const response =
        await send(
          "disconnectDrive",
          {},
          "Disconnecting Google Drive…"
        );

      if (!response.success) {
        showMessage(
          response.error,
          true
        );
        return;
      }

      showMessage(
        "Google Drive authorization cache cleared."
      );
    }
  );


/* ============================================================
   IMPORT
   ============================================================ */

$("import")
  .addEventListener(
    "click",
    async () => {

      const file =
        $("importFile")
          .files[0];

      const password =
        $("importPassword")
          .value;

      if (!file) {
        showMessage(
          "Select a .bmbkp file.",
          true
        );
        return;
      }

      if (!password) {
        showMessage(
          "Enter the backup password.",
          true
        );
        return;
      }

      try {
        const text =
          await file.text();

        const encrypted =
          JSON.parse(text);

        const response =
          await send(
            "importBackup",
            {
              encrypted,
              password
            },
            "Importing the backup…"
          );

        if (!response.success) {
          showMessage(
            response.error,
            true
          );
          return;
        }

        $("importFile")
          .value = "";

        $("importPassword")
          .value = "";

        showMessage(
          "Backup imported successfully."
        );

        await render();

      } catch (error) {
        showMessage(
          "Invalid backup file.",
          true
        );
      }
    }
  );


/* ============================================================
   ASK TO LOCK WHEN THE BROWSER STARTS
   ============================================================ */

let askedToLock = false;

async function maybeAskToLock() {
  if (askedToLock) {
    return;
  }

  const params =
    new URLSearchParams(
      location.search
    );

  if (params.get("askLock") !== "1") {
    return;
  }

  askedToLock = true;

  const response =
    await send("getConfig");

  if (!response.success) {
    return;
  }

  const config =
    response.result;

  if (
    !config.configured ||
    config.hidden !== false ||
    config.askLockOnClose === false
  ) {
    return;
  }

  const lockNow = confirm(
    "The protected bookmark folder is still unlocked.\n\nLock it now?"
  );

  if (!lockNow) {
    return;
  }

  const password = prompt(
    "Enter your Bookmark Vault password:"
  );

  if (password === null) {
    return;
  }

  const result =
    await send(
      "hide",
      { password },
      "Locking the vault and creating the encrypted backup…"
    );

  if (!result.success) {
    showMessage(
      result.error,
      true
    );
    return;
  }

  showMessage(
    "The protected folder has been hidden and backed up."
  );

  await render();
}


async function init() {
  try {
    await render();
  } catch (error) {
    showMessage(
      error?.message || "Unknown error.",
      true
    );
  }

  try {
    await maybeAskToLock();
  } catch (error) {
    showMessage(
      error?.message || "Unknown error.",
      true
    );
  }
}

init();
