import React from "react";
import type { Category, SavedPrompt, SavedTab } from "../../../lib/types";
import {
  getSavedPrompts,
  getHistory,
  deleteSavedPrompt,
  toggleFavorite,
  clearHistory,
  recordFeedback,
  saveRevision,
} from "../../../lib/storage";
import { copyToClipboard, formatTimeAgo } from "../../../lib/optimizer";
import { getT, type Language } from "../../../lib/i18n";
import {
  Copy,
  Heart,
  Trash2,
  Clock,
  Star,
  HeartOff,
  Wand2,
} from "lucide-react";

interface SavedScreenProps {
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  onUsePrompt?: (text: string, category: Category) => void;
  language?: Language;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({
  addToast,
  onUsePrompt,
  language = "en",
}) => {
  const t = getT(language);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [revision, setRevision] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<SavedTab>("favorites");
  const [savedPrompts, setSavedPrompts] = React.useState<SavedPrompt[]>([]);
  const [history, setHistory] = React.useState<SavedPrompt[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [saved, hist] = await Promise.all([
        getSavedPrompts(),
        getHistory(),
      ]);
      setSavedPrompts(saved);
      setHistory(hist);
    } catch {
      addToast("Failed to load data", "error");
    }
    setLoading(false);
  }, [addToast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const favorites = savedPrompts.filter((p) => p.isFavorite);
  const displayedItems = activeTab === "favorites" ? favorites : history;

  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text);
      addToast(t.copied, "success");
    } catch {
      addToast("Failed to copy", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSavedPrompt(id);
      await loadData();
      addToast("Deleted", "info");
    } catch {
      addToast("Failed to delete", "error");
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
      await loadData();
    } catch {
      addToast("Failed to update", "error");
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      setHistory([]);
      addToast("History cleared", "info");
    } catch {
      addToast("Failed to clear", "error");
    }
  };

  const tabs: {
    key: SavedTab;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      key: "favorites",
      label: t.favorites,
      icon: <Star />,
      count: favorites.length,
    },
    {
      key: "history",
      label: t.history,
      icon: <Clock />,
      count: history.length,
    },
  ];

  return (
    <div className="screen-enter">
      <h1 className="section-title">{t.savedTitle}</h1>
      <p className="section-subtitle">{t.savedSubtitle}</p>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginTop: "var(--space-3)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "tab-btn--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}{" "}
            {tab.count > 0 && (
              <span className="badge" style={{ marginLeft: "4px" }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}

        {activeTab === "history" && history.length > 0 && (
          <button
            className="clear-btn"
            style={{ marginLeft: "auto" }}
            onClick={handleClearHistory}
          >
            <Trash2 /> {t.clearAll}
          </button>
        )}
      </div>

      {/* Items list */}
      <div
        style={{ maxHeight: "380px", overflowY: "auto", paddingRight: "2px" }}
      >
        {loading ? (
          // Skeleton loading
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ marginBottom: "var(--space-2)" }}>
              <div
                className="skeleton"
                style={{ height: "80px", width: "100%" }}
              />
            </div>
          ))
        ) : displayedItems.length > 0 ? (
          displayedItems.map((item) => (
            <div key={item.id} className="prompt-card">
              <div
                className="prompt-card__desc"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                  marginBottom: "4px",
                }}
              >
                {formatTimeAgo(item.createdAt)} • {item.category} • {item.mode}
              </div>

              <div
                className="prompt-card__title"
                style={{ fontSize: "var(--text-xs)" }}
              >
                {t.original}:{" "}
                {item.original.length > 80
                  ? item.original.substring(0, 80) + "..."
                  : item.original}
              </div>

              <div className="prompt-card__desc" style={{ marginTop: "4px" }}>
                {item.optimized.length > 120
                  ? item.optimized.substring(0, 120) + "..."
                  : item.optimized}
              </div>

              {item.parentId && (
                <p className="tag">
                  {language === "bn" ? "সংস্করণ" : "Revision"} ·{" "}
                  {item.parentId.slice(-8)}
                </p>
              )}
              <div className="chips-container">
                <button
                  className={`chip ${item.feedback === "useful" ? "chip--active" : ""}`}
                  onClick={async () => {
                    try {
                      await recordFeedback(item.id, "useful");
                      await loadData();
                    } catch {
                      addToast("Could not save feedback", "error");
                    }
                  }}
                >
                  {language === "bn" ? "কাজে লেগেছে" : "Useful"}
                </button>
                <button
                  className={`chip ${item.feedback === "needs-work" ? "chip--active" : ""}`}
                  onClick={async () => {
                    try {
                      await recordFeedback(item.id, "needs-work");
                      await loadData();
                    } catch {
                      addToast("Could not save feedback", "error");
                    }
                  }}
                >
                  {language === "bn" ? "সংশোধন চাই" : "Needs work"}
                </button>
                <button
                  className="chip"
                  onClick={() => {
                    setEditingId(item.id);
                    setRevision(item.optimized);
                  }}
                >
                  {language === "bn" ? "নতুন সংস্করণ" : "Create revision"}
                </button>
              </div>
              {editingId === item.id && (
                <div>
                  <textarea
                    aria-label="Prompt revision"
                    className="textarea"
                    maxLength={100000}
                    rows={5}
                    value={revision}
                    onChange={(e) => setRevision(e.target.value)}
                  />
                  <button
                    className="chip"
                    disabled={!revision.trim()}
                    onClick={async () => {
                      try {
                        await saveRevision(item, revision);
                        setEditingId(null);
                        await loadData();
                        addToast("Revision saved in favorites", "success");
                      } catch {
                        addToast("Could not save revision", "error");
                      }
                    }}
                  >
                    Save revision
                  </button>
                  <button className="chip" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              )}
              <div className="prompt-card__footer">
                <div className="prompt-card__tags">
                  <span className="tag">{item.category}</span>
                  <span className="tag">{item.mode}</span>
                </div>
                <div className="prompt-card__actions">
                  {onUsePrompt && (
                    <button
                      className="chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUsePrompt(item.optimized, item.category);
                      }}
                      title="Load into Optimizer"
                      style={{
                        padding: "2px 8px",
                        fontSize: "var(--text-2xs)",
                      }}
                    >
                      <Wand2 style={{ width: "10px", height: "10px" }} /> Use
                    </button>
                  )}
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(item.optimized);
                    }}
                    title="Copy optimized prompt"
                  >
                    <Copy />
                  </button>
                  {activeTab === "favorites" && (
                    <>
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item.id);
                        }}
                        title="Remove from favorites"
                      >
                        <HeartOff />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              {activeTab === "favorites" ? <Heart /> : <Clock />}
            </div>
            <div className="empty-state__title">
              {activeTab === "favorites" ? t.noFavorites : t.noHistory}
            </div>
            <div className="empty-state__desc">
              {activeTab === "favorites" ? t.noFavoritesDesc : t.noHistoryDesc}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
