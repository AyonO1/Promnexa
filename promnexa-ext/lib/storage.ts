import type { SavedPrompt, UserSettings, PromptTemplate } from './types';

const STORAGE_KEYS = {
  settings: 'promnexa_settings',
  saved: 'promnexa_saved',
  history: 'promnexa_history',
  onboarding: 'promnexa_onboarding',
} as const;

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  language: 'en',
  defaultCategory: 'general',
  defaultMode: 'quick',
  showHistory: true,
  aiProvider: null,
  websiteIntegrations: [
    { site: 'chatgpt.com', enabled: true },
    { site: 'claude.ai', enabled: true },
    { site: 'gemini.google.com', enabled: true },
    { site: 'perplexity.ai', enabled: true },
    { site: 'copilot.microsoft.com', enabled: true },
    { site: 'chat.deepseek.com', enabled: true },
    { site: 'grok.com', enabled: true },
  ],
  keyboardShortcut: 'Ctrl+Shift+P',
  onboardingComplete: false,
};

// ---- Settings ----
export async function getSettings(): Promise<UserSettings> {
  try {
    const result = (await browser.storage.local.get(STORAGE_KEYS.settings)) as Record<string, any>;
    const stored = result[STORAGE_KEYS.settings] as Partial<UserSettings> | undefined;
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...stored };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await browser.storage.local.set({ [STORAGE_KEYS.settings]: updated });
}

// ---- Saved Prompts ----
export async function getSavedPrompts(): Promise<SavedPrompt[]> {
  try {
    const result = (await browser.storage.local.get(STORAGE_KEYS.saved)) as Record<string, any>;
    return (result[STORAGE_KEYS.saved] as SavedPrompt[]) || [];
  } catch {
    return [];
  }
}

export async function savePrompt(prompt: SavedPrompt): Promise<void> {
  const saved = await getSavedPrompts();
  saved.unshift(prompt);
  // Limit to 500 saved prompts
  if (saved.length > 500) saved.length = 500;
  await browser.storage.local.set({ [STORAGE_KEYS.saved]: saved });
}

export async function deleteSavedPrompt(id: string): Promise<void> {
  const saved = await getSavedPrompts();
  const filtered = saved.filter(p => p.id !== id);
  await browser.storage.local.set({ [STORAGE_KEYS.saved]: filtered });
}

export async function toggleFavorite(id: string): Promise<void> {
  const saved = await getSavedPrompts();
  const index = saved.findIndex(p => p.id === id);
  if (index !== -1) {
    const item = saved[index];
    if (item) {
      item.isFavorite = !item.isFavorite;
      await browser.storage.local.set({ [STORAGE_KEYS.saved]: saved });
    }
  }
}

export async function getFavorites(): Promise<SavedPrompt[]> {
  const saved = await getSavedPrompts();
  return saved.filter(p => p.isFavorite);
}

// ---- History ----
export async function getHistory(): Promise<SavedPrompt[]> {
  try {
    const result = (await browser.storage.local.get(STORAGE_KEYS.history)) as Record<string, any>;
    return (result[STORAGE_KEYS.history] as SavedPrompt[]) || [];
  } catch {
    return [];
  }
}

export async function addToHistory(prompt: SavedPrompt): Promise<void> {
  const history = await getHistory();
  history.unshift(prompt);
  // Limit to 100 history entries
  if (history.length > 100) history.length = 100;
  await browser.storage.local.set({ [STORAGE_KEYS.history]: history });
}

export async function clearHistory(): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.history]: [] });
}

// ---- Export/Import ----
export async function exportData(): Promise<string> {
  const settings = await getSettings();
  const saved = await getSavedPrompts();
  const history = await getHistory();
  return JSON.stringify({ settings, saved, history, exportedAt: Date.now() }, null, 2);
}

export async function importData(jsonString: string): Promise<{ saved: number; history: number }> {
  const data = JSON.parse(jsonString);
  let savedCount = 0;
  let historyCount = 0;

  if (data.saved && Array.isArray(data.saved)) {
    await browser.storage.local.set({ [STORAGE_KEYS.saved]: data.saved });
    savedCount = data.saved.length;
  }

  if (data.history && Array.isArray(data.history)) {
    await browser.storage.local.set({ [STORAGE_KEYS.history]: data.history });
    historyCount = data.history.length;
  }

  if (data.settings) {
    await saveSettings(data.settings);
  }

  return { saved: savedCount, history: historyCount };
}

// ---- Clear All Data ----
export async function clearAllData(): Promise<void> {
  await browser.storage.local.clear();
}
