const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function read(file) {
  return fs.readFileSync(
    path.join(root, file),
    "utf8"
  );
}

const sourceFiles = [
  "background.js",
  "options.js",
  "options.html",
  "options.css",
  "manifest.json",
  "readme.txt",
  "readme_en.txt",
  "readme_es.txt",
  "readme_fr.txt",
  "readme_it.txt",
  "readme_de.txt"
];

/*
 * Tokens that only exist in the former licensing system.
 * Each one must be absent from every project file.
 */
const forbiddenTokens = [
  "activation",
  "activate",
  "request code",
  "request-code",
  "license key",
  "shareware",
  "purchase",
  "trial",
  "nudge",
  "cryptoCount",
  "FREE_OPERATIONS",
  "freeLimit",
  "getLicense",
  "setLicenseAccount",
  "activateLicense",
  "registerBanner",
  "bannerRegister",
  "bannerDismiss",
  "licenseOverlay",
  "licenseSection",
  "licenseStatus",
  "licenseBtn",
  "licenseRequestCode",
  "licenseActivationInput",
  "licenseEmail",
  "licenseActivate",
  "damiano.chinchio@gmail.com",

  /* same concepts in the other readme languages */
  "attivazione",
  "activación",
  "aktivierungscode",
  "registrazione",
  "registrierung"
];

function hits(text, tokens) {
  const found = [];

  for (const token of tokens) {
    if (
      text.toLowerCase().includes(token.toLowerCase())
    ) {
      found.push(token);
    }
  }

  return found;
}

function withoutCleanupFunction(source) {
  const start = source.indexOf(
    "async function cleanupLegacyLicenseData"
  );

  const end = source.indexOf(
    "cleanupLegacyLicenseData();",
    start
  );

  if (start === -1 || end === -1) {
    return source;
  }

  return (
    source.slice(0, start) +
    source.slice(
      end + "cleanupLegacyLicenseData();".length
    )
  );
}

test("no functional licensing references remain", () => {
  for (const file of sourceFiles) {
    const source = read(file);

    const text =
      file === "background.js"
        ? withoutCleanupFunction(source)
        : source;

    const found = hits(text, forbiddenTokens);

    assert.deepStrictEqual(
      found,
      [],
      `${file}: forbidden tokens found: ${found.join(", ")}`
    );
  }
});

test("no licensing UI elements are left", () => {
  const html = read("options.html");

  const removedIds = [
    "registerBanner",
    "registerBannerText",
    "bannerRegister",
    "bannerDismiss",
    "licenseSection",
    "licenseStatus",
    "licenseBtn",
    "licenseOverlay",
    "licenseDialogStatus",
    "licenseAccountInput",
    "licenseRequestCode",
    "licenseActivationInput",
    "licenseEmail",
    "licenseActivate",
    "licenseClose"
  ];

  for (const id of removedIds) {
    assert.ok(
      !html.includes(`id="${id}"`),
      `options.html still contains #${id}`
    );
  }

  const css = read("options.css");

  for (const selector of [".banner", ".license-card", ".license-status"]) {
    assert.ok(
      !css.includes(selector),
      `options.css still contains ${selector}`
    );
  }
});

test("legacy licensing data is removed on start, nothing else", async () => {
  const source = read("background.js");

  const start = source.indexOf(
    "async function cleanupLegacyLicenseData"
  );

  assert.notStrictEqual(start, -1, "cleanup function missing");

  const end = source.indexOf("\r\n}\r\n", start);

  assert.notStrictEqual(end, -1, "cleanup function not closed");

  const functionSource = source.slice(
    start,
    end + "\r\n}\r\n".length
  );

  const store = {
    license: { code: "AAAA-BBBB", activatedAt: "2026-01-01" },
    licenseSeed: "00112233445566778899aabbccddeeff",
    licenseAccount: "someone@example.com",
    cryptoCount: 123,
    config: { folderPath: ["Bar"], configured: true },
    backups: [{ id: "backup:1" }],
    theme: "dark"
  };

  const chromeStub = {
    storage: {
      local: {
        remove: async keys => {
          for (const key of keys) {
            delete store[key];
          }
        }
      }
    }
  };

  const factory = new Function(
    "chrome",
    functionSource + "\nreturn cleanupLegacyLicenseData;"
  );

  const cleanup = factory(chromeStub);

  await cleanup();

  assert.deepStrictEqual(store.license, undefined);
  assert.deepStrictEqual(store.licenseSeed, undefined);
  assert.deepStrictEqual(store.licenseAccount, undefined);
  assert.deepStrictEqual(store.cryptoCount, undefined);

  assert.deepStrictEqual(store.config, {
    folderPath: ["Bar"],
    configured: true
  });
  assert.deepStrictEqual(store.backups, [
    { id: "backup:1" }
  ]);
  assert.strictEqual(store.theme, "dark");
});

test("cleanup runs at service worker start", () => {
  const source = read("background.js");

  assert.ok(
    source.includes(
      "cleanupLegacyLicenseData();"
    ),
    "cleanup is not invoked"
  );
});

test("every feature action is still available", () => {
  const background = read("background.js");

  const actions = [
    "getConfig",
    "getFolders",
    "configure",
    "hide",
    "show",
    "changePassword",
    "changeFolder",
    "setAskLockOnClose",
    "changeStorageMode",
    "exportBackup",
    "importBackup",
    "connectDrive",
    "disconnectDrive"
  ];

  for (const action of actions) {
    assert.ok(
      background.includes(`case "${action}":`),
      `background.js is missing case "${action}"`
    );
  }

  const options = read("options.js");

  for (const action of [
    "hide",
    "show",
    "changePassword",
    "importBackup"
  ]) {
    assert.ok(
      options.includes(`"${action}"`),
      `options.js never calls "${action}"`
    );
  }
});

test("no license server is contacted", () => {
  const text = [
    read("background.js"),
    read("options.js"),
    read("manifest.json")
  ].join("\n");

  const urls = [
    ...text.matchAll(/https:\/\/[a-zA-Z0-9./_-]+/g)
  ].map(match => match[0]);

  assert.ok(urls.length > 0, "no URLs found");

  for (const url of urls) {
    assert.ok(
      url.includes("googleapis.com"),
      `unexpected external host: ${url}`
    );
  }
});

test("manifest keeps the permissions the extension needs", () => {
  const manifest = JSON.parse(read("manifest.json"));

  assert.deepStrictEqual(manifest.permissions, [
    "bookmarks",
    "storage",
    "downloads",
    "identity",
    "unlimitedStorage"
  ]);

  assert.strictEqual(
    manifest.oauth2.scopes[0],
    "https://www.googleapis.com/auth/drive.file"
  );

  assert.strictEqual(
    manifest.options_ui.page,
    "options.html"
  );
});

test("storage is never reset as a whole", () => {
  const background = read("background.js");

  assert.ok(
    !background.includes("chrome.storage.local.clear"),
    "storage.local.clear found: user data would be lost"
  );

  const removeCalls = [
    ...background.matchAll(
      /chrome\.storage\.local\.remove\(\[([\s\S]*?)\]\)/g
    )
  ].map(match => match[1]);

  assert.strictEqual(
    removeCalls.length,
    1,
    "only the licensing cleanup may remove keys"
  );

  const keys = removeCalls[0];

  for (const key of [
    "license",
    "licenseSeed",
    "licenseAccount",
    "cryptoCount"
  ]) {
    assert.ok(
      keys.includes(`"${key}"`),
      `cleanup does not remove ${key}`
    );
  }
});
