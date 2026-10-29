import { optimizeWithAI } from "../lib/ai-provider";
import {
  getSettings,
  getPublicSettings,
  initializeStoragePrivacy,
} from "../lib/storage";
import { ProviderError, safeProviderError } from "../lib/provider-errors.ts";
import { scanSensitiveInfo } from "../lib/sensitive-info.ts";
import {
  queueContextAction,
  consumeContextAction,
} from "../lib/context-actions.ts";
export default defineBackground(() => {
  const storageReady = initializeStoragePrivacy();
  storageReady.catch(() =>
    console.error("Promnexa storage privacy initialization failed."),
  );
  // Context menu setup
  browser.runtime.onInstalled.addListener(async () => {
    await storageReady;
    await browser.contextMenus.removeAll();
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
    if (selectedText.length > 100000) {
      const url =
        browser.runtime.getURL("/popup.html") + "?error=selection-too-long";
      try {
        await browser.windows.create({
          url,
          type: "popup",
          width: 460,
          height: 650,
        });
      } catch {
        await browser.tabs.create({ url });
      }
      return;
    }

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
      await storageReady;
      const id = crypto.randomUUID();
      await queueContextAction({
        id,
        action: action as
          | "optimize"
          | "explain"
          | "summarize"
          | "create-prompt",
        text: selectedText,
        timestamp: Date.now(),
        sourceTabId: tab?.id,
      });
      const url = browser.runtime.getURL("/popup.html") + "?context=" + id;
      const actionApi = browser.action || (browser as any).browserAction;
      try {
        if (!actionApi?.openPopup) throw new Error("No popup API");
        await actionApi.setPopup({ tabId: tab?.id, popup: url });
        try {
          await actionApi.openPopup(
            tab?.windowId ? { windowId: tab.windowId } : undefined,
          );
        } finally {
          await actionApi.setPopup({ tabId: tab?.id, popup: "popup.html" });
        }
      } catch {
        try {
          await browser.windows.create({
            url,
            type: "popup",
            width: 460,
            height: 650,
          });
        } catch {
          try {
            await browser.tabs.create({ url });
          } catch {
            await actionApi?.setBadgeText({ text: "!", tabId: tab?.id });
            await actionApi?.setTitle({
              title:
                "Open Promnexa to view the selected text (expires in 2 minutes).",
              tabId: tab?.id,
            });
          }
        }
      }
    }
  });

  // API keys stay in the extension context; page requests supply only prompt data.
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== browser.runtime.id) return false;
    const trustedPage = !!sender.url?.startsWith(browser.runtime.getURL("/"));
    if (message?.type === "PROMNEXA_PUBLIC_SETTINGS") {
      storageReady
        .then(() => getPublicSettings())
        .then((settings) => sendResponse({ settings }))
        .catch(() => sendResponse({ error: "Settings unavailable." }));
      return true;
    }
    if (message?.type === "PROMNEXA_CONSUME_CONTEXT") {
      if (!trustedPage) return false;
      storageReady
        .then(() =>
          consumeContextAction(
            typeof message.id === "string" ? message.id : undefined,
          ),
        )
        .then(async (action) => {
          if (action?.sourceTabId !== undefined) {
            try {
              await browser.tabs.get(action.sourceTabId);
            } catch {
              return null;
            }
          }
          return action;
        })
        .then((action) => sendResponse({ action }))
        .catch(() => sendResponse({ action: null }));
      return true;
    }
    if (message?.type !== "PROMNEXA_AI") return false;
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
    const modes = ["quick", "deep", "expert", "beginner"];
    if (
      typeof message.text !== "string" ||
      !message.text.trim() ||
      message.text.length > 100000 ||
      !categories.includes(message.category) ||
      !modes.includes(message.mode)
    ) {
      sendResponse({ error: "Invalid optimization request.", code: "INPUT" });
      return false;
    }
    (async () => {
      await storageReady;
      const settings = await getSettings();
      if (message.text.length > settings.maxAiInputCharacters)
        throw new ProviderError("INPUT");
      if (scanSensitiveInfo(message.text).length && !message.sensitiveConsent)
        throw new ProviderError("SENSITIVE");
      if (!trustedPage) {
        const hostname = new URL(sender.url || sender.tab?.url || "").hostname;
        const aliases: Record<string, string> = {
          "chat.openai.com": "chatgpt.com",
          "x.com": "grok.com",
        };
        const site = aliases[hostname] || hostname;
        const integration = settings.websiteIntegrations.find(
          (i) => i.site === site,
        );
        if (!integration?.enabled) throw new ProviderError("CONSENT");
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
          throw new ProviderError("CONSENT");
      }
      if (!settings.aiProvider?.apiKey) throw new ProviderError("AUTH");
      return optimizeWithAI(
        message.text,
        message.category,
        message.mode,
        settings.aiProvider,
      );
    })()
      .then((result) => sendResponse({ result }))
      .catch((error) => {
        const safe = safeProviderError(error);
        sendResponse({ error: safe.message, code: safe.code });
      });
    return true;
  });
  browser.storage.onChanged.addListener(async (changes, area) => {
    if (
      !(
        (area === "local" && changes.promnexa_settings) ||
        changes.promnexa_credentials
      )
    )
      return;
    try {
      await storageReady;
      const settings = await getPublicSettings();
      const tabs = await browser.tabs.query({});
      await Promise.all(
        tabs.map((tab) =>
          tab.id === undefined
            ? Promise.resolve()
            : browser.tabs
                .sendMessage(tab.id, {
                  type: "PROMNEXA_PUBLIC_SETTINGS_CHANGED",
                  settings,
                })
                .catch(() => {}),
        ),
      );
    } catch {
      /* No credential values are broadcast. */
    }
  });
});
