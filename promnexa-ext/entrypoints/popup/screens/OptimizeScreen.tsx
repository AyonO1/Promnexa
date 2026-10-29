import { analyzePrompt, textDifference } from "../../../lib/prompt-analysis";
import {
  scanSensitiveInfo,
  redactSensitiveInfo,
  estimateTokens,
} from "../../../lib/sensitive-info";
import React from "react";
import type {
  Category,
  OptimizationMode,
  OptimizationResult,
  ComparisonView,
  AIProviderConfig,
} from "../../../lib/types";
import {
  optimizePrompt,
  detectCategory,
  CATEGORY_INFO,
  generateId,
  copyToClipboard,
} from "../../../lib/optimizer";
import { savePrompt, addToHistory } from "../../../lib/storage";
import { getT, type Language } from "../../../lib/i18n";
import {
  Sparkles,
  X,
  Copy,
  Check,
  Heart,
  RotateCcw,
  Zap,
  GraduationCap,
  BookOpen,
  Code2,
  Lightbulb,
  Calendar,
  Edit3,
  ArrowRight,
  Bot,
  Cpu,
  Clipboard,
  ExternalLink,
} from "lucide-react";

interface OptimizeScreenProps {
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  defaultCategory: Category;
  defaultMode: OptimizationMode;
  aiProvider?: AIProviderConfig | null;
  language?: Language;
  initialInput?: string;
  initialCategory?: Category;
  onClearInitial?: () => void;
  maxAiInputCharacters?: number;
}

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  education: <GraduationCap />,
  coding: <Code2 />,
  learning: <Lightbulb />,
  daily: <Calendar />,
  writing: <BookOpen />,
  research: <BookOpen />,
  business: <BookOpen />,
  general: <Sparkles />,
};

const MODES: {
  key: OptimizationMode;
  labelKey: "quick" | "deep" | "expert" | "beginner";
}[] = [
  { key: "quick", labelKey: "quick" },
  { key: "deep", labelKey: "deep" },
  { key: "expert", labelKey: "expert" },
  { key: "beginner", labelKey: "beginner" },
];

const EXAMPLE_PROMPTS = [
  "Teach me machine learning",
  "Fix my React code",
  "Write a professional email to my boss",
  "Plan a 5-day trip to Japan",
  "Create a study guide for calculus",
  "Help me prepare for a coding interview",
];

