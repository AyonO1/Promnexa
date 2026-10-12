# Promnexa — AI Prompt Optimizer

> **Turn ideas into better prompts.**

Promnexa is a premium, cross-browser extension that converts simple, unclear, or incomplete instructions into powerful, well-structured, optimized prompts for AI models (ChatGPT, Claude, Gemini, DeepSeek, and more).

Inspired by the design craftsmanship of **Linear**, **Raycast**, and **Arc**, Promnexa delivers a calm, high-performance, and distraction-free experience directly inside your browser.

---

## 🌟 Key Highlights

- **Dual Optimization Engines:** 100% offline local rule-based engine + optional AI-powered enhancement (OpenAI, Claude, Gemini).
- **4 Optimization Modes:** Quick, Deep, Expert, and Beginner.
- **200+ Curated Prompt Templates:** Across 8 categories (Education, Coding, Learning, Productivity, Writing, Research, Business, General).
- **Browser Integrations:** Floating AI composer action button, right-click context menu, and keyboard shortcut (`Ctrl+Shift+P`).
- **Design System:** Custom dark & light themes, Bengali & English bilingual support, smooth micro-interactions.
- **Privacy First:** All data saved locally in your browser; zero telemetry, zero analytics.

---

## 📁 Repository Structure

```
Promnexa/
├── .vscode/                     # Workspace configurations
├── .gitignore                   # Root Git ignore rules
├── README.md                    # Root repository documentation
└── promnexa-ext/                # Browser extension source code
    ├── entrypoints/             # Background scripts, content scripts, and React popup
    ├── lib/                     # Optimization engine, AI provider, storage & templates
    ├── public/                  # Extension icons & assets
    ├── scripts/                 # Utility scripts & prompt dataset curation
    ├── tests/                   # Automated test suite
    ├── PRIVACY.md               # Privacy policy
    ├── STORE_SUBMISSION.md      # Web Store submission metadata & checklist
    ├── SAFARI_PACKAGING.md      # Safari extension build guide
    ├── TESTING_REPORT.md        # Comprehensive quality & test audit
    ├── package.json             # Dependencies and scripts
    └── wxt.config.ts            # WXT configuration
```

---

## 🚀 Quick Start

To develop or build the extension:

```bash
# Navigate to the extension directory
cd promnexa-ext

# Install dependencies
npm install

# Start development server
npm run dev

# Build for Chrome / Chromium (Manifest V3)
npm run build

# Build for Firefox (Manifest V2)
npm run build:firefox

# Run tests
npm test
```

For more detailed setup guides and distribution instructions, see [`promnexa-ext/README.md`](promnexa-ext/README.md).

---

## 📄 License

MIT License.
