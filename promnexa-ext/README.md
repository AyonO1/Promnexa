# Promnexa — AI Prompt Optimizer

> **Turn ideas into better prompts.**

Promnexa is a free, local-first, cross-browser extension that converts simple, unclear, or incomplete instructions into powerful, well-structured, optimized prompts for AI models (ChatGPT, Claude, Gemini, DeepSeek, and more).

Inspired by the design craftsmanship of **Linear**, **Raycast**, and **Arc**, Promnexa delivers a calm, high-performance, and distraction-free experience directly inside your browser.

---

## 🌟 Key Features

### 🎯 1. Dual Optimization Engines
- **100% Offline Local Engine:** Fast, deterministic prompt engineering using intent detection, structured templates, and quality guidelines. Zero network calls, zero tracking, no accounts needed.
- **AI-Powered Engine (Optional):** Plug in your personal API keys for **OpenAI** (`gpt-4o-mini`, `gpt-4o`), **Anthropic Claude** (`claude-3-5-haiku`, `claude-3-5-sonnet`), or **Google Gemini** (`gemini-1.5-flash`, `gemini-2.0-flash`) for adaptive, contextual rewriting. Seamless automatic fallback to local engine if network or quota errors occur.

### ⚡ 2. Four Smart Optimization Modes
- **Quick Optimize:** Sharp, clear, concise instructions eliminating ambiguity.
- **Deep Optimize:** Comprehensive structure with role context, clear objectives, constraints, and output expectations.
- **Expert Optimize:** Introduces industry domain expertise, edge cases, and professional standards.
- **Beginner Optimize:** Step-by-step guidance with accessible language and intuitive analogies.
- **Quick Refinements:** One-click shortcuts under results to make concise, make detailed, add examples, or copy back to the editor.

### 📚 3. Extensive Prompt Library (200+ Built-in and Imported Templates)
- Hand-crafted and normalized prompt templates across 8 primary categories:
  - 🎓 **Education:** Exam revision, complex explanations, academic writing, thesis research, MCQ generators.
  - 💻 **Coding:** Bug debugging, fullstack architecture, code refactoring, test generation, security audits.
  - 📚 **Learning:** Personalized learning roadmaps, Socratic questioning, skill practice.
  - 📋 **Daily Life & Productivity:** Professional emails, meeting agendas, travel planning, personal organization.
  - ✍️ **Writing:** Creative storytelling, article outlines, copywriting, tone refinement.
  - 🔬 **Research:** Data analysis, literature reviews, methodology design, hypothesis testing.
  - 💼 **Business:** Pitch decks, startup strategy, marketing campaigns, client proposals.
  - ✨ **General:** Versatile prompts for any AI task.
- Instant search by title, description, subcategory, or tags.
- Direct "Use Template" action to load templates immediately into the optimizer.

### 🌐 4. Browser & AI Website Integrations
- **Floating Promnexa Button:** Appears seamlessly near the composer on ChatGPT, Claude.ai, Google Gemini, Perplexity, Microsoft Copilot, and DeepSeek.
- **Context Menus:** Right-click highlighted text anywhere on the web to "Optimize", "Explain", "Summarize", or "Create prompt from selection". Automatically populates and optimizes in the popup.
- **Configurable Shortcut:** Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to instantly toggle Promnexa.

### 🎨 5. Premium UI Design System
- Custom vanilla CSS design system following modern design principles.
- **Dark Theme:** Deep charcoal palette (`#111318`, `#1B1D24`, `#22252D`) with refined periwinkle accent (`#817CF5`).
- **Light Theme:** Warm off-white surfaces (`#FAF9F7`, `#FFFFFF`) with crisp graphite typography.
- **Bilingual Interface:** Full support for both **English** and **Bengali (বাংলা)**.
- Smooth 150–250ms micro-animations with full `prefers-reduced-motion` compliance.

### 🔒 6. Privacy & Security First
- Complete local data sovereignty: user preferences, favorites, and history live solely in local browser storage.
- No third-party analytics or telemetry.
- One-click JSON backup export and restore, plus full data wipe controls.

---

## 🛠️ Tech Stack & Architecture

- **Extension Framework:** WXT 0.21+ (WebExtension Tools)
- **UI Architecture:** React 19 + TypeScript (Strict Mode)
- **Iconography:** Lucide React + Custom Promnexa SVG Brand Asset
- **Styling:** Custom Vanilla CSS Design System (Zero Tailwind/Bootstrap overhead)
- **Manifest:** Manifest V3 for Chromium browsers, Manifest V2 with Gecko ID for Mozilla Firefox
- **Testing:** Node 24 Native Test Runner (`node --test`)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 22.18+ (Node 24 recommended)
- npm

### 2. Installation
```bash
cd promnexa-ext
npm install
```

### 3. Build Commands
```bash
# Production build for Google Chrome & Chromium (MV3)
npm run build

# Production build for Mozilla Firefox (MV2)
npm run build:firefox

# Run automated unit tests
npm test

# Generate distribution packages (ZIP)
npm run zip
npm run zip:firefox
```

---

## 📦 Loading the Extension Locally

