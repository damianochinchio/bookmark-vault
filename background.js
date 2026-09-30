const MAX_BACKUPS = 3;
const PBKDF2_ITERATIONS = 600000;
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";

const DEFAULT_CONFIG = {
  version: 1,
  configured: false,
  storageMode: "drive",
  folderPath: [],
  folderTitle: "",
  parentPath: [],
  folderIndex: 0,
  hidden: false,
  verifier: null,
  backups: [],
  driveFolderId: null,
  configFileId: null,
  askLockOnClose: true
};

/* ============================================================
   GENERIC HELPERS
   ============================================================ */

async function getConfig() {
  const result = await chrome.storage.local.get("config");

  return {
    ...DEFAULT_CONFIG,
    ...(result.config || {})
  };
}

async function saveConfig(config) {
  await chrome.storage.local.set({ config });
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;

  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, Math.min(i + chunk, bytes.length))
    );
  }

  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

/* ============================================================
   CRYPTO
   ============================================================ */

async function deriveKey(password, salt) {
  const encoder = new TextEncoder();

  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptObject(object, password) {
  const encoder = new TextEncoder();

  const salt = crypto.getRandomValues(
    new Uint8Array(16)
  );

  const iv = crypto.getRandomValues(
    new Uint8Array(12)
  );

  const key = await deriveKey(password, salt);

  const plaintext = encoder.encode(
    JSON.stringify(object)
  );

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    plaintext
  );

  return {
    format: "bookmark-vault",
    version: 1,
    algorithm: "AES-256-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(
      new Uint8Array(ciphertext)
    )
  };
}

async function decryptObject(encrypted, password) {
  if (
    !encrypted ||
    encrypted.algorithm !== "AES-256-GCM" ||
    encrypted.kdf !== "PBKDF2-SHA256"
  ) {
    throw new Error("Unsupported encrypted backup format.");
  }

  const salt = base64ToBytes(encrypted.salt);
  const iv = base64ToBytes(encrypted.iv);
  const data = base64ToBytes(encrypted.data);

  const key = await deriveKey(password, salt);

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    data
  );

  const parsed = JSON.parse(
    new TextDecoder().decode(plaintext)
  );

  return parsed;
}

/* ============================================================
   BOOKMARK TREE
   ============================================================ */

function stripIds(node) {
  const result = {
    title: node.title || ""
  };

  if (node.url !== undefined) {
    result.url = node.url;
  }

  if (node.children) {
    result.children = node.children.map(stripIds);
  }

  return result;
}

