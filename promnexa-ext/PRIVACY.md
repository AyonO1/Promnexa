# Promnexa — Privacy Policy

**Effective Date:** October 12, 2026  
**Last Updated:** October 12, 2026  

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
- **Saved Prompts & History:** Prompts you explicitly favorite or choose to retain in local history.
- **API Keys (Optional):** If you choose to configure an optional AI provider (OpenAI, Anthropic Claude, or Google Gemini), your API key is encrypted/stored solely on your device. It is never transmitted to Promnexa servers or any third-party other than the official API endpoint you configured.

---

## 3. Optional AI Provider Integration

If you choose to enable external AI models:
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
- Promnexa never automatically submits prompts without user confirmation.

---

## 5. Data Deletion and Export

You retain 100% control over your data:
- **Export:** Export your entire prompt collection and settings to a JSON file at any time.
- **Clear Data:** One-click data wipe deletes all saved prompts, history, and settings from local storage.
- **Uninstall:** Removing the extension immediately purges all stored data from your browser.

---

## 6. Permissions Justification

| Permission | Purpose |
|------------|---------|
| `storage` | Stores your settings, favorites, and local prompt history locally. |
| `contextMenus` | Allows right-clicking selected text to optimize or summarize. |
| `activeTab` | Enables optional prompt insertion into active AI chat tabs upon user action. |

---

## 7. Contact & Inquiries

For questions, feedback, or security concerns:
- **Project Repository:** https://github.com/AyonO1/Promnexa
- **Issues & Support:** https://github.com/AyonO1/Promnexa/issues
