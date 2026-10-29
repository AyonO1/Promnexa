import {
  restrictStorageAccess,
  readCredential,
  writeCredential,
  clearCredentials,
} from "./credentials.ts";
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
const MODES = ["quick", "deep", "expert", "beginner"];
const DEFAULT_SETTINGS: UserSettings = {
  theme: "dark",
  language: "en",
  defaultCategory: "general",
  defaultMode: "quick",
  showHistory: false,
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
  inlineShortcut: "Alt+Shift+P",
  maxAiInputCharacters: 20000,
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
        valid = MODES.includes(value) || value === "custom";
        break;
      case "showHistory":
      case "onboardingComplete":
        valid = typeof value === "boolean";
        break;
      case "inlineShortcut":
        valid = ["Alt+Shift+P", "Alt+Shift+O", "Ctrl+Alt+P"].includes(value);
        break;
      case "maxAiInputCharacters":
        valid = Number.isInteger(value) && value >= 1000 && value <= 100000;
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
            str(value.model, 150) &&
            (value.rememberApiKey === undefined ||
              typeof value.rememberApiKey === "boolean"));
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
    out[key] =
      key === "aiProvider" && value
        ? {
            provider: value.provider,
            model: value.model,
            apiKey: value.apiKey,
            rememberApiKey: value.rememberApiKey === true,
          }
        : key === "websiteIntegrations"
          ? value.map((i: any) => ({ site: i.site, enabled: i.enabled }))
          : key === "defaultMode" && value === "custom"
            ? "quick"
            : value;
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
      (!MODES.includes(p.mode) && p.mode !== "custom") ||
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
      mode: p.mode === "custom" ? "quick" : p.mode,
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
  let settings: UserSettings;
  try {
    settings = {
      ...structuredClone(DEFAULT_SETTINGS),
      ...validateSettings(result[STORAGE_KEYS.settings] || {}),
    };
  } catch {
    settings = structuredClone(DEFAULT_SETTINGS);
  }
  if (settings.aiProvider) {
    const config = settings.aiProvider;
    settings.aiProvider = {
      ...config,
      apiKey: (await readCredential(config.provider)) || config.apiKey,
      rememberApiKey: config.rememberApiKey ?? false,
    };
  }
  return settings;
}
export function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  const valid = validateSettings(settings);
  return mutate(async () => {
    const next = { ...(await getSettings()), ...valid };
    await writeCredential(next.aiProvider);
    const publicSettings = {
      ...next,
      aiProvider: next.aiProvider ? { ...next.aiProvider, apiKey: "" } : null,
    };
    await browser.storage.local.set({
      [STORAGE_KEYS.settings]: publicSettings,
    });
  });
}
export async function initializeStoragePrivacy(): Promise<void> {
  await restrictStorageAccess();
  const data = await browser.storage.local.get(STORAGE_KEYS.settings);
  if ((data[STORAGE_KEYS.settings] as any)?.aiProvider?.apiKey) {
    await saveSettings({});
    await browser.storage.local.set({ promnexa_credential_notice: true });
  }
}
export async function getPublicSettings() {
  const s = await getSettings();
  return {
    websiteIntegrations: s.websiteIntegrations,
    defaultMode: s.defaultMode,
    inlineShortcut: s.inlineShortcut,
    language: s.language,
    hasAiProvider: !!s.aiProvider?.apiKey,
    maxAiInputCharacters: s.maxAiInputCharacters,
  };
}
export const STORAGE_BUDGET = {
  saved: 4 * 1024 * 1024,
  history: 2 * 1024 * 1024,
  clients: 2 * 1024 * 1024,
  total: 8 * 1024 * 1024,
};
export const storedBytes = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value)).length;
function enforceBudget(value: unknown, limit: number, label: string) {
  if (storedBytes(value) > limit)
    throw new Error(
      `${label} storage budget exceeded. Export and remove older items before saving.`,
    );
}
export async function getStorageUsage() {
  if (browser.storage.local.getBytesInUse) {
    const [bytes, saved, history] = await Promise.all([
      browser.storage.local.getBytesInUse(null),
      browser.storage.local.getBytesInUse(STORAGE_KEYS.saved),
      browser.storage.local.getBytesInUse(STORAGE_KEYS.history),
    ]);
    return { bytes, budget: STORAGE_BUDGET.total, saved, history };
  }
  const all = await browser.storage.local.get(null);
  return {
    bytes: storedBytes(all),
    budget: STORAGE_BUDGET.total,
    saved: storedBytes(all[STORAGE_KEYS.saved] || []),
    history: storedBytes(all[STORAGE_KEYS.history] || []),
  };
}

async function readPrompts(key: string, limit: number): Promise<SavedPrompt[]> {
  const result = await browser.storage.local.get(key);
  return validatePrompts(result[key] || [], limit);
}
export const getSavedPrompts = () => readPrompts(STORAGE_KEYS.saved, 500);
export const getHistory = () => readPrompts(STORAGE_KEYS.history, 100);
export function savePrompt(prompt: SavedPrompt): Promise<void> {
  prompt = validatePrompts([prompt], 1)[0]!;
  return mutate(async () => {
    const saved = await getSavedPrompts();
    const next = [prompt, ...saved.filter((p) => p.id !== prompt.id)];
    if (next.length > 500)
      throw new Error(
        "Saved prompt limit reached. Export and remove older items first.",
      );
    enforceBudget(next, STORAGE_BUDGET.saved, "Saved prompts");
    await browser.storage.local.set({ [STORAGE_KEYS.saved]: next });
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
export function addToHistory(
  prompt: SavedPrompt,
): Promise<{ saved: boolean; evicted: number }> {
  validatePrompts([prompt], 1);
  return mutate(async () => {
    if (!(await getSettings()).showHistory) return { saved: false, evicted: 0 };
    enforceBudget([prompt], STORAGE_BUDGET.history, "History entry");
    const old = (await getHistory()).filter((p) => p.id !== prompt.id);
    const next = [prompt, ...old].slice(0, 100);
    while (storedBytes(next) > STORAGE_BUDGET.history) next.pop();
    await browser.storage.local.set({ [STORAGE_KEYS.history]: next });
    return { saved: true, evicted: Math.max(0, old.length + 1 - next.length) };
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
    enforceBudget(next, STORAGE_BUDGET.clients, "Client profiles");
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
    settings.aiProvider = {
      ...settings.aiProvider,
      apiKey: "",
      rememberApiKey: false,
    };
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
  if (new TextEncoder().encode(jsonString).length > 12 * 1024 * 1024)
    throw new Error("Backup must be smaller than 12 MiB.");
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
    settings.aiProvider = {
      ...settings.aiProvider,
      apiKey: "",
      rememberApiKey: false,
    };
  if (saved) enforceBudget(saved, STORAGE_BUDGET.saved, "Saved prompts");
  if (history) enforceBudget(history, STORAGE_BUDGET.history, "History");
  if (clients)
    enforceBudget(clients, STORAGE_BUDGET.clients, "Client profiles");
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
    if (settings && "aiProvider" in settings) await writeCredential(null);
    await browser.storage.local.set(updates);
  });
  return { saved: saved?.length || 0, history: history?.length || 0 };
}
export const clearAllData = () =>
  mutate(async () => {
    await clearCredentials();
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
