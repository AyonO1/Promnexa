import { findEditor, usableEditor } from "../lib/editor-target";
import { matchesShortcut } from "../lib/shortcuts";
import { scanSensitiveInfo } from "../lib/sensitive-info";
/**
 * Promnexa Content Script
 * Seamless in-page AI assistant for ChatGPT, Claude, Gemini, DeepSeek, Copilot, and Grok.
 * Provides an interactive floating optimizer button and instant in-page prompt enhancement.
 */

import { optimizePrompt, detectCategory } from "../lib/optimizer";
import type { Category, OptimizationMode } from "../lib/types";

export default defineContentScript({
  matches: [
    "*://chatgpt.com/*",
    "*://chat.openai.com/*",
    "*://claude.ai/*",
    "*://gemini.google.com/*",
    "*://perplexity.ai/*",
    "*://copilot.microsoft.com/*",
    "*://chat.deepseek.com/*",
    "*://grok.com/*",
    "*://x.com/i/grok*",
  ],
  runAt: "document_idle",

  main() {
    let promnexaBtn: HTMLElement | null = null;
    let promnexaCard: HTMLElement | null = null;
    let isEnabled = false;
    let promnexaControls: HTMLElement | null = null;
    let undoButton: HTMLButtonElement | null = null;
    let lastChange: {
      element: HTMLElement;
      original: string;
      improved: string;
      url: string;
    } | null = null;
    let currentMode: OptimizationMode = "quick";

    let publicSettings = {
      websiteIntegrations: [] as { site: string; enabled: boolean }[],
      defaultMode: "quick" as OptimizationMode,
      inlineShortcut: "Alt+Shift+P",
      language: "en",
      maxAiInputCharacters: 20000,
    };
    let lastFocusedEditor: HTMLElement | null = null;
    document.addEventListener("focusin", (event) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(
              'textarea,input,[contenteditable="true"]',
            )
          : null;
      if (usableEditor(target)) lastFocusedEditor = target;
    });
    async function checkEnabled(
      settings?: typeof publicSettings,
    ): Promise<boolean> {
      try {
        const data =
          settings ||
          (
            await browser.runtime.sendMessage({
              type: "PROMNEXA_PUBLIC_SETTINGS",
            })
          )?.settings;
        if (data) {
          publicSettings = data;
          currentMode = data.defaultMode;
        }
        const aliases: Record<string, string> = {
          "chat.openai.com": "chatgpt.com",
          "x.com": "grok.com",
        };
        const host = aliases[location.hostname] || location.hostname;
        const integration = publicSettings.websiteIntegrations.find(
          (i) => i.site === host,
        );
        return integration ? integration.enabled : true;
      } catch {
        return false;
      }
    }
    function getActiveInputElement(): HTMLElement | null {
      return findEditor(document, location.hostname, lastFocusedEditor);
    }

    // Read current text from the AI site's chat input
    function getCurrentPromptText(): string {
      return readPrompt(getActiveInputElement());
    }

    function readPrompt(el: HTMLElement | null): string {
      if (!el) return "";
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        return el.value || "";
      }
      return el.innerText || el.textContent || "";
    }

    // Insert text into the AI site's chat input with full synthetic event dispatch
    function setPromptText(
      text: string,
      el = getActiveInputElement(),
    ): boolean {
      if (!el?.isConnected) return false;

      el.focus();

      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        const proto =
          el instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (setter) setter.call(el, text);
        else el.value = text;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }

      // For contenteditable elements (Claude, Gemini, modern ChatGPT)
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        selection?.removeAllRanges();
        selection?.addRange(range);
        if (document.execCommand("insertText", false, text)) return true;
        el.innerText = text;
        el.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: text,
          }),
        );
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      } catch {
        el.textContent = text;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      }
    }

    function syncUndo() {
      if (!undoButton) return;
      const available =
        lastChange &&
        lastChange.url === location.href &&
        lastChange.element.isConnected &&
        getActiveInputElement() === lastChange.element;
      undoButton.style.display = available ? "inline-flex" : "none";
      undoButton.disabled =
        !available || readPrompt(lastChange!.element) !== lastChange!.improved;
      undoButton.title = undoButton.disabled
        ? "Your draft changed; Undo will not overwrite your edits."
        : "Restore your exact original prompt";
    }

    function applyImprovement(
      improved: string,
      element: HTMLElement | null,
      original: string,
    ): boolean {
      if (
        !isEnabled ||
        !element?.isConnected ||
        getActiveInputElement() !== element ||
        readPrompt(element) !== original
      ) {
        showNotification(
          "Your draft changed. Improve the current prompt again; your edits were kept.",
        );
        return false;
      }
      if (improved === original || improved === original.trim()) {
        showNotification(
          "This prompt already fits. Review it and press Send when ready.",
        );
        return true;
      }
      if (!setPromptText(improved, element)) {
        showNotification(
          "Could not update the chat input. Your original draft was kept.",
        );
        return false;
      }
      // Rich editors can normalize line breaks; guard against the text actually inserted.
      lastChange = {
        element,
        original,
        improved: readPrompt(element),
        url: location.href,
      };
      syncUndo();
      showNotification(
        "Prompt improved. Review it, then press Send. Undo restores the original.",
      );
      return true;
    }

    function improveInChat() {
      if (!isEnabled) return;
      const element = getActiveInputElement();
      if (!element) {
        showNotification("No editable chat input found.");
        return;
      }
      const original = readPrompt(element);
      if (!original.trim()) {
        showNotification("Type your prompt in the chat box first.");
        element.focus();
        return;
      }
      if (
        lastChange?.element === element &&
        lastChange.url === location.href &&
        lastChange.improved === original
      ) {
        showNotification(
          "Already improved. Review and send, or use Undo to restore your original.",
        );
        return;
      }
      closeOptimizerCard();
      try {
        applyImprovement(
          optimizePrompt(original, detectCategory(original), currentMode)
            .optimized,
          element,
          original,
        );
      } catch (error) {
        showNotification(
          (error as Error).message || "Could not improve this prompt.",
        );
      }
    }

    function undoImprovement() {
      const change = lastChange;
      if (
        !change ||
        change.url !== location.href ||
        !change.element.isConnected ||
        getActiveInputElement() !== change.element ||
        readPrompt(change.element) !== change.improved
      ) {
        showNotification(
          "Your draft changed. Undo will not overwrite your edits.",
        );
        syncUndo();
        return;
      }
      if (setPromptText(change.original, change.element)) {
        lastChange = null;
        syncUndo();
        showNotification("Original prompt restored.");
      }
    }

    // Create the floating Promnexa trigger button
    function createFloatingButton() {
      if (promnexaBtn) {
        promnexaBtn.title = `Improve prompt locally in this chat (${publicSettings.inlineShortcut}). Review before sending.`;
        return;
      }

      promnexaBtn = document.createElement("button");
      (promnexaBtn as HTMLButtonElement).type = "button";
      promnexaBtn.id = "promnexa-float-btn";
      promnexaBtn.setAttribute("role", "button");
      promnexaBtn.setAttribute("tabindex", "0");
      promnexaBtn.title = `Improve prompt locally in this chat (${publicSettings.inlineShortcut}). Review before sending.`;
      promnexaBtn.setAttribute("aria-label", "Improve prompt");

      promnexaBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2L28.1244 9V23L16 30L3.87564 23V9L16 2Z" fill="white" opacity="0.25"/>
          <path d="M10 20L14 12H18L22 20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 17H20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="16" cy="9" r="1.5" fill="white"/>
        </svg><span>Improve prompt</span>
      `;

      Object.assign(promnexaBtn.style, {
        position: "fixed",
        bottom: "84px",
        right: "24px",
        width: "42px",
        height: "42px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, #817CF5 0%, #6366F1 100%)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: "2147483640",
        boxShadow: "0 4px 16px rgba(129, 124, 245, 0.45)",
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        outline: "none",
        userSelect: "none",
      });

      promnexaBtn.addEventListener("mouseenter", () => {
        if (promnexaBtn) {
          promnexaBtn.style.transform = "scale(1.08) translateY(-2px)";
          promnexaBtn.style.boxShadow = "0 8px 24px rgba(129, 124, 245, 0.6)";
        }
      });

      promnexaBtn.addEventListener("mouseleave", () => {
        if (promnexaBtn) {
          promnexaBtn.style.transform = "scale(1) translateY(0)";
          promnexaBtn.style.boxShadow = "0 4px 16px rgba(129, 124, 245, 0.45)";
        }
      });

      promnexaBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        improveInChat();
      });

      promnexaControls = document.createElement("div");
      promnexaControls.id = "promnexa-controls";
      promnexaControls.dataset.promnexaUi = "true";
      Object.assign(promnexaControls.style, {
        position: "fixed",
        bottom: "84px",
        right: "24px",
        display: "flex",
        gap: "6px",
        alignItems: "center",
        zIndex: "2147483640",
        maxWidth: "calc(100vw - 32px)",
      });
      Object.assign(promnexaBtn.style, {
        position: "relative",
        bottom: "auto",
        right: "auto",
        width: "auto",
        padding: "0 12px",
        gap: "6px",
        fontSize: "12px",
        fontFamily: "system-ui, sans-serif",
        whiteSpace: "nowrap",
      });
      const options = document.createElement("button");
      options.id = "promnexa-options-btn";
      options.type = "button";
      options.textContent = "Options";
      options.title =
        "Preview modes or explicitly use your configured AI provider";
      undoButton = document.createElement("button");
      undoButton.id = "promnexa-undo-btn";
      undoButton.type = "button";
      undoButton.textContent = "Undo";
      for (const control of [options, undoButton])
        Object.assign(control.style, {
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid #817CF5",
          background: "#181A20",
          color: "#F4F4F6",
          cursor: "pointer",
          font: "12px system-ui, sans-serif",
        });
      undoButton.addEventListener("click", (e) => {
        e.stopPropagation();
        undoImprovement();
      });
      options.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isEnabled) toggleOptimizerCard();
      });
      promnexaControls.append(promnexaBtn, undoButton, options);
      document.body.appendChild(promnexaControls);
      syncUndo();
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
        promnexaCard.style.opacity = "0";
        promnexaCard.style.transform = "translateY(8px) scale(0.97)";
        const closing = promnexaCard;
        promnexaCard = null;
        closing.remove();
      }
    }

    // Open the card with interactive instant optimization
    function openOptimizerCard() {
      if (promnexaCard) promnexaCard.remove();

      const originalElement = getActiveInputElement();
      const originalDraft = readPrompt(originalElement);
      const rawText = originalDraft.trim();

      const detectedCat: Category = rawText
        ? detectCategory(rawText)
        : "general";
      let aiRequest = 0;
      let currentResult = rawText
        ? optimizePrompt(rawText, detectedCat, currentMode)
        : null;

      promnexaCard = document.createElement("div");
      promnexaCard.id = "promnexa-quick-card";

      Object.assign(promnexaCard.style, {
        position: "fixed",
        bottom: "136px",
        right: "24px",
        width: "380px",
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "480px",
        borderRadius: "16px",
        background: "#181A20",
        color: "#F4F4F6",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: "13px",
        zIndex: "2147483645",
        boxShadow:
          "0 12px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        opacity: "0",
        transform: "translateY(8px) scale(0.97)",
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
      });

      // Render the inner HTML
      function renderCardContent() {
        if (!promnexaCard) return;

        const modes: { key: OptimizationMode; label: string }[] = [
          { key: "quick", label: "Quick" },
          { key: "deep", label: "Deep" },
          { key: "expert", label: "Expert" },
          { key: "beginner", label: "Beginner" },
        ];

        let bodyHtml = "";

        if (currentResult) {
          bodyHtml = `
            <div style="padding: 12px 14px 4px;">
              <button id="pmx-ai" style="padding:6px;margin-bottom:8px;background:#22252D;color:#E2E8F0;border:1px solid #817CF5;border-radius:6px;cursor:pointer">Use configured AI (sends this prompt to your provider)</button>
              <div style="display: flex; gap: 6px; margin-bottom: 10px;">
                ${modes
                  .map(
                    (m) => `
                  <button class="pmx-mode-btn" data-mode="${m.key}" style="
                    flex: 1;
                    padding: 5px 0;
                    border-radius: 8px;
                    border: 1px solid ${m.key === currentMode ? "#817CF5" : "rgba(255,255,255,0.08)"};
                    background: ${m.key === currentMode ? "rgba(129,124,245,0.2)" : "#22252D"};
                    color: ${m.key === currentMode ? "#A5B4FC" : "#9CA3AF"};
                    font-size: 11px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease;
                  ">${m.label}</button>
                `,
                  )
                  .join("")}
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
                  : ""
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

          <div style="padding:6px 14px;font-size:11px;color:#A5B4FC" role="status">${currentResult?.engine === "ai" ? "AI provider" : "Local engine"}${currentResult?.status === "unchanged" ? " · No safe improvement needed" : ""}</div>
          ${bodyHtml}
        `;

        // Attach event handlers inside card
        const closeBtn = promnexaCard!.querySelector("#pmx-close-btn");
        closeBtn?.addEventListener("click", (e) => {
          e.stopPropagation();
          closeOptimizerCard();
        });

        const card = promnexaCard;
        card?.querySelector("#pmx-ai")?.addEventListener("click", async (e) => {
          e.stopPropagation();
          const button = e.currentTarget as HTMLButtonElement;
          if (rawText.length > publicSettings.maxAiInputCharacters) {
            showNotification(
              "Prompt exceeds your AI input limit. Shorten it or use the local engine.",
            );
            return;
          }
          const findings = scanSensitiveInfo(rawText);
          if (
            findings.length &&
            !confirm(
              "This prompt may contain " +
                [...new Set(findings.map((f) => f.kind))].join(", ") +
                ". Send this information to your configured AI provider? Cancel to keep it local.",
            )
          )
            return;
          const request = ++aiRequest;
          button.disabled = true;
          button.textContent = "Optimizing with AI…";
          try {
            const response = await browser.runtime.sendMessage({
              type: "PROMNEXA_AI",
              sensitiveConsent: findings.length > 0,
              text: rawText,
              category: detectedCat,
              mode: currentMode,
            });
            if (promnexaCard !== card || request !== aiRequest) return;
            if (!response?.result)
              throw new Error(response?.error || "AI unavailable");
            currentResult = response.result;
            renderCardContent();
            showNotification("AI optimization ready.");
          } catch (error) {
            if (promnexaCard === card && request === aiRequest) {
              button.disabled = false;
              button.textContent = "Retry configured AI";
              showNotification(
                (error as Error).message + " Local result is still available.",
              );
            }
          }
        });
        // Mode switch buttons
        promnexaCard!.querySelectorAll(".pmx-mode-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const targetMode = (btn as HTMLElement).dataset
              .mode as OptimizationMode;
            if (targetMode && rawText) {
              aiRequest++;
              currentMode = targetMode;
              currentResult = optimizePrompt(rawText, detectedCat, targetMode);
              renderCardContent();
            }
          });
        });

        // Insert into chat
        const insertBtn = promnexaCard!.querySelector("#pmx-btn-insert");
        insertBtn?.addEventListener("click", (e) => {
          e.stopPropagation();
          if (currentResult) {
            if (
              !applyImprovement(
                currentResult.optimized,
                originalElement,
                originalDraft,
              )
            )
              return;
            closeOptimizerCard();
          }
        });

        // Copy button
        const copyBtn = promnexaCard!.querySelector("#pmx-btn-copy");
        copyBtn?.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (currentResult) {
            try {
              await navigator.clipboard.writeText(currentResult.optimized);
              copyBtn.textContent = "✓ Copied!";
              setTimeout(() => {
                if (copyBtn) copyBtn.textContent = "📋 Copy";
              }, 1500);
            } catch {
              showNotification("Failed to copy to clipboard.");
            }
          }
        });

        // Starter template buttons
        promnexaCard!.querySelectorAll(".pmx-starter-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const starterText = (btn as HTMLElement).dataset.text || "";
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
          promnexaCard.style.opacity = "1";
          promnexaCard.style.transform = "translateY(0) scale(1)";
        }
      });
    }

    // Helper to escape HTML characters
    function escapeHtml(str: string): string {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Floating subtle toast notification
    function showNotification(message: string) {
      const existing = document.getElementById("promnexa-notification");
      if (existing) existing.remove();

      const notification = document.createElement("div");
      notification.id = "promnexa-notification";
      notification.textContent = message;

      Object.assign(notification.style, {
        position: "fixed",
        bottom: "136px",
        right: "24px",
        maxWidth: "280px",
        padding: "10px 14px",
        borderRadius: "10px",
        background: "#1F2937",
        color: "#F9FAFB",
        fontSize: "12px",
        fontWeight: "500",
        fontFamily: "Inter, -apple-system, sans-serif",
        zIndex: "2147483647",
        boxShadow:
          "0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
        opacity: "0",
        transform: "translateY(6px)",
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
      });

      document.body.appendChild(notification);

      requestAnimationFrame(() => {
        notification.style.opacity = "1";
        notification.style.transform = "translateY(0)";
      });

      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateY(6px)";
        setTimeout(() => notification.remove(), 180);
      }, 3000);
    }

    // Global click listener to close card on outside click
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (
        promnexaCard &&
        !promnexaCard.contains(target) &&
        !promnexaControls?.contains(target)
      ) {
        closeOptimizerCard();
      }
    });

    document.addEventListener("input", syncUndo);
    window.addEventListener("popstate", syncUndo);

    // Keyboard shortcut improves the current draft without submitting it.
    document.addEventListener("keydown", (e) => {
      if (matchesShortcut(e, publicSettings.inlineShortcut)) {
        if (!isEnabled || e.repeat) return;
        e.preventDefault();
        improveInChat();
      }
    });

    // Initialize content script
    async function init() {
      isEnabled = await checkEnabled();
      if (isEnabled) {
        createFloatingButton();
      }
    }

    void init();

    // Only sanitized configuration is exposed to page content scripts.
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type !== "PROMNEXA_PUBLIC_SETTINGS_CHANGED") return;
      checkEnabled(message.settings).then((enabled) => {
        isEnabled = enabled;
        if (enabled) createFloatingButton();
        else {
          promnexaControls?.remove();
          promnexaControls = null;
          promnexaBtn = null;
          undoButton = null;
          lastChange = null;
          closeOptimizerCard();
        }
      });
    });
  },
});