export const OptimizeScreen: React.FC<OptimizeScreenProps> = ({
  addToast,
  defaultCategory,
  defaultMode,
  aiProvider,
  language = "en",
  initialInput,
  initialCategory,
  onClearInitial,
  maxAiInputCharacters = 20000,
}) => {
  const t = getT(language);
  const hasAiConfig = Boolean(
    aiProvider && aiProvider.apiKey && aiProvider.apiKey.trim().length > 0,
  );

  const [input, setInput] = React.useState(initialInput || "");
  const [autoCategory, setAutoCategory] = React.useState(!initialCategory);
  const [category, setCategory] = React.useState<Category>(
    initialCategory || defaultCategory,
  );
  const [mode, setMode] = React.useState<OptimizationMode>(defaultMode);
  const [engine, setEngine] = React.useState<"local" | "ai">(
    hasAiConfig ? "ai" : "local",
  );
  const [result, setResult] = React.useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [comparisonView, setComparisonView] =
    React.useState<ComparisonView>("optimized");
  const [copied, setCopied] = React.useState(false);
  const requestRef = React.useRef(0);
  const busyRef = React.useRef(false);
  React.useEffect(
    () => () => {
      requestRef.current++;
    },
    [],
  );
  React.useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);
  React.useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);
  React.useEffect(() => {
    setEngine(hasAiConfig ? "ai" : "local");
  }, [hasAiConfig]);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const analysis = React.useMemo(() => analyzePrompt(input), [input]);
  const findings = React.useMemo(() => scanSensitiveInfo(input), [input]);
  const difference = result
    ? textDifference(result.original, result.optimized)
    : null;
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // If initial input changed from props, update input
  React.useEffect(() => {
    if (initialInput) {
      setInput(initialInput);
      if (initialCategory) {
        setCategory(initialCategory);
        setAutoCategory(false);
      }
      if (onClearInitial) onClearInitial();
    }
  }, [initialInput, initialCategory, onClearInitial]);

  // Read context action from storage on mount (from context menu or floating button)
  React.useEffect(() => {
    const checkContextAction = async () => {
      if (
        new URLSearchParams(location.search).get("error") ===
        "selection-too-long"
      ) {
        addToast(
          "Selection exceeds 100,000 characters. Select a smaller passage; no text was truncated.",
          "error",
        );
        return;
      }
      try {
        if (typeof browser !== "undefined" && browser.storage?.local) {
          const response = await browser.runtime.sendMessage({
            type: "PROMNEXA_CONSUME_CONTEXT",
            id:
              new URLSearchParams(location.search).get("context") || undefined,
          });
          const data = response?.action as {
            action?: string;
            text?: string;
          } | null;
          if (data && data.text) {
            const rawText =
              data.action === "explain"
                ? `Explain the following selection clearly:\n\n${data.text}`
                : data.action === "summarize"
                  ? `Summarize the following selection concisely:\n\n${data.text}`
                  : data.action === "create-prompt"
                    ? `Create a useful prompt based on this selection, preserving its facts:\n\n${data.text}`
                    : data.text;
            setInput(rawText);
            let targetCategory: Category = defaultCategory;
            let targetMode: OptimizationMode = defaultMode;

            if (data.action === "explain") {
              targetCategory = "learning";
              targetMode = "deep";
            } else if (data.action === "summarize") {
              targetCategory = "general";
              targetMode = "quick";
            } else if (data.action === "create-prompt") {
              targetCategory = "general";
              targetMode = "expert";
            } else {
              const detected = detectCategory(rawText);
              if (detected !== "general") targetCategory = detected;
            }

            setCategory(targetCategory);
            setMode(targetMode);

            // Clean up context action so it doesn't run again

            // Run optimization
            executeOptimization(rawText, targetCategory, targetMode, "local");
          }
        }
      } catch (err) {
        console.error("Error checking context action:", err);
      }
    };

    checkContextAction();
  }, []);

  // Auto-detect category as user types
  React.useEffect(() => {
    if (autoCategory && input.length > 2) {
      const detected = detectCategory(input);
      if (detected !== "general") {
        setCategory(detected);
      }
    }
  }, [input, autoCategory]);

  const executeOptimization = async (
    textToOptimize: string,
    cat: Category,
    m: OptimizationMode,
    preferredEngine?: "local" | "ai",
  ) => {
    if (textToOptimize.length > 100000) {
      addToast("Prompt must be at most 100,000 characters", "error");
      return;
    }
    if (!textToOptimize.trim()) {
      addToast("Please enter a prompt to optimize", "error");
      return;
    }

    if (busyRef.current) return;
    busyRef.current = true;
    const request = ++requestRef.current;
    setIsOptimizing(true);
    const activeEngine = preferredEngine || engine;

    try {
      let optResult: OptimizationResult;

      if (activeEngine === "ai" && aiProvider?.apiKey) {
        try {
          if (textToOptimize.length > maxAiInputCharacters)
            throw new Error(
              "AI input limit exceeded. Shorten the prompt or change the limit in Settings.",
            );
          const sensitive = scanSensitiveInfo(textToOptimize);
          if (
            sensitive.length &&
            !confirm(
              "This prompt may contain " +
                [...new Set(sensitive.map((f) => f.kind))].join(", ") +
                ". Send it to " +
                aiProvider.provider +
                "? Cancel to keep it local.",
            )
          )
            throw new Error("Sensitive data sharing was declined.");
          if (import.meta.env.FIREFOX) {
            const granted = await browser.permissions.request({
              data_collection: [
                "authenticationInfo",
                "websiteContent",
                "personalCommunications",
              ],
            } as any);
            if (!granted) throw new Error("AI data sharing was declined");
          }
          const response = await browser.runtime.sendMessage({
            type: "PROMNEXA_AI",
            sensitiveConsent: sensitive.length > 0,
            text: textToOptimize,
            category: cat,
            mode: m,
          });
          if (!response?.result)
            throw new Error(response?.error || "AI request failed");
          optResult = response.result;
        } catch (aiErr: any) {
          if (request !== requestRef.current) return;
          console.warn(
            "AI optimization failed, falling back to local engine:",
            aiErr,
          );
          addToast(
            `AI Error: ${aiErr.message || "Request failed"}. Using local engine.`,
            "info",
          );
          optResult = {
            ...optimizePrompt(textToOptimize, cat, m),
            fallbackReason: aiErr.message || "AI unavailable",
          };
        }
      } else {
        // Local engine
        await new Promise((resolve) => setTimeout(resolve, 300));
        optResult = optimizePrompt(textToOptimize, cat, m);
      }

      if (request !== requestRef.current) return;
      setResult(optResult);
      setComparisonView("optimized");

      // Save to history
      try {
        const history = await addToHistory({
          id: generateId(),
          original: textToOptimize,
          optimized: optResult.optimized,
          category: cat,
          mode: m,
          isFavorite: false,
          createdAt: Date.now(),
        });
        if (history.evicted)
          addToast(
            `History storage budget reached; ${history.evicted} older entries were removed.`,
            "info",
          );
      } catch {
        addToast(
          "Result ready, but history could not be saved. Export or clear older history.",
          "info",
        );
      }
    } catch (err: any) {
      addToast(err.message || "Optimization failed", "error");
    } finally {
      if (request === requestRef.current) {
        busyRef.current = false;
        setIsOptimizing(false);
      }
    }
  };

  const handleOptimize = () => {
    executeOptimization(input, category, mode);
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await copyToClipboard(result.optimized);
      setCopied(true);
      addToast(t.copied, "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast("Failed to copy", "error");
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await savePrompt({
        id: generateId(),
        original: result.original,
        optimized: result.optimized,
        category: result.category,
        mode: result.mode,
        isFavorite: true,
        createdAt: Date.now(),
      });
      addToast(t.saved, "success");
    } catch {
      addToast("Failed to save", "error");
    }
  };

  const handleClear = () => {
    requestRef.current++;
    busyRef.current = false;
    setIsOptimizing(false);
    setInput("");
    setResult(null);
    textareaRef.current?.focus();
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    const detected = detectCategory(example);
    if (detected !== "general") setCategory(detected);
    textareaRef.current?.focus();
  };

  const handleEditInInput = () => {
    if (!result) return;
    setInput(result.optimized);
    setResult(null);
    textareaRef.current?.focus();
    addToast("Prompt loaded into editor", "info");
  };

  const handleQuickRefine = (newMode: OptimizationMode) => {
    setMode(newMode);
    executeOptimization(input, category, newMode);
  };

  const handleAddExamples = () => {
    const updated =
      input.trim() + "\n\nPlease include 2-3 realistic, step-by-step examples.";
    setInput(updated);
    executeOptimization(updated, category, mode);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const trimmed = text.trim();
        setInput(trimmed);
        const detected = detectCategory(trimmed);
        if (detected !== "general") setCategory(detected);
        textareaRef.current?.focus();
        addToast("Pasted from clipboard", "info");
      } else {
        addToast("Clipboard is empty", "info");
      }
    } catch {
      addToast("Please allow clipboard access to paste", "error");
    }
  };

  const handleOpenInAI = async (url: string, platformName: string) => {
    if (!result) return;
    try {
      await copyToClipboard(result.optimized);
      window.open(url, "_blank");
      addToast(`Copied! Opening ${platformName}...`, "success");
    } catch {
      window.open(url, "_blank");
    }
  };

  const categories: Category[] = [
    "general",
    "education",
    "coding",
    "learning",
    "daily",
    "writing",
    "research",
    "business",
  ];

  return (
    <div className="screen-enter">
      {/* Section heading & Engine indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-2)",
        }}
      >
        <div>
          <h1 className="section-title">{t.optimizeTitle}</h1>
          <p className="section-subtitle">{t.optimizeSubtitle}</p>
        </div>

        {hasAiConfig ? (
          <button
            className={`chip ${engine === "ai" ? "chip--active" : ""}`}
            onClick={() => setEngine(engine === "ai" ? "local" : "ai")}
            title={`Switch to ${engine === "ai" ? "Local Engine" : "AI Mode"}`}
            style={{ flexShrink: 0, marginTop: "2px" }}
          >
            {engine === "ai" ? (
              <Bot style={{ width: "12px", height: "12px" }} />
            ) : (
              <Cpu style={{ width: "12px", height: "12px" }} />
            )}
            {engine === "ai" ? `${aiProvider?.provider}` : "Local"}
          </button>
        ) : (
          <span
            className="tag"
            title="Local offline engine active. Add API key in Settings to enable AI models."
            style={{ flexShrink: 0, marginTop: "4px" }}
          >
            ⚡ Local
          </span>
        )}
      </div>

      {/* Input area */}
      <div className="textarea-wrapper">
        <textarea
          ref={textareaRef}
          className="textarea"
          placeholder={t.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleOptimize();
            }
          }}
          rows={4}
        />
        <div className="textarea-footer">
          <span
            className={`char-count ${input.length > 4000 ? "char-count--warning" : ""}`}
          >
            {input.length} {t.characters}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            {!input && (
              <button
                className="clear-btn"
                onClick={handlePaste}
                title="Paste from clipboard"
              >
                <Clipboard style={{ width: "12px", height: "12px" }} />{" "}
                {t.paste}
              </button>
            )}
            {input && (
              <button className="clear-btn" onClick={handleClear}>
                <X /> {t.clear}
              </button>
            )}
          </div>
        </div>
      </div>

      {engine === "ai" && (
        <p className="section-subtitle">
          {aiProvider?.provider} · about {estimateTokens(input)} input tokens
          (rough prompt-only estimate; excludes system instructions and output)
          · {input.length}/{maxAiInputCharacters} characters. API usage is
          billed by your provider.
        </p>
      )}
      {findings.length > 0 && (
        <div className="result-card" style={{ padding: 10 }}>
          <p>
            Potential sensitive information:{" "}
            {[...new Set(findings.map((f) => f.kind))].join(", ")}. Local use
            stays on this device.
          </p>
          <button
            className="chip"
            onClick={() => setInput(redactSensitiveInfo(input))}
          >
            Redact before AI use
          </button>
        </div>
      )}
      {analysis.questions.length > 0 && (
        <details style={{ margin: "10px 0" }}>
          <summary>
            Clarify first ({analysis.questions.length} questions)
          </summary>
          {analysis.questions.map((q) => (
            <label className="input-group" key={q}>
              {q}
              <input
                className="input"
                value={answers[q] || ""}
                onChange={(e) =>
                  setAnswers((v) => ({ ...v, [q]: e.target.value }))
                }
              />
            </label>
          ))}
          <button
            className="chip"
            disabled={!analysis.questions.some((q) => answers[q]?.trim())}
            onClick={() => {
              setInput(
                input +
                  "\n\n" +
                  analysis.questions
                    .filter((q) => answers[q]?.trim())
                    .map((q) => q + " " + answers[q]!.trim())
                    .join("\n"),
              );
              setAnswers({});
            }}
          >
            Add my answers to the prompt
          </button>
        </details>
      )}
      {/* Example prompts when empty */}
      {!input && !result && (
        <div style={{ marginTop: "var(--space-3)" }}>
          <span className="category-label">{t.tryExample}</span>
          <div className="chips-container" style={{ marginTop: "6px" }}>
            {EXAMPLE_PROMPTS.slice(0, 3).map((example) => (
              <button
                key={example}
                className="chip"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category selector */}
      <div className="category-row">
        <span className="category-label">{t.category}</span>
        <label>
          <input
            type="checkbox"
            checked={autoCategory}
            onChange={(e) => setAutoCategory(e.target.checked)}
          />
          {language === "bn" ? "স্বয়ংক্রিয়" : "Auto detect"}
        </label>
        <div className="chips-container">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip ${category === cat ? "chip--active" : ""}`}
              onClick={() => {
                setCategory(cat);
                setAutoCategory(false);
              }}
              title={CATEGORY_INFO[cat].description}
            >
              {CATEGORY_INFO[cat].emoji} {CATEGORY_INFO[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode selector */}
      <div className="mode-selector">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`mode-btn ${mode === m.key ? "mode-btn--active" : ""}`}
            onClick={() => setMode(m.key)}
          >
            {t[m.labelKey]}
          </button>
        ))}
      </div>

      {/* Optimize button */}
      <button
        className={`btn-primary ${isOptimizing ? "btn-primary--loading" : ""}`}
        onClick={handleOptimize}
        disabled={!input.trim() || isOptimizing}
      >
        {isOptimizing ? (
          <>
            <span className="spinner" /> {t.optimizing}
          </>
        ) : (
          <>
            <Sparkles /> {t.optimizeBtn}
          </>
        )}
      </button>

      {/* Result Card */}
      {result && (
        <div className="result-card">
          <div role="status" className="tag">
            {result.engine === "ai"
              ? "AI provider"
              : result.fallbackReason
                ? "Local fallback"
                : "Local engine"}{" "}
            ·{" "}
            {result.status === "unchanged"
              ? "No safe improvement needed"
              : "Task-specific rewrite"}
          </div>
          <div className="result-card__header">
            <div className="result-card__title">
              <Sparkles /> {t.optimizedPrompt}
            </div>
            <div className="result-card__actions">
              <button className="icon-btn" onClick={handleCopy} title="Copy">
                {copied ? <Check /> : <Copy />}
              </button>
              <button
                className="icon-btn"
                onClick={handleSave}
                title="Save to favorites"
              >
                <Heart />
              </button>
              <button
                className="icon-btn"
                onClick={handleEditInInput}
                title={t.editPrompt}
              >
                <Edit3 />
              </button>
              <button
                className="icon-btn"
                onClick={handleOptimize}
                title="Regenerate"
              >
                <RotateCcw />
              </button>
            </div>
          </div>

          <div className="result-card__body">
            {/* Comparison tabs */}
            <div className="comparison-tabs">
              <button
                className={`comparison-tab ${comparisonView === "changes" ? "comparison-tab--active" : ""}`}
                onClick={() => setComparisonView("changes")}
              >
                Changes
              </button>
              <button
                className={`comparison-tab ${comparisonView === "optimized" ? "comparison-tab--active" : ""}`}
                onClick={() => setComparisonView("optimized")}
              >
                {t.optimized}
              </button>
              <button
                className={`comparison-tab ${comparisonView === "original" ? "comparison-tab--active" : ""}`}
                onClick={() => setComparisonView("original")}
              >
                {t.original}
              </button>
            </div>

            <div className="result-text">
              {comparisonView === "changes" && difference ? (
                <>
                  {difference.before}
                  <del style={{ background: "#4b2020" }}>
                    {difference.removed}
                  </del>
                  <mark style={{ background: "#204b32", color: "inherit" }}>
                    {difference.added}
                  </mark>
                  {difference.after}
                  {!difference.removed && !difference.added && (
                    <p>{result.improvements.join(" ")}</p>
                  )}
                </>
              ) : comparisonView === "optimized" ? (
                result.optimized
              ) : (
                result.original
              )}
            </div>

            {/* Quick refinement actions */}
            {comparisonView === "optimized" && (
              <div
                style={{
                  marginTop: "var(--space-3)",
                  display: "flex",
                  gap: "var(--space-1)",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="chip"
                  onClick={() => handleQuickRefine("quick")}
                  title="Rewrite as a concise prompt"
                >
                  ⚡ {t.makeConcise}
                </button>
                <button
                  className="chip"
                  onClick={() => handleQuickRefine("deep")}
                  title="Rewrite with comprehensive structure"
                >
                  🔍 {t.makeDetailed}
                </button>
                <button
                  className="chip"
                  onClick={handleAddExamples}
                  title="Add concrete examples requirement"
                >
                  💡 {t.addExamples}
                </button>
                <button
                  className="chip"
                  onClick={() =>
                    handleOpenInAI("https://chatgpt.com", "ChatGPT")
                  }
                  title="Copy prompt and open ChatGPT in new tab"
                >
                  <ExternalLink style={{ width: "11px", height: "11px" }} />{" "}
                  {t.openChatGPT}
                </button>
                <button
                  className="chip"
                  onClick={() => handleOpenInAI("https://claude.ai", "Claude")}
                  title="Copy prompt and open Claude in new tab"
                >
                  <ExternalLink style={{ width: "11px", height: "11px" }} />{" "}
                  {t.openClaude}
                </button>
              </div>
            )}

            {/* Improvements list */}
            {comparisonView === "optimized" &&
              result.improvements &&
              result.improvements.length > 0 && (
                <div
                  style={{
                    marginTop: "var(--space-3)",
                    paddingTop: "var(--space-2)",
                    borderTop: "1px solid var(--border-secondary)",
                  }}
                >
                  <span
                    className="category-label"
                    style={{ display: "block", marginBottom: "6px" }}
                  >
                    {result.status === "unchanged"
                      ? language === "bn"
                        ? "মূল লেখা রাখার কারণ"
                        : "Why the original was kept"
                      : t.improvements}
                  </span>
                  <div className="chips-container">
                    {result.improvements.map((imp, i) => (
                      <span key={i} className="tag">
                        ✓ {imp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
