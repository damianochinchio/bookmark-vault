const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const background = fs.readFileSync(
  path.join(__dirname, "..", "background.js"),
  "utf8"
);

/*
 * Extracts a top level function from background.js so the
 * real implementation can be executed with a stubbed chrome.
 */
function extractFunction(
  keyword,
  name,
  args
) {
  const header = `${keyword} ${name}(${args}) {`;

  const start = background.indexOf(header);

  assert.notStrictEqual(
    start,
    -1,
    `${name} not found in background.js`
  );

  const end = background.indexOf("\r\n}\r\n", start);

  assert.notStrictEqual(
    end,
    -1,
    `${name} has no closing brace`
  );

  const source = background.slice(
    start,
    end + "\r\n}\r\n".length
  );

  return new Function(
    "chrome",
    `${source}\nreturn ${name};`
  );
}

function makeChrome(store) {
  let nextId = 1;

  return {
    bookmarks: {
      create: async details => {
        const children =
          store[details.parentId] || [];

        if (
          details.index !== undefined &&
          details.index > children.length
        ) {
          throw new Error(
            "Index out of bounds."
          );
        }

        if (details.url === "invalid://url") {
          throw new Error("Invalid URL.");
        }

        const id = `n${nextId++}`;
        const position =
          details.index === undefined
            ? children.length
            : details.index;

        children.splice(position, 0, {
          id,
          title: details.title,
          url: details.url,
          index: position
        });

        store[details.parentId] = children;
        store[id] = [];

        return {
          id,
          title: details.title,
          url: details.url,
          index: position
        };
      }
    }
  };
}

test("clampBookmarkIndex never returns an invalid index", () => {
  const factory = extractFunction(
    "function",
    "clampBookmarkIndex",
    "index, childCount"
  );

  const clamp = factory({});

  assert.strictEqual(
    clamp(undefined, 5),
    undefined
  );

  assert.strictEqual(
    clamp("3", 5),
    undefined
  );

  assert.strictEqual(
    clamp(-4, 5),
    0
  );

  assert.strictEqual(
    clamp(2, 5),
    2
  );

  assert.strictEqual(
    clamp(97, 12),
    12
  );

  assert.strictEqual(
    clamp(97, undefined),
    0
  );
});

test("createTree appends when the saved index is too large", async () => {
  const factory = extractFunction(
    "async function",
    "createTree",
    "node, parentId, index"
  );

  const store = {
    root: [
      { id: "a", title: "a" },
      { id: "b", title: "b" },
      { id: "c", title: "c" }
    ]
  };

  const createTree = factory(makeChrome(store));

  const created = await createTree(
    {
      title: "Vault",
      children: [
        { title: "first", url: "https://one" },
        { title: "second" },
        { title: "third" }
      ]
    },
    "root",
    97
  );

  const siblings = store.root;

  assert.strictEqual(siblings.length, 4);
  assert.strictEqual(
    siblings[3].title,
    "Vault"
  );

  assert.strictEqual(created.id, siblings[3].id);

  assert.deepStrictEqual(
    store[created.id].map(node => node.title),
    ["first", "second", "third"]
  );
});

test("createTree keeps a valid index", async () => {
  const factory = extractFunction(
    "async function",
    "createTree",
    "node, parentId, index"
  );

  const store = {
    root: [
      { id: "a", title: "a" },
      { id: "b", title: "b" },
      { id: "c", title: "c" }
    ]
  };

  const createTree = factory(makeChrome(store));

  await createTree(
    { title: "Vault", children: [] },
    "root",
    1
  );

  assert.strictEqual(
    store.root.map(node => node.title).join(","),
    "a,Vault,b,c"
  );
});

test("createTree still reports real failures", async () => {
  const factory = extractFunction(
    "async function",
    "createTree",
    "node, parentId, index"
  );

  const store = { root: [] };

  const createTree = factory(makeChrome(store));

  await assert.rejects(
    () =>
      createTree(
        {
          title: "Broken",
          url: "invalid://url",
          children: []
        },
        "root",
        0
      ),
    /Invalid URL/
  );

  assert.strictEqual(store.root.length, 0);
});

test("pickParentCandidate resolves duplicate folder names", () => {
  const factory = extractFunction(
    "function",
    "pickParentCandidate",
    "matches, hint"
  );

  const pick = factory({});

  const small = {
    id: "small",
    title: "Work",
    children: []
  };

  const big = {
    id: "big",
    title: "Work",
    children: [
      { title: "one" },
      { title: "two" },
      { title: "three" }
    ]
  };

  const withVault = {
    id: "withVault",
    title: "Work",
    children: [{ title: "Vault" }]
  };

  assert.strictEqual(
    pick([big],
      { title: "Vault", minChildren: 3 }),
    big
  );

  assert.strictEqual(
    pick([small, big],
      { title: "Vault", minChildren: 3 }),
    big
  );

  assert.strictEqual(
    pick([small, big, withVault],
      { title: "Vault", minChildren: 3 }),
    withVault
  );

  assert.strictEqual(
    pick([small, big],
      { title: "Vault", minChildren: 99 }),
    small
  );

  assert.strictEqual(
    pick([small, big]),
    small
  );
});
