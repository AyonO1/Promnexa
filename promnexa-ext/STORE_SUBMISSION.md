# Promnexa — Store Publication & Submission Guide

This document contains all materials, descriptions, permission justifications, and release checklists required to submit **Promnexa — AI Prompt Optimizer** to the Chrome Web Store, Mozilla Add-ons (AMO), and Microsoft Edge Add-ons.

---

## 1. Store Listing Metadata

- **Extension Name:** Promnexa — AI Prompt Optimizer
- **Short Name:** Promnexa
- **Version:** 1.0.0
- **Summary / Tagline (132 chars max):**  
  `Turn ideas into better prompts. Transform simple, vague instructions into structured, high-performing AI prompts instantly.`
- **Primary Category:** Productivity
- **Secondary Category:** Developer Tools / Education
- **Languages:** English, Bengali (বাংলা)
- **Support URL:** https://github.com/AyonO1/Promnexa/issues
- **Privacy Policy URL:** https://github.com/AyonO1/Promnexa/blob/main/promnexa-ext/PRIVACY.md

---

## 2. Store Description

### Detailed Description

```markdown
Turn ideas into better prompts with Promnexa.

Communicating effectively with AI shouldn't require learning complex prompt engineering formulas. Promnexa is a fast, beautifully designed browser extension that transforms simple, vague, or incomplete instructions into powerful, well-structured prompts tailored for ChatGPT, Claude, Gemini, and other AI models.

✨ KEY FEATURES:

🎯 4 SMART OPTIMIZATION MODES
• Quick Optimize: Refines clarity and cuts fluff for concise, high-impact results.
• Deep Optimize: Comprehensive structure with objective, context, edge-cases, and quality guidelines.
• Expert Optimize: Introduces professional roles, technical requirements, and industry standards.
• Beginner Optimize: Progressive, step-by-step prompts with accessible language and clear analogies.

🧠 DUAL OPTIMIZATION ENGINES
• 100% Offline Local Engine: Instant, deterministic prompt engineering with zero network calls, subscriptions, or accounts.
• Optional AI-Powered Engine: Connect your own OpenAI, Anthropic Claude, or Google Gemini API keys for adaptive rewrites.

📚 CURATED PROMPT LIBRARY (200+ TEMPLATES)
• Hand-crafted templates across 8 essential categories:
  - 🎓 Education (Thesis research, exam prep, lecture explanations, MCQs)
  - 💻 Coding (Debugging, architecture, refactoring, security reviews)
  - 📚 Learning (Roadmaps, Socratic tutoring, language practice)
  - 📋 Daily Life & Productivity (Emails, travel planning, meeting agendas)
  - ✍️ Writing & Content (Articles, storytelling, copywriting)
  - 🔬 Research (Data analysis, literature review, methodology)
  - 💼 Business (Strategy, pitch decks, client proposals)
  - ✨ General Prompts

⚡ DIRECT AI SITE INTEGRATION
• Subtle floating Promnexa helper on ChatGPT, Claude, Gemini, Copilot, DeepSeek, and Perplexity.
• One-click prompt enhancement without leaving your chat composer.

🎨 LINEAR & RAYCAST INSPIRED DESIGN
• Dark Charcoal and Warm Off-White themes with silky smooth animations.
• Native keyboard shortcut support (Ctrl+Shift+P / Cmd+Shift+P).
• Full privacy: no tracking, no telemetry, no silent uploads.
```

---

## 3. Permissions Disclosure & Justification

| Permission | Requested Scope | Technical Justification |
|------------|-----------------|-------------------------|
| `storage` | `storage` | Necessary to locally save user preferences (dark/light theme, UI language, default mode), favorites, and optimization history. No data leaves the device. |
| `contextMenus` | `contextMenus` | Adds right-click options ("Optimize with Promnexa", "Explain", "Summarize") when text is highlighted on any webpage. |
| `activeTab` | `activeTab` | Allows inserting the user-approved optimized prompt back into the active AI chat composer when requested by the user. |

---

## 4. Visual Assets Checklist

- [x] **Extension Icons:**
  - 16x16 px (`public/icon/16.png`)
  - 32x32 px (`public/icon/32.png`)
  - 48x48 px (`public/icon/48.png`)
  - 96x96 px (`public/icon/96.png`)
  - 128x128 px (`public/icon/128.png`)
- [ ] **Promo Tiles (Prepared for upload):**
  - Small Promo Tile: 440 x 280 px
  - Marquee Promo Tile: 1400 x 560 px
- [ ] **Screenshots (Minimum 1280 x 800 px or 640 x 400 px):**
  - Screenshot 1: Optimize Screen with comparison view and improvements
  - Screenshot 2: Prompt Library with category filters and search
  - Screenshot 3: Saved Prompts & History
  - Screenshot 4: Settings screen with theme toggle and AI provider config
  - Screenshot 5: Light mode appearance

---

## 5. Pre-Submission Verification Steps

1. **Clean Production Build:**
   ```bash
   npm run build
   npm run build:firefox
   ```
2. **Run All Unit Tests:**
   ```bash
   npm test
   ```
3. **Generate Release Zip Files:**
   ```bash
   npm run zip
   npm run zip:firefox
   ```
   Outputs:
   - `.output/promnexa-1.0.0-chrome.zip` (Chrome Web Store & Edge Add-ons)
   - `.output/promnexa-1.0.0-firefox.zip` (Mozilla Add-ons)
   - `.output/promnexa-1.0.0-sources.zip` (Source code for Mozilla Reviewers)

4. **Security & Privacy Audit:**
   - [x] No `eval` or remote executable code.
   - [x] No hardcoded developer API secrets.
   - [x] Content Security Policy complies with MV3 requirements.
   - [x] Data collection notice provided in `PRIVACY.md`.
