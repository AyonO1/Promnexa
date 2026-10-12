/**
 * Promnexa Content Script
 * Seamless in-page AI assistant for ChatGPT, Claude, Gemini, DeepSeek, Copilot, and Grok.
 * Provides an interactive floating optimizer button and instant in-page prompt enhancement.
 */

import { optimizePrompt, detectCategory } from '../lib/optimizer';
import type { Category, OptimizationMode } from '../lib/types';

export default defineContentScript({
  matches: [
    '*://chatgpt.com/*',
    '*://chat.openai.com/*',
    '*://claude.ai/*',
    '*://gemini.google.com/*',
    '*://perplexity.ai/*',
    '*://copilot.microsoft.com/*',
    '*://chat.deepseek.com/*',
    '*://grok.com/*',
    '*://x.com/i/grok*',
  ],
  runAt: 'document_idle',

  main() {
    let promnexaBtn: HTMLElement | null = null;
    let promnexaCard: HTMLElement | null = null;
    let isEnabled = false;
    let previousOriginalText = '';
    let currentMode: OptimizationMode = 'quick';

    // Check if integration is enabled for this site
    async function checkEnabled(): Promise<boolean> {
      try {
        const result = (await browser.storage.local.get('promnexa_settings')) as Record<string, any>;
        const settings = result?.promnexa_settings;
        if (!settings || !Array.isArray(settings.websiteIntegrations)) {
          return true; // Default to enabled
        }

        const hostname = window.location.hostname;
        const integration = settings.websiteIntegrations.find(
          (i: { site: string; enabled: boolean }) => hostname.includes(i.site)
        );
        return integration ? integration.enabled : true;
      } catch {
        return true;
      }
    }

    // Common selectors for AI chat inputs across all supported platforms
    const INPUT_SELECTORS = [
      // ChatGPT
      'textarea[data-id="root"]',
      '#prompt-textarea',
      'div[contenteditable="true"][data-placeholder]',
      'div[contenteditable="true"]#prompt-textarea',
      // Claude
      'div.ProseMirror[contenteditable="true"]',
      'fieldset div[contenteditable="true"]',
      // Gemini
      'rich-textarea div[contenteditable="true"]',
      'div[contenteditable="true"].ql-editor',
      '.text-input-field textarea',
      // DeepSeek
      'textarea#chat-input',
      'textarea[placeholder*="DeepSeek"]',
      // Grok & Copilot & Generic
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="message"]',
      'div[contenteditable="true"]',
      'textarea',
    ];

    // Get active input element
    function getActiveInputElement(): HTMLElement | null {
      for (const selector of INPUT_SELECTORS) {
        const el = document.querySelector(selector) as HTMLElement;
        if (el && el.offsetParent !== null) {
          return el;
        }
      }
      return null;
    }

    // Read current text from the AI site's chat input
    function getCurrentPromptText(): string {
      const el = getActiveInputElement();
      if (!el) return '';

      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        return el.value || '';
      }
      return el.innerText || el.textContent || '';
    }

    // Insert text into the AI site's chat input with full synthetic event dispatch
    function setPromptText(text: string): boolean {
      const el = getActiveInputElement();
      if (!el) return false;

      el.focus();

      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      // For contenteditable elements (Claude, Gemini, modern ChatGPT)
      try {
        el.innerText = text;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      } catch {
        el.textContent = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }

    // Create the floating Promnexa trigger button
    function createFloatingButton() {
      if (promnexaBtn) return;

      promnexaBtn = document.createElement('div');
      promnexaBtn.id = 'promnexa-float-btn';
      promnexaBtn.setAttribute('role', 'button');
      promnexaBtn.setAttribute('tabindex', '0');
      promnexaBtn.title = 'Promnexa: Quick Optimize (Alt+Shift+P)';

      promnexaBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2L28.1244 9V23L16 30L3.87564 23V9L16 2Z" fill="white" opacity="0.25"/>
          <path d="M10 20L14 12H18L22 20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 17H20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="16" cy="9" r="1.5" fill="white"/>
        </svg>
      `;

      Object.assign(promnexaBtn.style, {
        position: 'fixed',
        bottom: '84px',
        right: '24px',
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #817CF5 0%, #6366F1 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: '2147483640',
        boxShadow: '0 4px 16px rgba(129, 124, 245, 0.45)',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        outline: 'none',
        userSelect: 'none',
      });

      promnexaBtn.addEventListener('mouseenter', () => {
        if (promnexaBtn) {
          promnexaBtn.style.transform = 'scale(1.08) translateY(-2px)';
          promnexaBtn.style.boxShadow = '0 8px 24px rgba(129, 124, 245, 0.6)';
        }
      });

      promnexaBtn.addEventListener('mouseleave', () => {
        if (promnexaBtn) {
          promnexaBtn.style.transform = 'scale(1) translateY(0)';
          promnexaBtn.style.boxShadow = '0 4px 16px rgba(129, 124, 245, 0.45)';
        }
      });

      promnexaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOptimizerCard();
      });

      document.body.appendChild(promnexaBtn);
    }

    // Toggle the in-page optimizer card overlay
    function toggleOptimizerCard() {
      if (promnexaCard) {
        closeOptimizerCard();
      } else {
        openOptimizerCard();
      }
    }

    // Close the card
    function closeOptimizerCard() {
      if (promnexaCard) {
        promnexaCard.style.opacity = '0';
        promnexaCard.style.transform = 'translateY(8px) scale(0.97)';
        setTimeout(() => {
          promnexaCard?.remove();
          promnexaCard = null;
        }, 150);
      }
    }

    // Open the card with interactive instant optimization
    function openOptimizerCard() {
      if (promnexaCard) promnexaCard.remove();

      const rawText = getCurrentPromptText().trim();
      previousOriginalText = rawText;

      const detectedCat: Category = rawText ? detectCategory(rawText) : 'general';
      let currentResult = rawText ? optimizePrompt(rawText, detectedCat, currentMode) : null;

      promnexaCard = document.createElement('div');
      promnexaCard.id = 'promnexa-quick-card';

      Object.assign(promnexaCard.style, {
        position: 'fixed',
        bottom: '136px',
        right: '24px',
        width: '380px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: '480px',
        borderRadius: '16px',
        background: '#181A20',
        color: '#F4F4F6',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
        zIndex: '2147483645',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        opacity: '0',
        transform: 'translateY(8px) scale(0.97)',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      });

      // Render the inner HTML
      function renderCardContent() {
        if (!promnexaCard) return;

        const modes: { key: OptimizationMode; label: string }[] = [
          { key: 'quick', label: 'Quick' },
          { key: 'deep', label: 'Deep' },
          { key: 'expert', label: 'Expert' },
          { key: 'beginner', label: 'Beginner' },
        ];

        let bodyHtml = '';

        if (currentResult) {
          bodyHtml = `
            <div style="padding: 12px 14px 4px;">
              <div style="display: flex; gap: 6px; margin-bottom: 10px;">
                ${modes
                  .map(
                    (m) => `
                  <button class="pmx-mode-btn" data-mode="${m.key}" style="
                    flex: 1;
                    padding: 5px 0;
                    border-radius: 8px;
                    border: 1px solid ${m.key === currentMode ? '#817CF5' : 'rgba(255,255,255,0.08)'};
                    background: ${m.key === currentMode ? 'rgba(129,124,245,0.2)' : '#22252D'};
                    color: ${m.key === currentMode ? '#A5B4FC' : '#9CA3AF'};
                    font-size: 11px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease;
                  ">${m.label}</button>
                `
                  )
                  .join('')}
              </div>

              <div style="
                background: #111318;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 10px;
                padding: 10px 12px;
                max-height: 200px;
                overflow-y: auto;
                font-size: 12.5px;
                line-height: 1.5;
                color: #E2E8F0;
                white-space: pre-wrap;
                word-break: break-word;
              ">${escapeHtml(currentResult.optimized)}</div>
            </div>

            <div style="
              display: flex;
              gap: 8px;
              padding: 10px 14px 14px;
              background: #181A20;
            ">
              <button id="pmx-btn-insert" style="
                flex: 2;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 8px 12px;
                border-radius: 10px;
                border: none;
                background: linear-gradient(135deg, #817CF5 0%, #6366F1 100%);
                color: white;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.15s ease;
              ">
                ✨ Insert into Chat
              </button>

              <button id="pmx-btn-copy" style="
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                padding: 8px 10px;
                border-radius: 10px;
                border: 1px solid rgba(255,255,255,0.12);
                background: #22252D;
                color: #E2E8F0;
                font-size: 12px;
                cursor: pointer;
              ">
                📋 Copy
              </button>
            </div>
          `;
        } else {
          // Empty input state with quick templates
          bodyHtml = `
            <div style="padding: 14px;">
              <p style="margin: 0 0 10px 0; color: #9CA3AF; font-size: 12px;">
                Type a prompt into the chat box, or choose a one-click starter template:
              </p>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <button class="pmx-starter-btn" data-text="Review and debug this code, explain any errors, and provide a clean fix." style="
                  text-align: left;
                  padding: 8px 10px;
                  background: #22252D;
                  border: 1px solid rgba(255,255,255,0.06);
                  border-radius: 8px;
                  color: #E2E8F0;
                  font-size: 12px;
                  cursor: pointer;
                ">💻 <strong>Debug Code:</strong> Review and fix errors</button>

                <button class="pmx-starter-btn" data-text="Explain this concept in simple terms with an intuitive real-world analogy." style="
                  text-align: left;
                  padding: 8px 10px;
                  background: #22252D;
                  border: 1px solid rgba(255,255,255,0.06);
                  border-radius: 8px;
                  color: #E2E8F0;
                  font-size: 12px;
                  cursor: pointer;
                ">🎓 <strong>Explain Concept:</strong> Simple analogies</button>

                <button class="pmx-starter-btn" data-text="Draft a clear, courteous, and professional email requesting an update." style="
                  text-align: left;
                  padding: 8px 10px;
                  background: #22252D;
                  border: 1px solid rgba(255,255,255,0.06);
                  border-radius: 8px;
                  color: #E2E8F0;
                  font-size: 12px;
                  cursor: pointer;
                ">✉️ <strong>Professional Email:</strong> Courteous & clear</button>

                <button class="pmx-starter-btn" data-text="Create a comprehensive, step-by-step beginner-to-advanced learning roadmap." style="
                  text-align: left;
                  padding: 8px 10px;
                  background: #22252D;
                  border: 1px solid rgba(255,255,255,0.06);
                  border-radius: 8px;
                  color: #E2E8F0;
                  font-size: 12px;
                  cursor: pointer;
                ">📚 <strong>Learning Roadmap:</strong> Step-by-step mastery</button>
              </div>
            </div>
          `;
        }

        promnexaCard!.innerHTML = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            background: #1E2028;
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="
                width: 22px;
                height: 22px;
                border-radius: 6px;
                background: linear-gradient(135deg, #817CF5 0%, #6366F1 100%);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="12" height="12" viewBox="0 0 32 32" fill="none">
                  <path d="M10 20L14 12H18L22 20" stroke="white" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="16" cy="9" r="2" fill="white"/>
                </svg>
              </div>
              <span style="font-weight: 600; font-size: 13px; color: #F4F4F6;">Promnexa</span>
              ${
                rawText
                  ? `<span style="
                padding: 2px 7px;
                border-radius: 10px;
                font-size: 10px;
                background: rgba(129,124,245,0.15);
                color: #A5B4FC;
                text-transform: capitalize;
              ">${detectedCat}</span>`
                  : ''
              }
            </div>

            <button id="pmx-close-btn" style="
              border: none;
              background: transparent;
              color: #9CA3AF;
              cursor: pointer;
              font-size: 16px;
              padding: 2px 6px;
              border-radius: 4px;
              line-height: 1;
            ">✕</button>
          </div>

          ${bodyHtml}
        `;

        // Attach event handlers inside card
        const closeBtn = promnexaCard!.querySelector('#pmx-close-btn');
        closeBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          closeOptimizerCard();
        });

        // Mode switch buttons
        promnexaCard!.querySelectorAll('.pmx-mode-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetMode = (btn as HTMLElement).dataset.mode as OptimizationMode;
            if (targetMode && rawText) {
              currentMode = targetMode;
              currentResult = optimizePrompt(rawText, detectedCat, targetMode);
              renderCardContent();
            }
          });
        });

        // Insert into chat
        const insertBtn = promnexaCard!.querySelector('#pmx-btn-insert');
        insertBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (currentResult) {
            setPromptText(currentResult.optimized);
            showNotification('✨ Prompt optimized and inserted into chat!');
            closeOptimizerCard();
          }
        });

        // Copy button
        const copyBtn = promnexaCard!.querySelector('#pmx-btn-copy');
        copyBtn?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (currentResult) {
            try {
              await navigator.clipboard.writeText(currentResult.optimized);
              copyBtn.textContent = '✓ Copied!';
              setTimeout(() => {
                if (copyBtn) copyBtn.textContent = '📋 Copy';
              }, 1500);
            } catch {
              showNotification('Failed to copy to clipboard.');
            }
          }
        });

        // Starter template buttons
        promnexaCard!.querySelectorAll('.pmx-starter-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const starterText = (btn as HTMLElement).dataset.text || '';
            if (starterText) {
              const cat = detectCategory(starterText);
              currentResult = optimizePrompt(starterText, cat, currentMode);
              renderCardContent();
            }
          });
        });
      }

      renderCardContent();
      document.body.appendChild(promnexaCard);

      // Animate card in
      requestAnimationFrame(() => {
        if (promnexaCard) {
          promnexaCard.style.opacity = '1';
          promnexaCard.style.transform = 'translateY(0) scale(1)';
        }
      });
    }

    // Helper to escape HTML characters
    function escapeHtml(str: string): string {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Floating subtle toast notification
    function showNotification(message: string) {
      const existing = document.getElementById('promnexa-notification');
      if (existing) existing.remove();

      const notification = document.createElement('div');
      notification.id = 'promnexa-notification';
      notification.textContent = message;

      Object.assign(notification.style, {
        position: 'fixed',
        bottom: '136px',
        right: '24px',
        maxWidth: '280px',
        padding: '10px 14px',
        borderRadius: '10px',
        background: '#1F2937',
        color: '#F9FAFB',
        fontSize: '12px',
        fontWeight: '500',
        fontFamily: 'Inter, -apple-system, sans-serif',
        zIndex: '2147483647',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        opacity: '0',
        transform: 'translateY(6px)',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      });

      document.body.appendChild(notification);

      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      });

      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(6px)';
        setTimeout(() => notification.remove(), 180);
      }, 3000);
    }

    // Global click listener to close card on outside click
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (
        promnexaCard &&
        !promnexaCard.contains(target) &&
        !promnexaBtn?.contains(target)
      ) {
        closeOptimizerCard();
      }
    });

    // Keyboard shortcut within page: Alt+Shift+P toggles the card
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        toggleOptimizerCard();
      }
    });

    // Initialize content script
    async function init() {
      isEnabled = await checkEnabled();
      if (isEnabled) {
        createFloatingButton();
      }
    }

    // React to settings changes
    browser.storage.onChanged.addListener(async (changes) => {
      if (changes.promnexa_settings) {
        isEnabled = await checkEnabled();
        if (isEnabled) {
          createFloatingButton();
        } else {
          promnexaBtn?.remove();
          promnexaBtn = null;
          closeOptimizerCard();
        }
      }
    });

    init();
  },
});
