# Promnexa — Privacy Policy

**Effective Date:** October 12, 2026  
**Last Updated:** October 30, 2026

Promnexa ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains our practices regarding data collection, storage, and processing.

---

## 1. Core Privacy Principles

1. **Local-First Architecture:** All prompt optimizations, category classifications, and library queries run locally inside your browser by default.
2. **Zero Tracking & Analytics:** We do not track user activity, record keystrokes, log browsing history, or include third-party tracking scripts.
3. **No Hidden Uploads:** Your prompts, templates, and data are never sent to external servers without your explicit knowledge and action.

---

## 2. What Data We Store

All data is stored exclusively in your local browser storage (`browser.storage.local` / `chrome.storage.local`):

- **User Preferences:** Theme selection (dark/light/system), UI language, default category, and default optimization mode.
- **Saved Prompts & History:** Prompts you explicitly favorite, revisions and local usefulness feedback. New installations start with history disabled; existing choices are retained. Optimization history is saved only while the history switch is enabled; disabling it does not erase existing entries.
- **API Keys (Optional):** If you choose to configure an optional AI provider (OpenAI, Anthropic Claude, or Google Gemini), your API key is stored separately in browser-session storage by default (cleared on browser restart). If you explicitly enable Remember, it is stored unencrypted in local extension storage on your device. It is never transmitted to Promnexa servers or any third-party other than the official API endpoint you configured.

---

Client profiles (audience, offer, tone and constraints) remain in local extension storage. Workflows include profile information in the brief only when you select a client. Local feedback is never uploaded. No external fonts are requested.

## 3. Optional AI Provider Integration

If you choose AI optimization in the popup or click the in-page AI button (Firefox 140+ additionally requires optional data-sharing consent through the popup):
- Optimization requests are sent directly from your browser to the designated provider endpoint:
  - OpenAI: `api.openai.com`
  - Anthropic: `api.anthropic.com`
  - Google Gemini: `generativelanguage.googleapis.com`
- Requests are governed by the respective provider's privacy policy and data usage terms.
- You can revoke or remove your API keys at any time through the Promnexa Settings screen.

---

## 4. Website Integrations & Content Scripts

When optional AI website integration is enabled (e.g., ChatGPT, Claude, Gemini):
- Promnexa only reads the content of the active prompt composer when you explicitly click the floating Promnexa button or trigger a shortcut.
- Promnexa never reads background conversations, messages from the assistant, or pages other than the user's explicit active prompt.
- Promnexa never automatically submits prompts. Improve prompt updates only the composer; users review the draft and press Send themselves. Undo keeps the original draft only in page memory until replaced or the page closes.

---

## 5. Data Deletion and Export

You retain 100% control over your data:
- **Export:** Export prompts, client profiles and settings to JSON. API keys are excluded and must be entered again after import.
- **Clear Data:** One-click data wipe deletes all saved prompts, history, and settings from local storage.
- **Uninstall:** Removing the extension immediately purges all stored data from your browser.

---

## 6. Permissions Justification

| Permission | Purpose |
|------------|---------|
| `storage` | Stores your settings, favorites, and local prompt history locally. |
| `contextMenus` | Allows right-clicking selected text to optimize or summarize. |
| API host access | Allows requests only to the three listed provider domains when you explicitly use AI. |
| `activeTab` | Enables optional prompt insertion into active AI chat tabs upon user action. |

---

## 7. Contact & Inquiries

For questions, feedback, or security concerns:
- **Project Repository:** https://github.com/AyonO1/Promnexa
- **Issues & Support:** https://github.com/AyonO1/Promnexa/issues


## Review hardening in 1.2.0
Chrome local extension storage is restricted to trusted extension contexts when supported; content scripts receive only sanitized integration preferences. Remembered keys on browsers without that access-control API remain unencrypted extension-local data. No secret-vault or end-to-end encryption claim is made. Legacy general-settings keys migrate to session storage and a notice explains how to opt into Remember.

Before external AI use, a local heuristic scanner flags common credential patterns, password assignments and email addresses. Users can redact them or explicitly consent to sending the flagged data. The scanner can miss sensitive information; review the full prompt yourself. API input limits and token estimates are approximate cost controls, not billing predictions. No automatic retry incurs an additional provider request.

Context-menu selections are held in session storage, associated with a source tab and a unique action, and ignored after two minutes. They are removed when consumed; old pending entries are bounded and cleaned on later actions, and session data clears on browser restart. Saved prompts have a four-MiB budget, history a two-MiB rolling budget, and client profiles a two-MiB budget. History may evict older entries within its budget; saved prompts are not silently evicted. Local feedback and all text comparison stay on the device.
