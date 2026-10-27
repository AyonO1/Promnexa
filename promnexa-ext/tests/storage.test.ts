import test from "node:test";
import assert from "node:assert/strict";

// Mock browser.storage.local for Node environment
const mockStorage: Record<string, any> = {};
(globalThis as any).browser = {
  storage: {
    local: {
      get: async (key: string | string[]) => {
        if (typeof key === "string") {
          return { [key]: mockStorage[key] };
        }
        const res: Record<string, any> = {};
        for (const k of key) res[k] = mockStorage[k];
        return res;
      },
      set: async (items: Record<string, any>) => {
        Object.assign(mockStorage, items);
      },
      clear: async () => {
        for (const k of Object.keys(mockStorage)) delete mockStorage[k];
      },
    },
  },
};

import {
  getSettings,
  saveSettings,
  getSavedPrompts,
  savePrompt,
  toggleFavorite,
  deleteSavedPrompt,
  addToHistory,
  getHistory,
  clearHistory,
  exportData,
  importData,
  clearAllData,
  getClients,
  saveClient,
  saveRevision,
  recordFeedback,
} from "../lib/storage.ts";

test("Storage - Get and Save Settings", async () => {
  const initial = await getSettings();
  assert.equal(initial.theme, "dark");

  await saveSettings({ theme: "light", language: "bn" });
  const updated = await getSettings();
  assert.equal(updated.theme, "light");
  assert.equal(updated.language, "bn");
});

test("Storage - Save, Retrieve, and Toggle Favorite Prompt", async () => {
  const prompt = {
    id: "test-prompt-1",
    original: "Hello world",
    optimized: "Hello world optimized",
    category: "general" as const,
    mode: "quick" as const,
    isFavorite: false,
    createdAt: Date.now(),
  };

  await savePrompt(prompt);
  let saved = await getSavedPrompts();
  assert.ok(saved.length > 0);
  assert.equal(saved[0]!.id, "test-prompt-1");
  assert.equal(saved[0]!.isFavorite, false);

  await toggleFavorite("test-prompt-1");
  saved = await getSavedPrompts();
  assert.equal(saved[0]!.isFavorite, true);

  await deleteSavedPrompt("test-prompt-1");
  saved = await getSavedPrompts();
  assert.equal(saved.length, 0);
});

test("Storage - History Addition and Clear", async () => {
  const histItem = {
    id: "hist-1",
    original: "Query",
    optimized: "Optimized Query",
    category: "coding" as const,
    mode: "deep" as const,
    isFavorite: false,
    createdAt: Date.now(),
  };

  await addToHistory(histItem);
  let hist = await getHistory();
  assert.equal(hist.length, 1);
  assert.equal(hist[0]!.id, "hist-1");

  await clearHistory();
  hist = await getHistory();
  assert.equal(hist.length, 0);
});

test("Storage - Export and Import Data Roundtrip", async () => {
  await savePrompt({
    id: "roundtrip-1",
    original: "A",
    optimized: "B",
    category: "education" as const,
    mode: "expert" as const,
    isFavorite: true,
    createdAt: Date.now(),
  });

  const exportedJson = await exportData();
  const parsed = JSON.parse(exportedJson);
  assert.ok(parsed.settings);
  assert.ok(Array.isArray(parsed.saved));

  await clearAllData();
  let emptySaved = await getSavedPrompts();
  assert.equal(emptySaved.length, 0);

  const importResult = await importData(exportedJson);
  assert.equal(importResult.saved, 1);

  const restored = await getSavedPrompts();
  assert.equal(restored[0]!.id, "roundtrip-1");
});

test("History disabled means no new history writes", async () => {
  await clearAllData();
  await saveSettings({ showHistory: false });
  await addToHistory({
    id: "private",
    original: "private",
    optimized: "private",
    category: "general",
    mode: "quick",
    isFavorite: false,
    createdAt: 1,
  });
  assert.equal((await getHistory()).length, 0);
  await saveSettings({ showHistory: true });
});
test("Exports exclude API keys without erasing the installed key", async () => {
  await saveSettings({
    aiProvider: {
      provider: "openai",
      apiKey: "test-secret-do-not-export",
      model: "test",
    },
  });
  const exported = await exportData();
  assert.ok(!exported.includes("test-secret-do-not-export"));
  assert.equal(
    (await getSettings()).aiProvider?.apiKey,
    "test-secret-do-not-export",
  );
});
test("Invalid import leaves all storage unchanged", async () => {
  const before = JSON.stringify(mockStorage);
  await assert.rejects(
    importData(JSON.stringify({ saved: [], settings: { theme: "invalid" } })),
  );
  assert.equal(JSON.stringify(mockStorage), before);
  await assert.rejects(importData(JSON.stringify({ saved: [{ id: "bad" }] })));
  assert.equal(JSON.stringify(mockStorage), before);
});
test("Backup limits, version and shape are enforced", async () => {
  for (const data of [
    null,
    [],
    {},
    { version: 99, saved: [] },
    { history: Array(101).fill({}) },
  ])
    await assert.rejects(importData(JSON.stringify(data)));
});
test("Legacy backup cannot import a secret", async () => {
  await importData(
    JSON.stringify({
      settings: {
        aiProvider: {
          provider: "openai",
          apiKey: "legacy-secret",
          model: "test",
        },
      },
    }),
  );
  assert.equal((await getSettings()).aiProvider?.apiKey, "");
});
test("Concurrent saves preserve every prompt", async () => {
  await clearAllData();
  await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      savePrompt({
        id: `concurrent-${i}`,
        original: "a",
        optimized: "b",
        category: "general",
        mode: "quick",
        isFavorite: true,
        createdAt: i,
      }),
    ),
  );
  assert.equal((await getSavedPrompts()).length, 20);
});
test("Client profiles round-trip and reject invalid data atomically", async () => {
  await saveClient({
    id: "client",
    name: "Example",
    audience: "Owners",
    offer: "Design",
    tone: "Friendly",
    constraints: "No claims",
  });
  const backup = await exportData();
  await clearAllData();
  await importData(backup);
  assert.equal((await getClients())[0]?.name, "Example");
  const before = JSON.stringify(mockStorage);
  await assert.rejects(
    importData(JSON.stringify({ saved: [], clients: [{ id: "missing" }] })),
  );
  assert.equal(JSON.stringify(mockStorage), before);
});
test("Revisions preserve the parent and store local feedback", async () => {
  const parent = (await getSavedPrompts())[0]!;
  await saveRevision(parent, "Revised content");
  const revised = (await getSavedPrompts())[0]!;
  assert.equal(revised.parentId, parent.id);
  assert.equal(revised.isFavorite, true);
  assert.ok((await getSavedPrompts()).some((p) => p.id === parent.id));
  await recordFeedback(revised.id, "useful");
  assert.equal((await getSavedPrompts())[0]?.feedback, "useful");
});
