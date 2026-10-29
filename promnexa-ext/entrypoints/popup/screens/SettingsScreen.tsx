import React from "react";
import type {
  UserSettings,
  Theme,
  Category,
  OptimizationMode,
} from "../../../lib/types";
import {
  getSettings,
  saveSettings,
  exportData,
  importData,
  clearAllData,
  getStorageUsage,
} from "../../../lib/storage";
import { getDefaultModel } from "../../../lib/ai-provider";
import type { Language } from "../../../lib/i18n";
import {
  Palette,
  Globe,
  Layout,
  Zap,
  Key,
  MonitorSmartphone,
  Keyboard,
  Database,
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Shield,
  Info,
} from "lucide-react";

interface SettingsScreenProps {
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  onLanguageChange?: (lang: Language) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  addToast,
  currentTheme,
  onThemeChange,
  onLanguageChange,
}) => {
  const [usage, setUsage] = React.useState<{
    bytes: number;
    budget: number;
  } | null>(null);
  React.useEffect(() => {
    getStorageUsage()
      .then(setUsage)
      .catch(() => {});
  }, []);
  const [settings, setSettings] = React.useState<UserSettings | null>(null);
  const [showAIConfig, setShowAIConfig] = React.useState(false);
  const [showDataSection, setShowDataSection] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await saveSettings({ [key]: value });
      setUsage(await getStorageUsage());
    } catch (error) {
      addToast((error as Error).message, "error");
      setSettings(await getSettings());
    }
  };

  const handleThemeChange = (theme: Theme) => {
    onThemeChange(theme);
    updateSetting("theme", theme);
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `promnexa-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Backup exported. API keys are excluded.", "success");
    } catch {
      addToast("Export failed", "error");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importData(text);
      addToast(`Imported ${result.saved} saved prompts`, "success");
      setSettings(await getSettings());
      setUsage(await getStorageUsage());
    } catch {
      addToast("Invalid import file", "error");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure? This will delete all your data.")) {
      try {
        await clearAllData();
        addToast("All data cleared", "info");
        setSettings(null);
        getSettings().then(setSettings);
      } catch {
        addToast("Failed to clear data", "error");
      }
    }
  };

  if (!settings) {
    return (
      <div className="screen-enter">
        <div className="skeleton" style={{ height: "200px", width: "100%" }} />
      </div>
    );
  }

  const themes: { key: Theme; label: string; icon: React.ReactNode }[] = [
    { key: "dark", label: "Dark", icon: <Moon /> },
    { key: "light", label: "Light", icon: <Sun /> },
    { key: "system", label: "System", icon: <Monitor /> },
  ];

  return (
    <div className="screen-enter">
      <h1 className="section-title">Settings</h1>
      <p className="section-subtitle">
        Customize Promnexa to your preferences.
      </p>

      <div
        style={{
          marginTop: "var(--space-4)",
          maxHeight: "420px",
          overflowY: "auto",
          paddingRight: "2px",
        }}
      >
        {/* Appearance */}
        <div className="settings-group">
          <div className="settings-group__title">Appearance</div>

          <div className="settings-item" style={{ cursor: "default" }}>
            <div className="settings-item__left">
              <div className="settings-item__icon">
                <Palette />
              </div>
              <div>
                <div className="settings-item__label">Theme</div>
                <div className="settings-item__desc">
                  Choose your preferred theme
                </div>
              </div>
            </div>
          </div>

          <div
            className="mode-selector"
            style={{
              marginTop: "var(--space-1)",
              marginBottom: "var(--space-2)",
            }}
          >
            {themes.map((t) => (
              <button
                key={t.key}
                className={`mode-btn ${currentTheme === t.key ? "mode-btn--active" : ""}`}
                onClick={() => handleThemeChange(t.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Defaults */}
        <div className="settings-group">
          <div className="settings-group__title">Defaults</div>

          <div className="settings-item" style={{ cursor: "default" }}>
            <div className="settings-item__left">
              <div className="settings-item__icon">
                <Layout />
              </div>
              <div>
                <div className="settings-item__label">Default Category</div>
              </div>
            </div>
            <div className="select-wrapper" style={{ width: "120px" }}>
              <select
                className="select"
                value={settings.defaultCategory}
                onChange={(e) =>
                  updateSetting("defaultCategory", e.target.value as Category)
                }
              >
                <option value="general">General</option>
                <option value="education">Education</option>
                <option value="coding">Coding</option>
                <option value="learning">Learning</option>
                <option value="daily">Daily Life</option>
                <option value="writing">Writing</option>
                <option value="research">Research</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          <div className="settings-item" style={{ cursor: "default" }}>
            <div className="settings-item__left">
              <div className="settings-item__icon">
                <Zap />
              </div>
              <div>
                <div className="settings-item__label">Default Mode</div>
              </div>
            </div>
            <div className="select-wrapper" style={{ width: "120px" }}>
              <select
                className="select"
                value={settings.defaultMode}
                onChange={(e) =>
                  updateSetting(
                    "defaultMode",
                    e.target.value as OptimizationMode,
                  )
                }
              >
                <option value="quick">Quick</option>
                <option value="deep">Deep</option>
                <option value="expert">Expert</option>
                <option value="beginner">Beginner</option>
              </select>
            </div>
          </div>

          <div className="settings-item" style={{ cursor: "default" }}>
            <div className="settings-item__left">
              <div className="settings-item__icon">
                <Globe />
              </div>
              <div>
                <div className="settings-item__label">Language</div>
              </div>
            </div>
            <div className="select-wrapper" style={{ width: "120px" }}>
              <select
                className="select"
                value={settings.language}
                onChange={(e) => {
                  const val = e.target.value as Language;
                  updateSetting("language", val);
                  if (onLanguageChange) onLanguageChange(val);
                }}
              >
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group__title">Keyboard shortcuts</div>
          <label className="input-group">
            Improve directly in chat
            <select
              className="select"
              value={settings.inlineShortcut}
              onChange={(e) => updateSetting("inlineShortcut", e.target.value)}
            >
              {["Alt+Shift+P", "Alt+Shift+O", "Ctrl+Alt+P"].map((key) => (
                <option key={key}>{key}</option>
              ))}
            </select>
          </label>
          <p className="section-subtitle">
            Open popup: Ctrl+Shift+P / Command+Shift+P by default. Change the
            browser command through your browser's extension shortcut settings
            (Chrome: chrome://extensions/shortcuts). The inline shortcut is
            separate.
          </p>
        </div>
        {/* AI Provider */}
        <div className="settings-group">
          <div className="settings-group__title">AI Provider (Optional)</div>

          <div
            className="settings-item"
            onClick={() => setShowAIConfig(!showAIConfig)}
          >
            <div className="settings-item__left">
              <div className="settings-item__icon">
                <Key />
              </div>
              <div>
                <div className="settings-item__label">API Configuration</div>
                <div className="settings-item__desc">
                  {settings.aiProvider
                    ? `${settings.aiProvider.provider} (${settings.aiProvider.model || getDefaultModel(settings.aiProvider.provider)})`
                    : "Not configured — using local optimizer"}
                </div>
              </div>
            </div>
            <div className="settings-item__right">
              <ChevronRight />
            </div>
          </div>

          {showAIConfig && (
            <div
              style={{
                padding: "var(--space-3)",
                background: "var(--bg-tertiary)",
                borderRadius: "var(--radius-md)",
                marginTop: "var(--space-1)",
              }}
            >
              <div className="input-group">
                <label className="input-label" htmlFor="ai-provider">
                  Provider
                </label>
                <select
                  className="select"
                  id="ai-provider"
                  value={settings.aiProvider?.provider || ""}
                  onChange={(e) => {
                    const p = e.target.value as
                      | "openai"
                      | "anthropic"
                      | "gemini";
                    if (p) {
                      updateSetting("aiProvider", {
                        provider: p,
                        apiKey:
                          settings.aiProvider?.provider === p
                            ? settings.aiProvider.apiKey
                            : "",
                        model:
                          settings.aiProvider?.provider === p
                            ? settings.aiProvider.model
                            : getDefaultModel(p),
                      });
                    } else {
                      updateSetting("aiProvider", null);
                    }
                  }}
                >
                  <option value="">None (use local optimizer)</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>

              {settings.aiProvider && (
                <>
                  <div className="input-group">
                    <label className="input-label" htmlFor="ai-key">
                      API Key
                    </label>
                    <input
                      className="input"
                      type="password"
                      id="ai-key"
                      placeholder="Enter your API key"
                      value={settings.aiProvider.apiKey}
                      onChange={(e) =>
                        updateSetting("aiProvider", {
                          ...settings.aiProvider!,
                          apiKey: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="ai-model">
                      Model
                    </label>
                    <input
                      className="input"
                      placeholder="e.g., gpt-4o, claude-3.5-sonnet"
                      id="ai-model"
                      value={settings.aiProvider.model}
                      onChange={(e) =>
                        updateSetting("aiProvider", {
                          ...settings.aiProvider!,
                          model: e.target.value,
                        })
                      }
                    />
                  </div>
                  <label className="input-group">
                    <input
                      type="checkbox"
                      checked={settings.aiProvider.rememberApiKey || false}
                      onChange={(e) =>
                        updateSetting("aiProvider", {
                          ...settings.aiProvider!,
                          rememberApiKey: e.target.checked,
                        })
                      }
                    />{" "}
                    Remember API key on this device
                  </label>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-tertiary)",
                      display: "flex",
                      gap: "4px",
                      alignItems: "flex-start",
                    }}
                  >
                    <Shield
                      style={{
                        width: "12px",
                        height: "12px",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />
                    Keys are session-only unless you choose Remember. Remembered
                    keys are unencrypted on this device; backups exclude them.
                    AI sends your prompt and key to the selected provider and
                    may incur charges.
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <label className="input-group">
          Maximum AI input characters
          <select
            className="select"
            value={settings.maxAiInputCharacters}
            onChange={(e) =>
              updateSetting("maxAiInputCharacters", Number(e.target.value))
            }
          >
            {[1000, 5000, 10000, 20000, 50000, 100000].map((n) => (
              <option key={n} value={n}>
                {n.toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        {/* Privacy */}
        <div className="settings-group">
          <div className="settings-group__title">Privacy & History</div>

          <div className="settings-item" style={{ cursor: "default" }}>
            <div className="settings-item__left">
              <div
                className="settings-item__icon"
                style={{
                  background: "var(--success-muted)",
                  color: "var(--success)",
                }}
              >
                <Shield />
              </div>
              <div>
                <div className="settings-item__label">Show History</div>
                <div className="settings-item__desc">
                  Save optimization history
                </div>
              </div>
            </div>
            <button
              className={`toggle ${settings.showHistory ? "toggle--active" : ""}`}
              onClick={() =>
                updateSetting("showHistory", !settings.showHistory)
              }
            />
          </div>
        </div>

        {/* Data Management */}
        <div className="settings-group">
          <div className="settings-group__title">Data</div>
          {usage && (
            <p className="section-subtitle" role="status">
              Local storage: {(usage.bytes / 1024 / 1024).toFixed(2)} MiB of{" "}
              {(usage.budget / 1024 / 1024).toFixed(0)} MiB budget. Saved
              prompts: 4 MiB; rolling history: 2 MiB. Saved items are never
              silently evicted.
            </p>
          )}

          <div className="settings-item" onClick={handleExport}>
            <div className="settings-item__left">
              <div className="settings-item__icon">
                <Download />
              </div>
              <div>
                <div className="settings-item__label">Export Data</div>
                <div className="settings-item__desc">
                  Download your data as JSON
                </div>
              </div>
            </div>
            <div className="settings-item__right">
              <ChevronRight />
            </div>
          </div>

          <div
            className="settings-item"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="settings-item__left">
              <div className="settings-item__icon">
                <Upload />
              </div>
              <div>
                <div className="settings-item__label">Import Data</div>
                <div className="settings-item__desc">
                  Restore from a backup file
                </div>
              </div>
            </div>
            <div className="settings-item__right">
              <ChevronRight />
            </div>
          </div>

          <div className="settings-item" onClick={handleClearAll}>
            <div className="settings-item__left">
              <div
                className="settings-item__icon"
                style={{
                  background: "var(--error-muted)",
                  color: "var(--error)",
                }}
              >
                <Trash2 />
              </div>
              <div>
                <div
                  className="settings-item__label"
                  style={{ color: "var(--error)" }}
                >
                  Clear All Data
                </div>
                <div className="settings-item__desc">
                  Delete all saved data permanently
                </div>
              </div>
            </div>
            <div className="settings-item__right">
              <ChevronRight />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="settings-group">
          <div className="settings-group__title">About</div>
          <div
            style={{
              padding: "var(--space-3)",
              fontSize: "var(--text-xs)",
              color: "var(--text-tertiary)",
              textAlign: "center",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            <strong style={{ color: "var(--text-secondary)" }}>Promnexa</strong>{" "}
            — AI Prompt Optimizer
            <br />
            Version 1.0.0
            <br />
            Turn ideas into better prompts.
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleImport}
      />
    </div>
  );
};
