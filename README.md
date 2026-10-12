# Promnexa — AI Prompt Optimizer

> **Turn ideas into better prompts.**

Promnexa is a premium, cross-browser extension that converts simple, unclear, or incomplete instructions into powerful, well-structured, optimized prompts for AI models (ChatGPT, Claude, Gemini, DeepSeek, and more).

Inspired by the design craftsmanship of **Linear**, **Raycast**, and **Arc**, Promnexa delivers a calm, high-performance, and distraction-free experience directly inside your browser.

---

## ⚡ Install in Under 30 Seconds (No Coding Required!)

You don't need Node.js, git, or coding experience to use Promnexa!

1. Download the pre-built extension from [**GitHub Releases**](https://github.com/AyonO1/Promnexa/releases/latest) (e.g. `promnexa-1.0.0-chrome.zip`).
2. Extract the ZIP file.
3. Open `chrome://extensions/` in Chrome, Brave, Edge, or Arc.
4. Turn on **Developer mode** (top-right) and click **"Load unpacked"**.
5. Select the extracted folder — **Done!**

👉 **For detailed instructions and screenshots across all browsers, see the [Installation Guide (INSTALL.md)](INSTALL.md).**

---

## 🌟 Key Highlights

- **Seamless In-Page Assistant:** A floating Promnexa button appears right inside ChatGPT, Claude, Gemini, DeepSeek, and Copilot. Type your basic idea and click **"✨ Insert into Chat"** to enhance and paste the prompt in one click!
- **Dual Optimization Engines:** 100% offline local rule-based engine (zero network calls, zero tracking) + optional AI-powered enhancement (OpenAI, Claude, Gemini).
- **4 Optimization Modes:**
  - ⚡ **Quick:** Sharp, concise, unambiguous instructions.
  - 🔍 **Deep:** Detailed structure with role context, clear objectives, constraints, and output formats.
  - 🎓 **Expert:** High-level domain standards, edge cases, and technical rigor.
  - 🐣 **Beginner:** Step-by-step guidance, intuitive analogies, and accessible explanations.
- **200+ Curated Prompt Templates:** Across 8 categories (Education, Coding, Learning, Productivity, Writing, Research, Business, General).
- **Clipboard & Quick Actions:** 1-click **Paste** from clipboard, plus direct **"Open in ChatGPT"** and **"Open in Claude"** shortcuts.
- **Bilingual Design System:** Custom dark & light themes, Bengali & English support, smooth micro-interactions.
- **Privacy First:** 100% local browser storage; zero telemetry, zero analytics.

---

## 📁 Repository Structure

```
Promnexa/
├── .github/workflows/          # Automated CI/CD & release pipeline
├── .vscode/                    # Workspace configurations
├── .gitignore                  # Git ignore rules
├── build.bat                   # 1-Click Windows builder script
├── start-dev.bat               # 1-Click Windows dev launcher
├── package.json                # Root workspace scripts
├── INSTALL.md                  # Beginner-friendly 30-second install guide
├── README.md                   # Main repository overview
└── promnexa-ext/               # Browser extension source code
    ├── entrypoints/
    │   ├── background.ts       # Context menu handler & message broker
    │   ├── content.ts          # Floating in-page assistant & chat adapters
    │   └── popup/              # React extension popup
    ├── lib/                    # Optimization engine, AI provider, storage & templates
    ├── public/                 # Extension icons & assets
    ├── scripts/                # Dataset curation & icon generator scripts
    ├── tests/                  # Automated test suite (25 unit tests)
    ├── PRIVACY.md              # Privacy policy
    ├── STORE_SUBMISSION.md     # Web Store submission checklist
    ├── SAFARI_PACKAGING.md     # Safari packaging instructions
    └── wxt.config.ts           # WXT configuration
```

---

## 💻 Developer Quick Start

Run scripts directly from the root workspace:

```bash
# Install dependencies
npm install --prefix promnexa-ext

# Start development server with hot-reload
npm run dev

# Run automated tests
npm test

# Build production extensions
npm run build         # Chrome MV3
npm run build:firefox # Firefox MV2
npm run build:all     # Build both

# Package distribution ZIPs
npm run zip:all
```

On Windows, you can also double-click [`build.bat`](build.bat) or [`start-dev.bat`](start-dev.bat).

---

## 📄 License

MIT License. Curated public prompts derived from Awesome ChatGPT Prompts (CC0 1.0 Universal).
