const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const local = {
  promnexa_settings: {
    onboardingComplete: true,
    aiProvider: {
      provider: "gemini",
      apiKey: "test-legacy-key",
      model: "test-model",
    },
  },
};
const session = {};
const listeners = {};
const messages = [];
const windows = [];
let policy = "",
  fetches = 0;
function event(name) {
  return {
    addListener: (fn) => {
      listeners[name] = fn;
    },
  };
}
function area(data, name) {
  return {
    get: async (key) =>
      key == null
        ? structuredClone(data)
        : typeof key === "string"
          ? { [key]: structuredClone(data[key]) }
          : Object.fromEntries(key.map((k) => [k, structuredClone(data[k])])),
    set: async (values) => {
      const changes = {};
      for (const [key, value] of Object.entries(values)) {
        changes[key] = {
          oldValue: structuredClone(data[key]),
          newValue: structuredClone(value),
        };
        data[key] = structuredClone(value);
      }
      listeners.changed?.(changes, name);
    },
    remove: async (keys) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key];
    },
    clear: async () => {
      for (const key of Object.keys(data)) delete data[key];
    },
  };
}
const api = {
  runtime: {
    id: "testid",
    getURL: (path) => "chrome-extension://testid/" + path.replace(/^\//, ""),
    onInstalled: event("installed"),
    onMessage: event("message"),
  },
  contextMenus: {
    removeAll: async () => {},
    create: () => {},
    onClicked: event("menu"),
  },
  storage: {
    local: {
      ...area(local, "local"),
      setAccessLevel: async (options) => {
        policy = options.accessLevel;
      },
    },
    session: area(session, "session"),
    onChanged: event("changed"),
  },
  tabs: {
    query: async () => [{ id: 7 }],
    get: async (id) => {
      if (id !== 7) throw new Error("closed");
      return { id };
    },
    sendMessage: async (id, message) => {
      messages.push(message);
    },
    create: async (options) => {
      windows.push(options);
    },
  },
  windows: {
    create: async (options) => {
      windows.push(options);
    },
  },
  action: {
    setPopup: async () => {},
    openPopup: async () => {
      throw new Error("not supported");
    },
    setBadgeText: async () => {},
    setTitle: async () => {},
  },
  permissions: { getAll: async () => ({ data_collection: [] }) },
};
const world = {
  browser: api,
  chrome: api,
  TextEncoder,
  TextDecoder,
  structuredClone,
  URL,
  AbortSignal,
  DOMException,
  Response,
  crypto: require("node:crypto").webcrypto,
  console: { log() {}, warn() {}, error() {} },
  fetch: async () => {
    fetches++;
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    optimized: "A safe rewrite",
                    improvements: ["Clarity"],
                  }),
                },
              ],
            },
          },
        ],
      }),
    );
  },
};
vm.runInNewContext(
  fs.readFileSync(".output/chrome-mv3/background.js", "utf8"),
  world,
  { timeout: 1000 },
);
async function send(
  message,
  sender = { id: "testid", url: "chrome-extension://testid/popup.html" },
) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Background response timeout")),
      2000,
    );
    const result = listeners.message(message, sender, (value) => {
      clearTimeout(timer);
      resolve(value);
    });
    if (result !== true) {
      clearTimeout(timer);
      resolve(undefined);
    }
  });
}
(async () => {
  const safe = await send(
    { type: "PROMNEXA_PUBLIC_SETTINGS" },
    { id: "testid", url: "https://chatgpt.com/", tab: { id: 7 } },
  );
  assert.equal(policy, "TRUSTED_CONTEXTS");
  assert.equal(safe.settings.hasAiProvider, true);
  assert.ok(!JSON.stringify(safe).includes("test-legacy-key"));
  assert.equal(local.promnexa_settings.aiProvider.apiKey, "");
  assert.equal(session.promnexa_credentials.apiKey, "test-legacy-key");
  assert.equal(local.promnexa_credentials, null);
  const blocked = await send({
    type: "PROMNEXA_AI",
    text: "password=demosecret",
    category: "general",
    mode: "quick",
  });
  assert.equal(blocked.code, "SENSITIVE");
  assert.equal(fetches, 0);
  const limited = await send({
    type: "PROMNEXA_AI",
    text: "x".repeat(20001),
    category: "general",
    mode: "quick",
  });
  assert.equal(limited.code, "INPUT");
  assert.equal(fetches, 0);
  const accepted = await send({
    type: "PROMNEXA_AI",
    text: "password=demosecret",
    sensitiveConsent: true,
    category: "general",
    mode: "quick",
  });
  assert.equal(accepted.result.engine, "ai");
  assert.equal(fetches, 1);
  const denied = await send(
    { type: "PROMNEXA_CONSUME_CONTEXT" },
    { id: "testid", url: "https://chatgpt.com/", tab: { id: 7 } },
  );
  assert.equal(denied, undefined);
  await listeners.menu(
    { menuItemId: "promnexa-explain", selectionText: "selected evidence" },
    { id: 7, windowId: 1 },
  );
  assert.equal(windows.length, 1);
  assert.equal(windows[0].type, "popup");
  const id = new URL(windows[0].url).searchParams.get("context");
  assert.ok(id);
  const context = await send({ type: "PROMNEXA_CONSUME_CONTEXT", id });
  assert.equal(context.action.text, "selected evidence");
  assert.equal(context.action.sourceTabId, 7);
  assert.equal(
    (await send({ type: "PROMNEXA_CONSUME_CONTEXT", id })).action,
    null,
  );
  session.promnexa_context_expired = {
    id: "expired",
    action: "explain",
    text: "stale selection",
    timestamp: Date.now() - 120001,
    sourceTabId: 7,
  };
  assert.equal(
    (await send({ type: "PROMNEXA_CONSUME_CONTEXT", id: "expired" })).action,
    null,
  );
  assert.ok(
    messages.every((m) => !JSON.stringify(m).includes("test-legacy-key")),
  );
  console.log(
    "PASS: built background storage access policy, legacy migration, session credentials, secret-free settings bridge, sensitive/cost guards, explicit AI consent, visible context fallback, source tab binding, expiry and one-shot consumption.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