### Google Chrome / Brave / Microsoft Edge / Arc
1. Open `chrome://extensions/` in your browser.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the directory: `promnexa-ext/.output/chrome-mv3`.

### Mozilla Firefox
1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `promnexa-ext/.output/firefox-mv2/manifest.json`.

---

## 📁 Repository Structure

```
promnexa-ext/
├── entrypoints/
│   ├── background.ts                 # Context menu handler & message broker
│   ├── content.ts                    # Floating button & chat adapters
│   └── popup/                        # Main popup application
│       ├── App.tsx                   # Shell, theme & screen routing
│       ├── main.tsx                  # React entrypoint
│       ├── style.css                 # 1300+ line CSS design system
│       ├── components/
│       │   ├── Logo.tsx              # SVG brand logo
│       │   ├── Onboarding.tsx        # 3-step first-run experience
│       │   └── Toast.tsx             # Toast notifications
│       └── screens/
│           ├── OptimizeScreen.tsx    # Core optimizer UI & comparison view
│           ├── LibraryScreen.tsx     # 200+ template searchable catalog
│           ├── SavedScreen.tsx       # Favorites & optimization history
│           └── SettingsScreen.tsx    # Theme, AI provider & privacy settings
├── lib/
│   ├── ai-provider.ts                # OpenAI, Anthropic & Gemini API client
│   ├── i18n.ts                       # English & Bengali translations
│   ├── optimizer.ts                  # Local offline optimization engine
│   ├── storage.ts                    # Local storage wrapper & export/import
│   ├── templates.ts                  # Merged template collection & search
│   ├── types.ts                      # Core TypeScript definitions
│   ├── curated-imported.json         # Curated 200 prompt templates
│   └── imported-prompts.json         # Raw 2262 normalized prompts dataset
├── public/
│   ├── promnexa-icon.svg             # Vector brand icon
│   └── icon/                         # Branded PNGs (16, 32, 48, 96, 128 px)
├── scripts/
│   ├── generate-icons.js             # SVG-to-PNG rasterizer script
│   ├── import-prompts.mjs            # Public collection & deduplication pipeline
│   └── merge-templates.js            # Category balancer script
├── tests/
│   ├── optimizer.test.ts             # Classification & optimization tests
│   ├── storage.test.ts               # Storage & export/import roundtrip tests
│   └── templates.test.ts             # Template search & category tests
├── PRIVACY.md                        # Formal privacy policy
├── SAFARI_PACKAGING.md               # Xcode & Safari conversion guide
├── STORE_SUBMISSION.md               # Store listing metadata & checklist
├── TESTING_REPORT.md                 # Full testing report & quality audit
├── wxt.config.ts                     # WXT manifest & bundle configuration
└── package.json
```

---

## 🧪 Testing Summary

Promnexa includes an automated unit test suite verifying:
- Category classification across 8 domain categories plus fallback
- Prompt transformations across all 4 modes (Quick, Deep, Expert, Beginner)
- Edge cases: whitespace prompts, multi-thousand character prompts with code snippets, multilingual & Unicode text
- Storage persistence, favorites toggle, history limits, and JSON backup/restore roundtrips
- Search filtering, subcategory extraction, and template count integrity

Run the test suite anytime:
```bash
npm test
```
Result: **25 passed / 0 failed (100% pass rate in <250ms)**.

---

## 📜 Documentation & Store Release Artifacts

- [Privacy Policy](PRIVACY.md)
- [Testing Report](TESTING_REPORT.md)
- [Store Submission Checklist](STORE_SUBMISSION.md)
- [Safari Packaging Guide](SAFARI_PACKAGING.md)
- Ready-to-upload Distribution ZIPs:
  - Chrome / Edge Web Store: `.output/promnexa-1.0.0-chrome.zip`
  - Mozilla Firefox Add-ons: `.output/promnexa-1.0.0-firefox.zip`
  - Mozilla Reviewers Source Code: `.output/promnexa-1.0.0-sources.zip`

---

## 📄 License

MIT License. Curated public prompts derived from Awesome ChatGPT Prompts (CC0 1.0 Universal).


## Version 1.1.0: client workflows and reliability

Free local/BYOK launch. Added client profiles, guided bilingual proposal/ad/reply briefs, editable variables, saved revisions and local usefulness feedback. Fixed history privacy, secret exports, import validation, AI timeout/fallback, settings refresh, category handling and dataset CSV parsing. Local mode makes no external font/API requests. AI providers may bill your API usage separately.

See `RELEASE_NOTES_1.1.0.md`, `TESTING_REPORT.md` and `LAUNCH_PLAN.md` in `promnexa-ext/` (or this directory when already inside the extension project). Firefox requires version 140+ and optional AI data-sharing consent. Do not load the repository source root in Chrome: use `.output/chrome-mv3` after building, or an extracted release ZIP.


## Version 1.1.1: direct in-chat improvement
Type a draft in a supported AI chat, click **Improve prompt**, review the replacement, then press Send yourself. **Undo** restores the original while protecting newer edits. **Options** retains mode previews and explicit configured-AI use. Alt+Shift+P improves the current draft locally. Reload the extension and refresh open AI-site tabs after updating.
