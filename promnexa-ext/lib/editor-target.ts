const SITE_SELECTORS: Record<string, string[]> = {
  "chatgpt.com": ["#prompt-textarea", 'textarea[data-id="root"]'],
  "chat.openai.com": ["#prompt-textarea", 'textarea[data-id="root"]'],
  "claude.ai": [
    'div.ProseMirror[contenteditable="true"]',
    'fieldset div[contenteditable="true"]',
  ],
  "gemini.google.com": [
    'rich-textarea div[contenteditable="true"]',
    'div.ql-editor[contenteditable="true"]',
  ],
  "chat.deepseek.com": [
    "textarea#chat-input",
    'textarea[placeholder*="DeepSeek"]',
  ],
  "grok.com": [
    'textarea[placeholder*="Ask"]',
    'textarea[placeholder*="Message"]',
  ],
  "x.com": ['textarea[placeholder*="Ask"]'],
  "copilot.microsoft.com": ['textarea[placeholder*="Ask"]'],
  "perplexity.ai": [
    'textarea[placeholder*="Ask"]',
    'div[role="textbox"][contenteditable="true"]',
  ],
};
export function usableEditor(el: HTMLElement | null): el is HTMLElement {
  if (
    !el?.isConnected ||
    el.offsetParent === null ||
    el.closest("[data-promnexa-ui],#promnexa-quick-card")
  )
    return false;
  return el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement
    ? !el.disabled && !el.readOnly
    : el.isContentEditable;
}
export function findEditor(
  doc: Document,
  hostname: string,
  lastFocused: HTMLElement | null,
): HTMLElement | null {
  const specific = [
    ...new Set(
      (SITE_SELECTORS[hostname] || []).flatMap((s) => [
        ...doc.querySelectorAll<HTMLElement>(s),
      ]),
    ),
  ].filter(usableEditor);
  if (specific.length) {
    if (lastFocused && specific.includes(lastFocused)) return lastFocused;
    return specific.length === 1 ? specific[0]! : null;
  }
  const fallback = [
    ...doc.querySelectorAll<HTMLElement>(
      'textarea,div[contenteditable="true"][role="textbox"],div.ProseMirror[contenteditable="true"]',
    ),
  ].filter(usableEditor);
  if (lastFocused && fallback.includes(lastFocused)) return lastFocused;
  return fallback.length === 1 ? fallback[0]! : null;
}
