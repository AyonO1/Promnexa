import { optimizeWithAI } from "../lib/ai-provider";
import { getSettings } from "../lib/storage";
export default defineBackground(() => {
  // Context menu setup
  browser.runtime.onInstalled.addListener(() => {
    // Create context menu items
    const menuItems = [
      {
        id: "promnexa-optimize",
        title: "Optimize with Promnexa",
        contexts: ["selection"] as ["selection"],
      },
      {
        id: "promnexa-explain",
        title: "Explain with Promnexa",
        contexts: ["selection"] as ["selection"],
      },
      {
        id: "promnexa-summarize",
        title: "Summarize with Promnexa",
        contexts: ["selection"] as ["selection"],
      },
      {
        id: "promnexa-create-prompt",
        title: "Create prompt from selection",
        contexts: ["selection"] as ["selection"],
      },
    ];

    for (const item of menuItems) {
      browser.contextMenus.create(item);
    }

    console.log("Promnexa: Context menus created");
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const selectedText = info.selectionText;
    if (!selectedText) return;

    // Store the selected text and action for the popup to use
    let action = "";
    switch (info.menuItemId) {
      case "promnexa-optimize":
        action = "optimize";
        break;
      case "promnexa-explain":
        action = "explain";
        break;
      case "promnexa-summarize":
        action = "summarize";
        break;
      case "promnexa-create-prompt":
        action = "create-prompt";
        break;
    }

    if (action) {
      await browser.storage.local.set({
        promnexa_context_action: {
          action,
          text: selectedText,
          timestamp: Date.now(),
        },
      });

      // Open the popup (via action)
      // Note: browser.action.openPopup() may not be available in all browsers
      // The user can click the extension icon to see the result
    }
  });

  // API keys stay in the extension context; page requests supply only prompt data.
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== browser.runtime.id || message?.type !== "PROMNEXA_AI")
      return false;
    const categories = [
      "education",
      "coding",
      "learning",
      "daily",
      "writing",
      "research",
      "business",
      "general",
    ];
    const modes = ["quick", "deep", "expert", "beginner", "custom"];
    if (
      typeof message.text !== "string" ||
      !message.text.trim() ||
      message.text.length > 100000 ||
      !categories.includes(message.category) ||
      !modes.includes(message.mode)
    ) {
      sendResponse({ error: "Invalid optimization request." });
      return false;
    }
    (async () => {
      const settings = await getSettings();
      if (sender.tab) {
        const hostname = new URL(sender.url || sender.tab.url || "").hostname;
        const aliases: Record<string, string> = {
          "chat.openai.com": "chatgpt.com",
          "x.com": "grok.com",
        };
        const site = aliases[hostname] || hostname;
        const integration = settings.websiteIntegrations.find(
          (i) => i.site === site,
        );
        if (!integration?.enabled)
          throw new Error("Integration disabled for this site.");
      }
      if (import.meta.env.FIREFOX) {
        const consent = (await browser.permissions.getAll()) as any;
        if (
          ![
            "authenticationInfo",
            "websiteContent",
            "personalCommunications",
          ].every((type) => consent.data_collection?.includes(type))
        )
          throw new Error(
            "Enable AI data sharing from the Promnexa popup first.",
          );
      }
      if (!settings.aiProvider?.apiKey)
        throw new Error("Configure an API key in Promnexa Settings first.");
      return optimizeWithAI(
        message.text,
        message.category,
        message.mode,
        settings.aiProvider,
      );
    })()
      .then((result) => sendResponse({ result }))
      .catch(() =>
        sendResponse({
          error:
            "AI request failed, timed out, or returned invalid data. Check your provider settings and quota.",
        }),
      );
    return true;
  });
});
