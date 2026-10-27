# 🚀 Promnexa — Installation & Quick Start Guide

> **Install and start optimizing your AI prompts in under 30 seconds!**

Promnexa works across all modern Chromium browsers (**Google Chrome, Microsoft Edge, Brave, Arc, Opera, Vivaldi**) and **Mozilla Firefox**.

---

## ⚡ Option 1: 30-Second Quick Install (No Coding / No Node.js Required)

*Recommended for all users who just want to use the extension.*

### For Google Chrome, Brave, Edge, Arc & Opera:

1. **Download the pre-built extension package:**
   - Go to [**GitHub Releases**](https://github.com/AyonO1/Promnexa/releases/latest)
   - Download `promnexa-1.0.0-chrome.zip`
2. **Extract the ZIP file:**
   - Right-click the downloaded `.zip` file and select **Extract All...** (or unzip it to a folder).
3. **Open Extensions in your browser:**
   - In Chrome, Brave, or Arc, visit: `chrome://extensions/`
   - In Microsoft Edge, visit: `edge://extensions/`
4. **Enable Developer Mode:**
   - In the top-right corner of the Extensions page, switch the **Developer mode** toggle to **ON**.
5. **Load the extension:**
   - Click the **"Load unpacked"** button (top-left).
   - Select the unzipped folder containing `manifest.json`.
6. **Pin Promnexa:**
   - Click the **Puzzle icon** (Extensions) in your browser toolbar next to the address bar.
   - Click the **Pin icon** next to **Promnexa** to keep it accessible with one click!

---

### For Mozilla Firefox:

1. **Download:**
   - Download `promnexa-1.0.0-firefox.zip` from [**GitHub Releases**](https://github.com/AyonO1/Promnexa/releases/latest).
2. **Extract:**
   - Unzip the archive to a folder.
3. **Load in Firefox:**
   - In Firefox address bar, navigate to: `about:debugging#/runtime/this-firefox`
   - Click **"Load Temporary Add-on..."**
   - Browse into the extracted folder and select `manifest.json`.

---

## 💻 Option 2: 1-Click Builder (Windows Users)

If you cloned this repository from GitHub and have Node.js installed:

1. Double-click the [`build.bat`](build.bat) file in the root folder of this repository.
2. The script will automatically:
   - Check Node.js and npm
   - Install dependencies
   - Build production packages for both Chrome and Firefox
   - Output ready-to-load folders in `promnexa-ext/.output/chrome-mv3`
3. Follow Step 3-5 in Option 1 above to load `promnexa-ext/.output/chrome-mv3`.

---

## 🛠️ Option 3: Developer Setup (From Source)

```bash
# 1. Clone repository
git clone https://github.com/AyonO1/Promnexa.git
cd Promnexa

# 2. Install dependencies
cd promnexa-ext
npm install

# 3. Start live development server (with hot reload)
npm run dev

# 4. Or build production packages
npm run build         # Chrome MV3 (.output/chrome-mv3)
npm run build:firefox # Firefox MV2 (.output/firefox-mv2)

# 5. Run automated tests
npm test
```

---

## 🎯 How to Use Promnexa After Installing

### 1. In-Page AI Assistant (ChatGPT, Claude, Gemini, DeepSeek, Grok)
1. Open any supported AI website:
   - [ChatGPT](https://chatgpt.com)
   - [Claude](https://claude.ai)
   - [Google Gemini](https://gemini.google.com)
   - [DeepSeek](https://chat.deepseek.com)
   - [Perplexity](https://perplexity.ai)
   - [Microsoft Copilot](https://copilot.microsoft.com)
2. Type your draft in the AI chat box.
3. Click **Improve prompt** or press `Alt+Shift+P`. Promnexa replaces the draft directly using the local optimizer.
4. Review the improved text, then press the AI site's **Send** button yourself. Promnexa never sends automatically.
5. Click **Undo** to restore the exact original draft. Undo will not overwrite newer manual edits or a different conversation.
6. Open **Options** for mode previews, copying, or an explicit request to your configured AI provider. Inserting a preview also supports Undo.

---

### 2. Standalone Popup & 200+ Templates
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) anywhere in your browser, or click the Promnexa toolbar icon.
2. **Optimize Screen:**
   - Click **Paste** to instantly insert text from your clipboard.
   - Pick your optimization category & mode.
   - Click **Optimize Prompt**.
   - Use **"Open in ChatGPT"** or **"Open in Claude"** to immediately copy and launch your preferred AI in a new tab!
3. **Library Screen:**
   - Browse 200+ built-in and imported prompt templates across Coding, Education, Daily Life, Writing, Learning, Business, and Research.
   - Filter by subcategories or search keywords.
   - Click **"Use Template"** to load it into the optimizer.
4. **100% Offline & Private:**
   - Promnexa's rule-based optimization engine runs completely offline in your browser.
   - No data is ever collected, tracked, or sent to external servers.
   - Optional: Add your personal OpenAI, Claude, or Gemini API key in Settings if you prefer LLM-powered rewrites.

---

## ❓ Frequently Asked Questions (FAQ)

#### Q: How do I open Promnexa quickly?
**A:** Press `Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on Mac. You can also customize this in your browser's extension keyboard shortcuts page (`chrome://extensions/shortcuts`).

#### Q: Does Promnexa send my data or prompts to any servers?
**A:** **No.** By default, Promnexa runs a 100% local rule-based prompt engine inside your browser. Your prompts, history, and preferences stay strictly on your device.

#### Q: Can I use my own AI API key?
**A:** Yes! Go to the **Settings** tab in the Promnexa popup, expand **AI Provider**, and enter your OpenAI, Anthropic, or Google Gemini API key. If the API ever times out or has quota limits, Promnexa automatically falls back to the local engine without breaking your workflow.
