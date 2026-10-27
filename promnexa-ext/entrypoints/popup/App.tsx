import React from "react";
import type { Category, Screen, Theme, UserSettings } from "../../lib/types";
import { getSettings, saveSettings } from "../../lib/storage";
import { getT, type Language } from "../../lib/i18n";
import { Logo } from "./components/Logo";
import { Onboarding } from "./components/Onboarding";
import { useToast } from "./components/Toast";
import { OptimizeScreen } from "./screens/OptimizeScreen";
const LibraryScreen = React.lazy(() =>
  import("./screens/LibraryScreen").then((module) => ({
    default: module.LibraryScreen,
  })),
);
import { SavedScreen } from "./screens/SavedScreen";
import { WorkflowsScreen } from "./screens/WorkflowsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { Wand2, BookOpen, Heart, Settings, Sun, Moon } from "lucide-react";

function getSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", resolvedTheme);
}

export default function App() {
  const [screen, setScreen] = React.useState<Screen>("optimize");
  const [theme, setTheme] = React.useState<Theme>("dark");
  const [language, setLanguage] = React.useState<Language>("en");
  const [settings, setSettings] = React.useState<UserSettings | null>(null);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [initialPrompt, setInitialPrompt] = React.useState<{
    text: string;
    category?: Category;
  } | null>(null);
  const { addToast, ToastContainer } = useToast();

  const t = getT(language);

  // Load settings on mount
  React.useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setTheme(s.theme);
      setLanguage(s.language || "en");
      applyTheme(s.theme);

      if (!s.onboardingComplete) {
        setShowOnboarding(true);
      }
    });
  }, []);

  React.useEffect(() => {
    const listener = (changes: Record<string, unknown>, area: string) => {
      if (area === "local" && changes.promnexa_settings) {
        getSettings().then((s) => {
          setSettings(s);
          setTheme(s.theme);
          setLanguage(s.language);
        });
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, []);

  // Apply theme on change
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    await saveSettings({ onboardingComplete: true });
    const s = await getSettings();
    setSettings(s);
  };

  const toggleThemeQuick = () => {
    const resolvedCurrent = theme === "system" ? getSystemTheme() : theme;
    const next = resolvedCurrent === "dark" ? "light" : "dark";
    handleThemeChange(next);
    saveSettings({ theme: next });
  };

  const handleUsePrompt = (text: string, category?: Category) => {
    setInitialPrompt({ text, category });
    setScreen("optimize");
  };

  if (!settings)
    return (
      <div className="app-shell" role="status">
        Loading…
      </div>
    );

  if (showOnboarding) {
    return (
      <div
        className="app-shell"
        data-theme={theme === "system" ? getSystemTheme() : theme}
      >
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const navItems: { key: Screen; label: string; icon: React.ReactNode }[] = [
    { key: "optimize", label: t.navOptimize, icon: <Wand2 /> },
    {
      key: "workflows",
      label: language === "bn" ? "কাজ" : "Workflows",
      icon: <Wand2 />,
    },
    { key: "library", label: t.navLibrary, icon: <BookOpen /> },
    { key: "saved", label: t.navSaved, icon: <Heart /> },
    { key: "settings", label: t.navSettings, icon: <Settings /> },
  ];

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__logo">
            <Logo size={24} />
          </div>
          <span className="app-header__title">{t.appTitle}</span>
        </div>
        <div className="app-header__actions">
          <button
            className="icon-btn"
            onClick={toggleThemeQuick}
            title={`Switch to ${(theme === "system" ? getSystemTheme() : theme) === "dark" ? "light" : "dark"} mode`}
          >
            {(theme === "system" ? getSystemTheme() : theme) === "dark" ? (
              <Sun />
            ) : (
              <Moon />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content" key={screen}>
        {screen === "optimize" && (
          <OptimizeScreen
            addToast={addToast}
            defaultCategory={settings?.defaultCategory || "general"}
            defaultMode={settings?.defaultMode || "quick"}
            aiProvider={settings?.aiProvider || null}
            language={language}
            initialInput={initialPrompt?.text}
            initialCategory={initialPrompt?.category}
            onClearInitial={() => setInitialPrompt(null)}
          />
        )}
        {screen === "workflows" && (
          <WorkflowsScreen
            language={language}
            addToast={addToast}
            onUsePrompt={handleUsePrompt}
          />
        )}
        {screen === "library" && (
          <React.Suspense fallback={<p role="status">Loading templates…</p>}>
            <LibraryScreen
              addToast={addToast}
              onUseTemplate={handleUsePrompt}
              language={language}
            />
          </React.Suspense>
        )}
        {screen === "saved" && (
          <SavedScreen
            addToast={addToast}
            onUsePrompt={handleUsePrompt}
            language={language}
          />
        )}
        {screen === "settings" && (
          <SettingsScreen
            addToast={addToast}
            currentTheme={theme}
            onThemeChange={handleThemeChange}
            onLanguageChange={handleLanguageChange}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="app-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${screen === item.key ? "nav-item--active" : ""}`}
            onClick={() => setScreen(item.key)}
          >
            {item.icon}
            <span className="nav-item__label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
