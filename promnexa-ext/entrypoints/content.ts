/**
 * Promnexa Content Script
 * Provides optional integration with AI chat websites.
 * Only activates on supported sites when enabled in settings.
 */

export default defineContentScript({
  matches: [
    '*://chatgpt.com/*',
    '*://chat.openai.com/*',
    '*://claude.ai/*',
    '*://gemini.google.com/*',
    '*://perplexity.ai/*',
    '*://copilot.microsoft.com/*',
    '*://chat.deepseek.com/*',
  ],
  runAt: 'document_idle',

  main() {
    let promnexaBtn: HTMLElement | null = null;
    let isEnabled = false;

    // Check if integration is enabled for this site
    async function checkEnabled() {
      try {
        const result = (await browser.storage.local.get('promnexa_settings')) as Record<string, any>;
        const settings = result.promnexa_settings;
        if (!settings || !Array.isArray(settings.websiteIntegrations)) return false;

        const hostname = window.location.hostname;
        const integration = settings.websiteIntegrations.find(
          (i: { site: string; enabled: boolean }) =>
            hostname.includes(i.site)
        );
        return integration?.enabled || false;
      } catch {
        return false;
      }
    }

    // Create the floating Promnexa button
    function createFloatingButton() {
      if (promnexaBtn) return;

      promnexaBtn = document.createElement('div');
      promnexaBtn.id = 'promnexa-float-btn';
      promnexaBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2L28.1244 9V23L16 30L3.87564 23V9L16 2Z" fill="currentColor" opacity="0.2"/>
          <path d="M10 20L14 12H18L22 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 17H20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="16" cy="9" r="1.5" fill="currentColor"/>
        </svg>
      `;
      promnexaBtn.title = 'Optimize with Promnexa';

      // Styles for the floating button
      Object.assign(promnexaBtn.style, {
        position: 'fixed',
        bottom: '80px',
        right: '24px',
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: '#817CF5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: '99999',
        boxShadow: '0 4px 12px rgba(129, 124, 245, 0.4)',
        transition: 'all 0.2s ease',
        border: 'none',
        outline: 'none',
      });

      promnexaBtn.addEventListener('mouseenter', () => {
        if (promnexaBtn) {
          promnexaBtn.style.transform = 'scale(1.05)';
          promnexaBtn.style.boxShadow = '0 6px 16px rgba(129, 124, 245, 0.5)';
        }
      });

      promnexaBtn.addEventListener('mouseleave', () => {
        if (promnexaBtn) {
          promnexaBtn.style.transform = 'scale(1)';
          promnexaBtn.style.boxShadow = '0 4px 12px rgba(129, 124, 245, 0.4)';
        }
      });

      promnexaBtn.addEventListener('click', () => {
        handleOptimizeClick();
      });

      document.body.appendChild(promnexaBtn);
    }

    // Remove the floating button
    function removeFloatingButton() {
      if (promnexaBtn) {
        promnexaBtn.remove();
        promnexaBtn = null;
      }
    }

    // Get the current prompt text from the AI site's input
    function getCurrentPromptText(): string {
      // Common selectors for AI chat inputs
      const selectors = [
        // ChatGPT
        'textarea[data-id="root"]',
        '#prompt-textarea',
        'div[contenteditable="true"][data-placeholder]',
        // Claude
        'div.ProseMirror[contenteditable="true"]',
        // Gemini
        'div[contenteditable="true"].ql-editor',
        '.text-input-field textarea',
        // Generic
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="message"]',
        'div[contenteditable="true"]',
        'textarea',
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector) as HTMLElement;
        if (el) {
          if (el instanceof HTMLTextAreaElement) {
            return el.value;
          }
          return el.innerText || el.textContent || '';
        }
      }

      return '';
    }

    // Set text into the AI site's input
    function setPromptText(text: string) {
      const selectors = [
        'textarea[data-id="root"]',
        '#prompt-textarea',
        'div[contenteditable="true"][data-placeholder]',
        'div.ProseMirror[contenteditable="true"]',
        'div[contenteditable="true"].ql-editor',
        '.text-input-field textarea',
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="message"]',
        'div[contenteditable="true"]',
        'textarea',
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector) as HTMLElement;
        if (el) {
          if (el instanceof HTMLTextAreaElement) {
            el.value = text;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            el.innerText = text;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
          return true;
        }
      }

      return false;
    }

    // Handle the optimize button click
    async function handleOptimizeClick() {
      const currentText = getCurrentPromptText();

      if (!currentText.trim()) {
        // Show a subtle notification
        showNotification('Type a prompt first, then click to optimize.');
        return;
      }

      // Send to background for optimization
      try {
        await browser.runtime.sendMessage({
          type: 'PROMNEXA_OPTIMIZE',
          text: currentText,
        });
        showNotification('Open Promnexa to see the optimized prompt! (Ctrl+Shift+P)');
      } catch {
        showNotification('Error connecting to Promnexa.');
      }
    }

    // Show a small notification near the floating button
    function showNotification(message: string) {
      const existing = document.getElementById('promnexa-notification');
      if (existing) existing.remove();

      const notification = document.createElement('div');
      notification.id = 'promnexa-notification';
      notification.textContent = message;

      Object.assign(notification.style, {
        position: 'fixed',
        bottom: '130px',
        right: '24px',
        maxWidth: '260px',
        padding: '8px 12px',
        borderRadius: '8px',
        background: '#22252D',
        color: '#F4F4F5',
        fontSize: '12px',
        fontFamily: 'Inter, -apple-system, sans-serif',
        zIndex: '99999',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        opacity: '0',
        transform: 'translateY(4px)',
        transition: 'all 0.2s ease',
      });

      document.body.appendChild(notification);

      // Animate in
      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      });

      // Auto-remove
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(4px)';
        setTimeout(() => notification.remove(), 200);
      }, 3000);
    }

    // Initialize
    async function init() {
      isEnabled = await checkEnabled();
      if (isEnabled) {
        createFloatingButton();
      }
    }

    // Listen for setting changes
    browser.storage.onChanged.addListener(async (changes) => {
      if (changes.promnexa_settings) {
        isEnabled = await checkEnabled();
        if (isEnabled) {
          createFloatingButton();
        } else {
          removeFloatingButton();
        }
      }
    });

    init();
  },
});
