import type { SavedPrompt, UserSettings, ClientProfile } from "./types";

const STORAGE_KEYS = {
  settings: "promnexa_settings",
  saved: "promnexa_saved",
  history: "promnexa_history",
  clients: "promnexa_clients",
} as const;
const CATEGORIES = [
  "education",
  "coding",
  "learning",
  "daily",
  "writing",
  "research",
  "business",
  "general",
];
const MODES = ["quick", "deep", "expert", "beginner", "custom"];
const DEFAULT_SETTINGS: UserSettings = {
  theme: "dark",
  language: "en",
  defaultCategory: "general",
  defaultMode: "quick",
  showHistory: true,
  aiProvider: null,
  websiteIntegrations: [
    "chatgpt.com",
    "claude.ai",
    "gemini.google.com",
    "perplexity.ai",
    "copilot.microsoft.com",
    "chat.deepseek.com",
    "grok.com",
  ].map((site) => ({ site, enabled: true })),
  keyboardShortcut: "Ctrl+Shift+P",
  onboardingComplete: false,
};
const object = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max = 100000): v is string =>
  typeof v === "string" && v.length <= max;
function validateSettings(v: unknown): Partial<UserSettings> {
  if (!object(v)) throw new Error("Settings must be an object.");
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(v)) {
    let valid = false;
    switch (key) {
      case "theme":
        valid = ["dark", "light", "system"].includes(value);
        break;
      case "language":
        valid = ["en", "bn"].includes(value);
        break;
      case "defaultCategory":
        valid = CATEGORIES.includes(value);
        break;
      case "defaultMode":
        valid = MODES.includes(value);
        break;
      case "showHistory":
      case "onboardingComplete":
        valid = typeof value === "boolean";
        break;
      case "keyboardShortcut":
        valid = str(value, 80);
        break;
      case "aiProvider":
        valid =
          value === null ||
          (object(value) &&
            ["openai", "anthropic", "gemini"].includes(value.provider) &&
            str(value.apiKey, 2048) &&
            str(value.model, 150));
        break;
      case "websiteIntegrations":
        valid =
          Array.isArray(value) &&
          value.length <= 20 &&
          value.every(
            (x) =>
              object(x) && str(x.site, 100) && typeof x.enabled === "boolean",
          );
        break;
      default:
        continue;
    }
    if (!valid) throw new Error(`Invalid setting: ${key}`);
    out[key] = value;
  }
  return out as Partial<UserSettings>;
}
function validatePrompts(v: unknown, limit: number): SavedPrompt[] {
  if (!Array.isArray(v) || v.length > limit)
    throw new Error(`Backup exceeds ${limit} prompts or is not an array.`);
  const ids = new Set<string>();
  return v.map((p) => {
    if (
      !object(p) ||
      !str(p.id, 100) ||
      !p.id ||
      ids.has(p.id) ||
      !str(p.original) ||
      !str(p.optimized) ||
      !CATEGORIES.includes(p.category) ||
      !MODES.includes(p.mode) ||
      typeof p.isFavorite !== "boolean" ||
      !Number.isFinite(p.createdAt) ||
      p.createdAt < 0
    )
      throw new Error("Invalid or duplicate prompt in backup.");
    ids.add(p.id);
    const prompt: SavedPrompt = {
      id: p.id,
      original: p.original,
      optimized: p.optimized,
      category: p.category,
      mode: p.mode,
      isFavorite: p.isFavorite,
      createdAt: p.createdAt,
    };
    if (p.parentId !== undefined) {
      if (!str(p.parentId, 100)) throw new Error("Invalid prompt version.");
      prompt.parentId = p.parentId;
    }
    if (p.feedback !== undefined) {
      if (!["useful", "needs-work"].includes(p.feedback))
        throw new Error("Invalid feedback.");
      prompt.feedback = p.feedback;
    }
    return prompt;
  });
}
function validateClients(v: unknown): ClientProfile[] {
  if (!Array.isArray(v) || v.length > 100)
    throw new Error("Invalid client profiles.");
  const ids = new Set<string>();
  return v.map((c) => {
    if (
      !object(c) ||
      !str(c.id, 100) ||
      !c.id ||
      ids.has(c.id) ||
      !str(c.name, 120) ||
      !c.name.trim() ||
      !["audience", "offer", "tone", "constraints"].every((k) =>
        str(c[k], 4000),
      )
    )
      throw new Error("Invalid client profile.");
    ids.add(c.id);
    return {
      id: c.id,
      name: c.name,
      audience: c.audience,
      offer: c.offer,
      tone: c.tone,
      constraints: c.constraints,
    };
  });
}
// Serialize read/modify/write operations in this extension context.
let pending: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: () => Promise<T>): Promise<T> {
  const next = pending.then(fn, fn);
  pending = next.catch(() => {});
  return next;
}
export async function getSettings(): Promise<UserSettings> {
  const result = await browser.storage.local.get(STORAGE_KEYS.settings);
  try {
    return {
      ...structuredClone(DEFAULT_SETTINGS),
      ...validateSettings(result[STORAGE_KEYS.settings] || {}),
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}
export function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  const valid = validateSettings(settings);
  return mutate(async () => {
    const current = await getSettings();
    await browser.storage.local.set({
      [STORAGE_KEYS.settings]: { ...current, ...valid },
    });
  });
}
async function readPrompts(key: string, limit: number): Promise<SavedPrompt[]> {
  const result = await browser.storage.local.get(key);
  return validatePrompts(result[key] || [], limit);
}
export const getSavedPrompts = () => readPrompts(STORAGE_KEYS.saved, 500);
export const getHistory = () => readPrompts(STORAGE_KEYS.history, 100);
export function savePrompt(prompt: SavedPrompt): Promise<void> {
  validatePrompts([prompt], 1);
  return mutate(async () => {
    const saved = await getSavedPrompts();
    await browser.storage.local.set({
      [STORAGE_KEYS.saved]: [
        prompt,
        ...saved.filter((p) => p.id !== prompt.id),
      ].slice(0, 500),
    });
  });
}
export function deleteSavedPrompt(id: string): Promise<void> {
  return mutate(async () => {
    await browser.storage.local.set({
      [STORAGE_KEYS.saved]: (await getSavedPrompts()).filter(
        (p) => p.id !== id,
      ),
    });
  });
}
export function toggleFavorite(id: string): Promise<void> {
  return mutate(async () => {
    const saved = await getSavedPrompts();
    await browser.storage.local.set({
      [STORAGE_KEYS.saved]: saved.map((p) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p,
      ),
    });
  });
}
export async function getFavorites(): Promise<SavedPrompt[]> {
  return (await getSavedPrompts()).filter((p) => p.isFavorite);
}
export function addToHistory(prompt: SavedPrompt): Promise<void> {
  validatePrompts([prompt], 1);
  return mutate(async () => {
    if (!(await getSettings()).showHistory) return;
    await browser.storage.local.set({
      [STORAGE_KEYS.history]: [
        prompt,
        ...(await getHistory()).filter((p) => p.id !== prompt.id),
      ].slice(0, 100),
    });
  });
}
export const clearHistory = () =>
  mutate(async () => {
    await browser.storage.local.set({ [STORAGE_KEYS.history]: [] });
  });
export async function getClients(): Promise<ClientProfile[]> {
  const data = await browser.storage.local.get(STORAGE_KEYS.clients);
  return validateClients(data[STORAGE_KEYS.clients] || []);
}
export function saveClient(client: ClientProfile): Promise<void> {
  validateClients([client]);
  return mutate(async () => {
    const clients = await getClients();
    const next = [client, ...clients.filter((c) => c.id !== client.id)];
    validateClients(next);
    await browser.storage.local.set({ [STORAGE_KEYS.clients]: next });
  });
}
export const deleteClient = (id: string) =>
  mutate(async () => {
    await browser.storage.local.set({
      [STORAGE_KEYS.clients]: (await getClients()).filter((c) => c.id !== id),
    });
  });
export async function exportData(): Promise<string> {
  const settings = await getSettings();
  // Secrets never belong in portable backups.
  if (settings.aiProvider)
    settings.aiProvider = { ...settings.aiProvider, apiKey: "" };
  return JSON.stringify(
    {
      version: 2,
      settings,
      saved: await getSavedPrompts(),
      history: await getHistory(),
      clients: await getClients(),
      exportedAt: Date.now(),
    },
    null,
    2,
  );
}
export async function importData(
  jsonString: string,
): Promise<{ saved: number; history: number }> {
  if (jsonString.length > 5_000_000)
    throw new Error("Backup must be smaller than 5 MB.");
  const data: unknown = JSON.parse(jsonString);
  if (
    !object(data) ||
    !["saved", "history", "settings", "clients"].some((k) => k in data)
  )
    throw new Error("Not a Promnexa backup.");
  if (data.version !== undefined && ![1, 2].includes(data.version))
    throw new Error("Unsupported backup version.");
  // Validate everything before writing anything.
  const saved =
    data.saved === undefined ? undefined : validatePrompts(data.saved, 500);
  const history =
    data.history === undefined ? undefined : validatePrompts(data.history, 100);
  const clients =
    data.clients === undefined ? undefined : validateClients(data.clients);
  const settings =
    data.settings === undefined ? undefined : validateSettings(data.settings);
  if (settings?.aiProvider)
    settings.aiProvider = { ...settings.aiProvider, apiKey: "" };
  await mutate(async () => {
    const updates: Record<string, unknown> = {};
    if (saved) updates[STORAGE_KEYS.saved] = saved;
    if (history) updates[STORAGE_KEYS.history] = history;
    if (clients) updates[STORAGE_KEYS.clients] = clients;
    if (settings)
      updates[STORAGE_KEYS.settings] = {
        ...(await getSettings()),
        ...settings,
      };
    await browser.storage.local.set(updates);
  });
  return { saved: saved?.length || 0, history: history?.length || 0 };
}
export const clearAllData = () =>
  mutate(async () => {
    await browser.storage.local.clear();
  });

export function recordFeedback(
  id: string,
  feedback: "useful" | "needs-work",
): Promise<void> {
  return mutate(async () => {
    const saved = await getSavedPrompts(),
      history = await getHistory();
    const update = (items: SavedPrompt[]) =>
      items.map((p) => (p.id === id ? { ...p, feedback } : p));
    await browser.storage.local.set({
      [STORAGE_KEYS.saved]: update(saved),
      [STORAGE_KEYS.history]: update(history),
    });
  });
}
export async function saveRevision(
  parent: SavedPrompt,
  optimized: string,
): Promise<void> {
  await savePrompt({
    ...parent,
    id: crypto.randomUUID(),
    parentId: parent.id,
    optimized,
    isFavorite: true,
    feedback: undefined,
    createdAt: Date.now(),
  });
}