function getPathToNode(rootNodes, targetId) {
  function walk(nodes, path) {
    for (const node of nodes) {
      if (node.id === targetId) {
        return [...path, node.title];
      }

      if (node.children) {
        const result = walk(
          node.children,
          [...path, node.title]
        );

        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  return walk(rootNodes, []);
}

/*
 * chrome.bookmarks.get() does not always include "children",
 * so folder nodes are looked up in the tree instead.
 */

function findNodeById(rootNodes, targetId) {
  for (const node of rootNodes) {
    if (node.id === targetId) {
      return node;
    }

    if (node.children) {
      const found = findNodeById(
        node.children,
        targetId
      );

      if (found) {
        return found;
      }
    }
  }

  return null;
}

// async function getBookmarkTree(folderId) {
//   console.log("Bookmark Vault getBookmarkTree folderId:", folderId);
//   console.log("Bookmark Vault folderId type:", typeof folderId);

//   if (
//     typeof folderId !== "string" ||
//     !folderId
//   ) {
//     throw new Error(
//       `Invalid bookmark folder ID: ${JSON.stringify(folderId)}`
//     );
//   }

//   const result =
//     await chrome.bookmarks.getSubTree(folderId);

//   if (!result.length) {
//     throw new Error(
//       "Protected folder was not found."
//     );
//   }

//   return stripIds(result[0]);
// }

async function getBookmarkTree(folderId) {
  console.log(
    "Bookmark Vault getBookmarkTree folderId:",
    folderId
  );

  console.log(
    "Bookmark Vault folderId type:",
    typeof folderId
  );

  if (
    typeof folderId !== "string" ||
    !folderId
  ) {
    console.trace(
      "Bookmark Vault: getBookmarkTree called with invalid folderId"
    );

    throw new Error(
      `Invalid bookmark folder ID: ${JSON.stringify(folderId)}`
    );
  }

  const result =
    await chrome.bookmarks.getSubTree(folderId);

  if (!result.length) {
    throw new Error(
      "Protected folder was not found."
    );
  }

  return stripIds(result[0]);
}

async function getRootTree() {
  return chrome.bookmarks.getTree();
}

function findNodeByPath(rootNodes, path) {
  let current = rootNodes;

  for (const part of path) {
    const node = current.find(
      item => item.title === part
    );

    if (!node) {
      return null;
    }

    if (!node.children) {
      return null;
    }

    current = node.children;
  }

  return current;
}

async function resolveFolderPath(path) {
  const roots = await getRootTree();

  if (!path.length) {
    return null;
  }

  let candidates = roots;

  for (const part of path) {
    const node = candidates.find(
      item => item.title === part
    );

    if (!node) {
      return null;
    }

    if (!node.children) {
      return null;
    }

    candidates = node.children;
  }

  return candidates;
}


// async function findFolderByPath(path) {
//   const roots = await getRootTree();

//   let candidates = roots;

//   for (const part of path) {
//     const node = candidates.find(
//       item => item.title === part
//     );

//     if (!node) {
//       return null;
//     }

//     if (!node.children) {
//       return null;
//     }

//     candidates = node.children;
//   }

//   return candidates;
// }

// async function findFolderByPath(path) {
//   const roots = await chrome.bookmarks.getTree();

//   let candidates = roots;

//   for (const part of path) {
//     const node = candidates.find(
//       item => item.title === part && item.children
//     );

//     if (!node) {
//       return null;
//     }

//     if (!node.children) {
//       return null;
//     }

//     candidates = node.children;
//   }

//   return candidates;
// }

async function findFolderByPath(path) {
  const roots =
    await chrome.bookmarks.getTree();

  let candidates = roots;
  let currentNode = null;

  for (const part of path) {
    const node = candidates.find(
      item =>
        item.title === part &&
        item.children
    );

    if (!node) {
      return null;
    }

    currentNode = node;
    candidates = node.children;
  }

  return currentNode;
}


async function createTree(node, parentId, index) {
  const details = {
    parentId,
    title: node.title || ""
  };

  if (
    Number.isInteger(index) &&
    index >= 0
  ) {
    details.index = index;
  }

  if (node.url !== undefined) {
    details.url = node.url;
  }

  let created;

  try {
    created =
      await chrome.bookmarks.create(details);
  } catch (error) {
    /*
     * Chrome rejects an index that is larger than the number
     * of children the parent has at that moment. This happens
     * when bookmarks were removed from the parent while the
     * folder was hidden, or when the parent was resolved by
     * name and another folder with the same name was found.
     * Retry once by appending at the end of the parent.
     */
    if (details.index === undefined) {
      throw error;
    }

    delete details.index;

    created =
      await chrome.bookmarks.create(details);
  }

  if (node.children) {
    for (const child of node.children) {
      await createTree(child, created.id);
    }
  }

  return created;
}

/*
 * Chrome only accepts an index between 0 and the current
 * number of children. Anything else must be clamped before
 * the folder is created.
 */
function clampBookmarkIndex(index, childCount) {
  if (!Number.isInteger(index)) {
    return undefined;
  }

  const count = Number.isInteger(childCount)
    ? childCount
    : 0;

  return Math.min(Math.max(index, 0), count);
}

/* ============================================================
   DRIVE
   ============================================================ */

async function getDriveToken(interactive = false) {

  
  // const result = await chrome.identity.getAuthToken({
  //   interactive
  // });

  const result = await chrome.identity.getAuthToken({
  interactive: true
});

  if (!result || !result.token) {
    throw new Error("Google Drive authorization failed.");
  }

  return result.token;
}

async function driveRequest(
  url,
  options = {},
  retry = true
) {
  const token = await getDriveToken(
    options.interactive === true
  );

  const headers = new Headers(
    options.headers || {}
  );

  headers.set(
    "Authorization",
    `Bearer ${token}`
  );

  const requestOptions = {
    ...options,
    headers
  };

  delete requestOptions.interactive;

  const response =
    await fetch(url, requestOptions);

  if (
    response.status === 401 &&
    retry
  ) {
    await chrome.identity.removeCachedAuthToken({
      token
    });

    return driveRequest(
      url,
      options,
      false
    );
  }

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Google Drive error ${response.status}: ${text}`
    );
  }

  return response;
}

// async function findDriveFolder() {
//   const config = await getConfig();

//   if (config.driveFolderId) {
//     try {
//       const response = await driveRequest(
//         `${DRIVE_API}/files/${config.driveFolderId}?fields=id,name,trashed`
//       );

//       const file = await response.json();

//       if (!file.trashed) {
//         return file.id;
//       }
//     } catch {
//       // Folder will be recreated.
//     }
//   }

//   const query = encodeURIComponent(
//     "name = 'Bookmark Vault' " +
//     "and mimeType = " +
//     "'application/vnd.google-apps.folder' " +
//     "and trashed = false"
//   );

//   const response = await driveRequest(
//     `${DRIVE_API}/files?spaces=drive&fields=files(id,name)&q=${query}`
//   );

//   const data = await response.json();

//   if (data.files && data.files.length) {
//     return data.files[0].id;
//   }

//   const created =
//     await driveRequest(
//       `${DRIVE_API}/files`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           name: "Bookmark Vault",
//           mimeType:
//             "application/vnd.google-apps.folder"
//         }),
//         interactive: true
//       }
//     );

//   const folder = await created.json();

//   return folder.id;
// }

async function ensureDriveAuth(interactive = false) {
  const result = await chrome.identity.getAuthToken({
    interactive
  });

  if (!result || !result.token) {
    throw new Error(
      "Google Drive authorization is required."
    );
  }

  return result.token;
}

// async function findDriveFolder(interactive = false) {
//   // Make sure Google Drive authorization exists before
//   // making any Drive API request.
//   await ensureDriveAuth(interactive);

//   const config = await getConfig();

//   if (config.driveFolderId) {
//     try {
//       const response = await driveRequest(
//         `${DRIVE_API}/files/${config.driveFolderId}?fields=id,name,trashed`
//       );

//       const file = await response.json();

//       if (!file.trashed) {
//         return file.id;
//       }
//     } catch {
//       // Folder will be recreated.
//     }
//   }

//   const query = encodeURIComponent(
//     "name = 'Bookmark Vault' " +
//     "and mimeType = " +
//     "'application/vnd.google-apps.folder' " +
//     "and trashed = false"
//   );

//   const response = await driveRequest(
//     `${DRIVE_API}/files?spaces=drive&fields=files(id,name)&q=${query}`
//   );

//   const data = await response.json();

//   if (data.files && data.files.length) {
//     return data.files[0].id;
//   }

//   const created = await driveRequest(
//     `${DRIVE_API}/files`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         name: "Bookmark Vault",
//         mimeType:
//           "application/vnd.google-apps.folder"
//       })
//     }
//   );

//   const folder = await created.json();

//   return folder.id;
// }

async function findDriveFolder(interactive = false) {
  const config = await getConfig();

  if (config.driveFolderId) {
    try {
      const response = await driveRequest(
        `${DRIVE_API}/files/${config.driveFolderId}?fields=id,name,trashed`,
        {
          interactive
        }
      );

      const file = await response.json();

      if (!file.trashed) {
        return file.id;
      }
    } catch {
      // Folder will be recreated.
    }
  }

  const query = encodeURIComponent(
    "name = 'Bookmark Vault' " +
    "and mimeType = " +
    "'application/vnd.google-apps.folder' " +
    "and trashed = false"
  );

  const response = await driveRequest(
    `${DRIVE_API}/files?spaces=drive&fields=files(id,name)&q=${query}`,
    {
      interactive
    }
  );

  const data = await response.json();

  if (data.files && data.files.length) {
    return data.files[0].id;
  }

  const created = await driveRequest(
    `${DRIVE_API}/files`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Bookmark Vault",
        mimeType:
          "application/vnd.google-apps.folder"
      }),
      interactive
    }
  );

  const folder = await created.json();

  return folder.id;
}


async function uploadDriveFile(
  name,
  content,
  mimeType = "application/json"
) {
  const folderId =
    await findDriveFolder();

  const boundary =
    "bookmark-vault-" +
    crypto.randomUUID();

  const metadata = {
    name,
    parents: [folderId],
    mimeType
  };

  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    `\r\n--${boundary}--`;

  const response =
    await driveRequest(
      `${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id,name,modifiedTime`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            `multipart/related; boundary=${boundary}`
        },
        body,
        interactive: true
      }
    );

  const file = await response.json();

  return {
    ...file,
    folderId
  };
}

async function updateDriveFile(
  fileId,
  content,
  mimeType = "application/json"
) {
  const response =
    await driveRequest(
      `${DRIVE_UPLOAD}/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": mimeType
        },
        body: content,
        interactive: true
      }
    );

  return response.json();
}

async function downloadDriveFile(fileId) {
  const response =
    await driveRequest(
      `${DRIVE_API}/files/${fileId}?alt=media`
    );

  return response.json();
}

async function deleteDriveFile(fileId) {
  await driveRequest(
    `${DRIVE_API}/files/${fileId}`,
    {
      method: "DELETE",
      interactive: true
    }
  );
}

async function findDriveConfigFile(folderId) {
  const query = encodeURIComponent(
    `'${folderId}' in parents ` +
    "and name = 'config.json' " +
    "and trashed = false"
  );

  const response =
    await driveRequest(
      `${DRIVE_API}/files?spaces=drive&fields=files(id,name)&q=${query}`
    );

  const data = await response.json();

  return data.files?.[0] || null;
}

async function saveDriveConfig(config) {
  const folderId =
    await findDriveFolder();

  config.driveFolderId = folderId;

  const serialized =
    JSON.stringify(config, null, 2);

  if (config.configFileId) {
    try {
      await updateDriveFile(
        config.configFileId,
        serialized
      );

      return;
    } catch {
      config.configFileId = null;
    }
  }

  const existing =
    await findDriveConfigFile(folderId);

  if (existing) {
    config.configFileId = existing.id;

    await updateDriveFile(
      existing.id,
      serialized
    );

    return;
  }

  const file =
    await uploadDriveFile(
      "config.json",
      serialized
    );

  config.configFileId = file.id;
}

async function saveConfigEverywhere(config) {
  await saveConfig(config);

  if (config.storageMode === "drive") {
    await saveDriveConfig(config);
    await saveConfig(config);
  }
}

/* ============================================================
   BACKUPS
   ============================================================ */

async function createEncryptedBackup(
  tree,
  config,
  password
) {
  const encrypted = await encryptObject(
    {
      type: "bookmark-backup",
      version: 1,
      createdAt: new Date().toISOString(),

      folder: {
        title: tree.title,
        path: config.folderPath,
        parentPath: config.parentPath,
        index: config.folderIndex
      },

      tree
    },
    password
  );

  return encrypted;
}

function backupFilename(createdAt) {
  return `bookmark-vault-${createdAt.replace(
    /[:.]/g,
    "-"
  )}.bmbkp`;
}

async function listDriveBackupFiles(folderId) {
  const query = encodeURIComponent(
    `'${folderId}' in parents ` +
    "and name contains '.bmbkp' " +
    "and trashed = false"
  );

  const response =
    await driveRequest(
      `${DRIVE_API}/files?spaces=drive` +
      `&fields=files(id,name,createdTime)` +
      `&q=${query}` +
      `&orderBy=createdTime desc&pageSize=50`
    );

  const data = await response.json();

  return data.files || [];
}

/*
 * Takes the SAME config object used by the caller so that
 * the record cannot be lost by a later stale overwrite.
 */
async function saveBackup(encrypted, config) {
  const id = crypto.randomUUID();
  const createdAt =
    new Date().toISOString();

  const record = {
    id,
    createdAt,
    driveFileId: null
  };

  if (config.storageMode === "local") {
    const key = `backup:${id}`;

    await chrome.storage.local.set({
      [key]: encrypted
    });
  } else {
    const file =
      await uploadDriveFile(
        backupFilename(createdAt),
        JSON.stringify(encrypted),
        "application/octet-stream"
      );

    record.driveFileId = file.id;
  }

  config.backups.unshift(record);

  while (
    config.backups.length > MAX_BACKUPS
  ) {
    const old =
      config.backups.pop();

    if (
      config.storageMode === "local"
    ) {
      await chrome.storage.local.remove(
        `backup:${old.id}`
      );
    }

    if (
      config.storageMode === "drive" &&
      old.driveFileId
    ) {
      try {
        await deleteDriveFile(
          old.driveFileId
        );
      } catch {
        // Keep going; the backup may still exist.
      }
    }
  }

  await saveConfigEverywhere(config);

  /*
   * Never delete the bookmark folder unless the record
   * is actually persisted in storage.
   */

  const verify = await getConfig();

  if (
    !verify.backups.some(
      item => item.id === record.id
    )
  ) {
    throw new Error(
      "The backup could not be saved. The protected folder was NOT deleted."
    );
  }

  return record;
}

async function loadBackup(record) {
  const config = await getConfig();

  if (
    config.storageMode === "local"
  ) {
    const result =
      await chrome.storage.local.get(
        `backup:${record.id}`
      );

    if (!result[`backup:${record.id}`]) {
      throw new Error(
        "Local backup not found."
      );
    }

    return result[`backup:${record.id}`];
  }

  if (!record.driveFileId) {
    throw new Error(
      "Drive backup file ID is missing."
    );
  }

  try {
    return await downloadDriveFile(
      record.driveFileId
    );
  } catch (error) {
    /*
     * The recorded file may be gone (moved, trashed or
     * uploaded from another account). Try to find it
     * again by name before giving up.
     */

    if (await repairDriveBackupRecord(config, record)) {
      return downloadDriveFile(
        record.driveFileId
      );
    }

    throw error;
  }
}

async function repairDriveBackupRecord(
  config,
  record
) {
  try {
    const folderId =
      await findDriveFolder();

    const files =
      await listDriveBackupFiles(folderId);

    const match =
      files.find(
        file =>
          file.name ===
          backupFilename(record.createdAt)
      );

    if (!match) {
      return false;
    }

    record.driveFileId = match.id;

    const stored =
      config.backups.find(
        item => item.id === record.id
      );

    if (stored) {
      stored.driveFileId = match.id;
    }

    await saveConfigEverywhere(config);

    return true;
  } catch {
    return false;
  }
}

/*
 * Re-registers .bmbkp files that exist in Drive but are
 * missing from the local backup list.
 */

async function recoverBackupsFromDrive(config) {
  if (config.storageMode !== "drive") {
    return false;
  }

  try {
    const folderId =
      await findDriveFolder();

    const files =
      await listDriveBackupFiles(folderId);

    if (!files.length) {
      return false;
    }

    const known =
      new Set(
        config.backups
          .map(item => item.driveFileId)
          .filter(Boolean)
      );

    let added = false;

    for (const file of files) {
      if (known.has(file.id)) {
        continue;
      }

      config.backups.push({
        id: crypto.randomUUID(),
        createdAt:
          file.createdTime ||
          new Date().toISOString(),
        driveFileId: file.id
      });

      added = true;
    }

    if (!added) {
      return false;
    }

    config.backups.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    while (
      config.backups.length > MAX_BACKUPS
    ) {
      config.backups.pop();
    }

    await saveConfigEverywhere(config);

    return config.backups.length > 0;
  } catch {
    return false;
  }
}

/* ============================================================
   PASSWORD
   ============================================================ */

async function createVerifier(password) {
  return encryptObject(
    {
      type: "password-verifier",
      value: "bookmark-vault-password-valid"
    },
    password
  );
}

async function verifyPassword(
  config,
  password
) {
  if (!config.verifier) {
    return false;
  }

  try {
    const result =
      await decryptObject(
        config.verifier,
        password
      );

    return (
      result.type ===
        "password-verifier" &&
      result.value ===
        "bookmark-vault-password-valid"
    );
  } catch {
    return false;
  }
}

/* ============================================================
   HIDE
   ============================================================ */

async function hideBookmarks(password) {
  const config = await getConfig();

  if (!config.configured) {
    throw new Error(
      "Bookmark Vault is not configured."
    );
  }

  if (config.hidden) {
    throw new Error(
      "The protected folder is already hidden."
    );
  }

  if (
    !(await verifyPassword(
      config,
      password
    ))
  ) {
    throw new Error("Incorrect password.");
  }

  const roots =
    await chrome.bookmarks.getTree();

  const folder =
    await findFolderByPath(
      config.folderPath
    );

  if (!folder) {
    throw new Error(
      "The protected folder could not be found."
    );
  }

  /*
   * The index saved at setup time goes stale as soon as the
   * parent folder is reordered: store the current position
   * in the backup instead of the old one.
   */
  config.folderIndex =
    folder.index ?? config.folderIndex;

  const tree =
    await getBookmarkTree(
      folder.id
    );

  /*
   * Important:
   * The encrypted backup is created and successfully
   * stored BEFORE the live bookmark folder is deleted.
   */

  await saveBackup(
    await createEncryptedBackup(
      tree,
      config,
      password
    ),
    config
  );

  await chrome.bookmarks.removeTree(
    folder.id
  );

  config.hidden = true;

  await saveConfigEverywhere(config);

  return {
    hidden: true
  };
}

/* ============================================================
   SHOW / MERGE
   ============================================================ */

async function restoreChildren(
  source,
  destinationFolderId
) {
  if (!source.children) {
    return;
  }

  for (const child of source.children) {
    await createTree(
      child,
      destinationFolderId
    );
  }
}


/*
 * When several folders with the same name exist as siblings,
 * prefer the one that still contains the protected folder,
 * otherwise the one that is large enough to hold it at the
 * saved position.
 */
function pickParentCandidate(matches, hint) {
  if (matches.length === 1) {
    return matches[0];
  }

  if (hint && hint.title) {
    const withDestination = matches.find(
      item =>
        item.children.some(
          child => child.title === hint.title
        )
    );

    if (withDestination) {
      return withDestination;
    }
  }

  if (hint && Number.isInteger(hint.minChildren)) {
    const largeEnough = matches.find(
      item =>
        item.children.length >= hint.minChildren
    );

    if (largeEnough) {
      return largeEnough;
    }
  }

  return matches[0];
}

async function resolveParentFolder(path, hint) {
  const roots =
    await chrome.bookmarks.getTree();

  let candidates = roots;
  let current = null;

  for (
    let position = 0;
    position < path.length;
    position++
  ) {
    const part = path[position];

    const matches = candidates.filter(
      item =>
        item.title === part &&
        item.children
    );

    if (matches.length === 0) {
      return null;
    }

    current =
      position === path.length - 1
        ? pickParentCandidate(matches, hint)
        : matches[0];

    candidates =
      current.children;
  }

  return current;
}


async function showBookmarks(password) {
  const config = await getConfig();

  if (!config.configured) {
    throw new Error(
      "Bookmark Vault is not configured."
    );
  }

  if (!config.hidden) {
    throw new Error(
      "The protected folder is already visible."
    );
  }

  if (!config.backups.length) {
    /*
     * The list may be empty even though the encrypted
     * files are still in Drive.
     */

    await recoverBackupsFromDrive(config);
  }

  if (!config.backups.length) {
    throw new Error(
      "No backup is available."
    );
  }

  const latest =
    config.backups[0];

  const encrypted =
    await loadBackup(latest);

  let backup;

  try {
    backup =
      await decryptObject(
        encrypted,
        password
      );
  } catch {
    throw new Error(
      "Incorrect password or corrupted backup."
    );
  }

  // const parentCandidates =
  //   await findFolderByPath(
  //     backup.folder.parentPath
  //   );

  // if (!parentCandidates) {
  //   throw new Error(
  //     "The original parent folder could not be found."
  //   );
  // }

  const parentCandidates =
  await findFolderByPath(
    backup.folder.parentPath
  );

if (!parentCandidates) {
  throw new Error(
    "The original parent folder could not be found."
  );
}

// const parent =
//   await resolveParentFolder(
//     backup.folder.parentPath
//   );

//   /*
//    * If a folder with the same name already exists,
//    * merge the backup into it instead of deleting it.
//    * This preserves current bookmarks.
//    */

//   let destination =
//     parentCandidates.find(
//       node =>
//         node.title ===
//           backup.folder.title &&
//         node.children
//     );

//   if (!destination) {
//     destination =
//       await createTree(
//         {
//           title: backup.folder.title,
//           children: []
//         },
//         parentCandidates.id,
//         backup.folder.index
//       );
//   }

//   await restoreChildren(
//     backup.tree,
//     destination.id
//   );

const savedIndex = Number.isInteger(
  backup.folder.index
)
  ? backup.folder.index
  : undefined;

const parent =
  await resolveParentFolder(
    backup.folder.parentPath,
    {
      title: backup.folder.title,
      minChildren: savedIndex
    }
  );

if (!parent) {
  throw new Error(
    "The original parent folder could not be found."
  );
}

let destination =
  parent.children?.find(
    node =>
      node.title === backup.folder.title &&
      node.children
  );

if (!destination) {
  destination = await createTree(
    {
      title: backup.folder.title,
      children: []
    },
    parent.id,

    clampBookmarkIndex(
      savedIndex,
      parent.children?.length
    )
  );
}

await restoreChildren(
  backup.tree,
  destination.id
);

  config.hidden = false;

  await saveConfigEverywhere(config);

  return {
    hidden: false,
    folderId: destination.id
  };
}

/* ============================================================
   CONFIGURATION
   ============================================================ */

async function configure(
  folderId,
  password,
  storageMode
) {
  if (!password || password.length < 12) {
    throw new Error(
      "Password must contain at least 12 characters."
    );
  }

  const current =
    await getConfig();

  if (current.configured) {
    throw new Error(
      "Bookmark Vault is already configured."
    );
  }

  const roots =
    await chrome.bookmarks.getTree();

  const folderPath =
    getPathToNode(
      roots,
      folderId
    );

  if (!folderPath) {
    throw new Error(
      "Folder not found."
    );
  }

  if (folderPath.length < 2) {
    throw new Error(
      "Please select a normal bookmark folder."
    );
  }

  const parentPath =
    folderPath.slice(
      0,
      -1
    );

  const folder =
    findNodeById(
      roots,
      folderId
    );

  if (!folder) {
    throw new Error(
      "Folder not found."
    );
  }

  if (!folder.children) {
    throw new Error(
      "Please select a bookmark folder."
    );
  }

  const node = folder;

  const config = {
    ...DEFAULT_CONFIG,

    configured: true,
    storageMode:
      storageMode === "local"
        ? "local"
        : "drive",

    folderPath,
    folderTitle: node.title,
    parentPath,
    folderIndex:
      node.index ?? 0,

    hidden: false,

    verifier:
      await createVerifier(password),

    backups: []
  };

  /*
   * Test Drive configuration immediately if selected.
   * We do not leave the user with a configuration that
   * cannot actually reach Drive.
   */

  if (config.storageMode === "drive") {
    await saveDriveConfig(config);
  }

  await saveConfig(config);

  return {
    success: true
  };
}

/* ============================================================
   CHANGE PROTECTED FOLDER
   ============================================================ */

async function changeProtectedFolder(
  folderId,
  password
) {
  const config =
    await getConfig();

  if (!config.configured) {
    throw new Error(
      "Bookmark Vault is not configured."
    );
  }

  if (config.hidden) {
    throw new Error(
      "Unlock the vault before changing the protected folder."
    );
  }

  if (
    !(await verifyPassword(
      config,
      password
    ))
  ) {
    throw new Error(
      "Incorrect password."
    );
  }

  if (
    typeof folderId !== "string" ||
    !folderId
  ) {
    throw new Error(
      "Please select a bookmark folder."
    );
  }

  const roots =
    await chrome.bookmarks.getTree();

  const folderPath =
    getPathToNode(
      roots,
      folderId
    );

  if (!folderPath) {
    throw new Error(
      "Folder not found."
    );
  }

  if (folderPath.length < 2) {
    throw new Error(
      "Please select a normal bookmark folder."
    );
  }

  const folder =
    findNodeById(
      roots,
      folderId
    );

  if (!folder) {
    throw new Error(
      "Folder not found."
    );
  }

  const node = folder;

  if (!node.children) {
    throw new Error(
      "Please select a bookmark folder."
    );
  }

  const sameFolder =
    JSON.stringify(folderPath) ===
    JSON.stringify(config.folderPath);

  if (sameFolder) {
    return {
      success: true,
      changed: false
    };
  }

  config.folderPath = folderPath;
  config.folderTitle = node.title;
  config.parentPath =
    folderPath.slice(0, -1);
  config.folderIndex =
    node.index ?? 0;

  await saveConfigEverywhere(config);

  return {
    success: true,
    changed: true,
    folderPath
  };
}

/* ============================================================
   CHANGE PASSWORD
   ============================================================ */

async function changePassword(
  oldPassword,
  newPassword
) {
  const config =
    await getConfig();

  if (!config.configured) {
    throw new Error(
      "Bookmark Vault is not configured."
    );
  }

  if (newPassword.length < 12) {
    throw new Error(
      "New password must contain at least 12 characters."
    );
  }

  if (
    !(await verifyPassword(
      config,
      oldPassword
    ))
  ) {
    throw new Error(
      "Incorrect current password."
    );
  }

  /*
   * Re-encrypt every backup before replacing it.
   */

  const encryptedBackups = [];

  for (const record of config.backups) {
    const oldEncrypted =
      await loadBackup(record);

    const plain =
      await decryptObject(
        oldEncrypted,
        oldPassword
      );

    const encrypted =
      await encryptObject(
        plain,
        newPassword
      );

    encryptedBackups.push({
      record,
      encrypted
    });
  }

  /*
   * Upload/write all new versions first.
   */

  for (const item of encryptedBackups) {
    const { record, encrypted } = item;

    if (config.storageMode === "local") {
      await chrome.storage.local.set({
        [`backup:${record.id}`]:
          encrypted
      });
    } else {
      await updateDriveFile(
        record.driveFileId,
        JSON.stringify(encrypted),
        "application/octet-stream"
      );
    }
  }

  config.verifier =
    await createVerifier(
      newPassword
    );

  await saveConfigEverywhere(config);

  return {
    success: true
  };
}

/* ============================================================
   STORAGE MODE
   ============================================================ */

async function changeStorageMode(
 newMode,
  password
) {
  const config =
    await getConfig();

  if (!config.configured) {
    throw new Error(
      "Bookmark Vault is not configured."
    );
  }

  if (
    !(await verifyPassword(
      config,
      password
    ))
  ) {
    throw new Error(
      "Incorrect password."
    );
  }

  if (
    newMode !== "local" &&
    newMode !== "drive"
  ) {
    throw new Error(
      "Invalid storage mode."
    );
  }

  if (
    newMode === config.storageMode
  ) {
    return {
      success: true
    };
  }

  /*
   * Copy all existing backups to the new
   * destination before switching the configuration.
   */

  const newRecords = [];

  for (const record of config.backups) {
    const encrypted =
      await loadBackup(record);

    const newRecord = {
      ...record,
      driveFileId: null
    };

    if (newMode === "local") {
      await chrome.storage.local.set({
        [`backup:${record.id}`]:
          encrypted
      });
    } else {
      const filename =
        `bookmark-vault-${record.createdAt.replace(
          /[:.]/g,
          "-"
        )}.bmbkp`;

      const file =
        await uploadDriveFile(
          filename,
          JSON.stringify(encrypted),
          "application/octet-stream"
        );

      newRecord.driveFileId =
        file.id;
    }

    newRecords.push(newRecord);
  }

  /*
   * Only after successful migration do we
   * change the active mode.
   */

  config.storageMode = newMode;
  config.backups = newRecords;

  await saveConfigEverywhere(config);

  return {
    success: true
  };
}

/* ============================================================
   EXPORT
   ============================================================ */

async function exportBackup(
  backupId
) {
  const config =
    await getConfig();

  const record =
    config.backups.find(
      b => b.id === backupId
    );

  if (!record) {
    throw new Error(
      "Backup not found."
    );
  }

  /*
   * The service worker has no DOM, so the payload is
   * returned to the options page which creates the file.
   */

  const encrypted =
    await loadBackup(record);

  return {
    encrypted,
    filename:
      backupFilename(
        record.createdAt
      )
  };
}

/* ============================================================
   IMPORT
   ============================================================ */

async function importBackup(
  encrypted,
  password
) {
  const config =
    await getConfig();

  if (!config.configured) {
    throw new Error(
      "Configure Bookmark Vault first."
    );
  }

  /*
   * Validate the password and backup before
   * putting anything into storage.
   */

  const plain =
    await decryptObject(
      encrypted,
      password
    );

  if (
    plain.type !==
      "bookmark-backup"
  ) {
    throw new Error(
      "Invalid Bookmark Vault backup."
    );
  }

  /*
   * Store the imported encrypted backup.
   */

  const id =
    crypto.randomUUID();

  const createdAt =
    new Date().toISOString();

  const record = {
    id,
    createdAt,
    driveFileId: null
  };

  if (config.storageMode === "local") {
    await chrome.storage.local.set({
      [`backup:${id}`]:
        encrypted
    });
  } else {
    const file =
      await uploadDriveFile(
        `imported-${createdAt.replace(
          /[:.]/g,
          "-"
        )}.bmbkp`,
        JSON.stringify(encrypted),
        "application/octet-stream"
      );

    record.driveFileId =
      file.id;
  }

  config.backups.unshift(record);

  while (
    config.backups.length >
      MAX_BACKUPS
  ) {
    const old =
      config.backups.pop();

    if (
      config.storageMode === "local"
    ) {
      await chrome.storage.local.remove(
        `backup:${old.id}`
      );
    }

    if (
      config.storageMode === "drive" &&
      old.driveFileId
    ) {
      try {
        await deleteDriveFile(
          old.driveFileId
        );
      } catch {}
    }
  }

  await saveConfigEverywhere(config);

  return {
    success: true
  };
}

/* ============================================================
   CLEANUP (previous build)
   ============================================================ */

/*
 * Removes local data written by older versions of the
 * extension. Nothing else in storage is touched.
 */
async function cleanupLegacyLicenseData() {
  try {
    await chrome.storage.local.remove([
      "license",
      "licenseSeed",
      "licenseAccount",
      "cryptoCount"
    ]);
  } catch (error) {
    console.error(
      "Bookmark Vault:",
      error
    );
  }
}

cleanupLegacyLicenseData();

/* ============================================================
   MESSAGES
   ============================================================ */

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    (async () => {
      try {
        let result;

        switch (message.action) {
          case "getConfig":
            result = await getConfig();
            break;

          case "getFolders": {
            const roots =
              await chrome.bookmarks.getTree();

            const folders = [];

            function walk(nodes, path) {
              for (const node of nodes) {
                if (!node.children) {
                  continue;
                }

                const currentPath =
                  [...path, node.title];

                folders.push({
                  id: node.id,
                  title: node.title,
                  path: currentPath,
                  displayPath:
                    currentPath.join(" / "),
                  index:
                    node.index ?? 0
                });

                walk(
                  node.children,
                  currentPath
                );
              }
            }

            walk(roots, []);

            result = folders;
            break;
          }

          case "configure":
            result = await configure(
              message.folderId,
              message.password,
              message.storageMode
            );
            break;

          case "hide":
            result = await hideBookmarks(
              message.password
            );
            break;

          case "show":
            result = await showBookmarks(
              message.password
            );
            break;

          case "changePassword":
            result =
              await changePassword(
                message.oldPassword,
                message.newPassword
              );
            break;

          case "changeFolder":
            result =
              await changeProtectedFolder(
                message.folderId,
                message.password
              );
            break;

          case "setAskLockOnClose": {
            const config =
              await getConfig();

            if (!config.configured) {
              throw new Error(
                "Bookmark Vault is not configured."
              );
            }

            config.askLockOnClose =
              message.enabled !== false;

            await saveConfigEverywhere(
              config
            );

            result = {
              success: true,
              askLockOnClose:
                config.askLockOnClose
            };
            break;
          }

          case "changeStorageMode":
            result =
              await changeStorageMode(
                message.storageMode,
                message.password
              );
            break;

          case "exportBackup":
            result =
              await exportBackup(
                message.backupId
              );
            break;

          case "importBackup":
            result =
              await importBackup(
                message.encrypted,
                message.password
              );
            break;

          // case "connectDrive":
          //   result = {
          //     folderId:
          //       await findDriveFolder()
          //   };
          //   break;

          case "connectDrive":
            result = {
              folderId:
                await findDriveFolder(true)
            };
            break;


          case "disconnectDrive":
            await chrome.identity.clearAllCachedAuthTokens();

            result = {
              success: true
            };
            break;

          default:
            throw new Error(
              "Unknown operation."
            );
        }

        sendResponse({
          success: true,
          result
        });
      } catch (error) {
        console.error(
          "Bookmark Vault:",
          error
        );

        sendResponse({
          success: false,
          error:
            error?.message ||
            "Unknown error."
        });
      }
    })();

    return true;
  }
);

/* Clicking the toolbar icon opens Settings. */
chrome.action.onClicked.addListener(
  () => {
    chrome.runtime.openOptionsPage();
  }
);

/*
 * If the browser was closed while the vault was unlocked,
 * ask for locking as soon as the browser starts again.
 */
chrome.runtime.onStartup.addListener(
  () => {
    (async () => {
      try {
        const config =
          await getConfig();

        if (
          config.configured &&
          config.hidden === false &&
          config.askLockOnClose
        ) {
          await chrome.tabs.create({
            url:
              chrome.runtime.getURL(
                "options.html"
              ) + "?askLock=1"
          });
        }
      } catch (error) {
        console.error(
          "Bookmark Vault:",
          error
        );
      }
    })();
  }
);
