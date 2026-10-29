import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  hooks: {
    "zip:start": (wxt) => {
      // Reviewers must be able to run the npm test command from the source ZIP.
      wxt.config.zip.excludeSources = wxt.config.zip.excludeSources.filter(
        (pattern) =>
          !pattern.includes("(test|spec)") && !pattern.includes("__tests__"),
      );
    },
  },
  manifest: ({ browser }) => ({
    name: "Promnexa — AI Prompt Optimizer",
    description:
      "Turn ideas into better prompts. Create reusable prompts and bilingual client briefs with local tools or your own AI provider.",
    version: "1.2.0",
    homepage_url: "https://github.com/AyonO1/Promnexa",
    permissions: ["storage", "contextMenus", "activeTab"],
    host_permissions: [
      "https://api.openai.com/*",
      "https://api.anthropic.com/*",
      "https://generativelanguage.googleapis.com/*",
    ],
    icons: {
      16: "/icon/16.png",
      32: "/icon/32.png",
      48: "/icon/48.png",
      128: "/icon/128.png",
    },
    action: {
      default_title: "Promnexa — AI Prompt Optimizer",
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Ctrl+Shift+P",
          mac: "Command+Shift+P",
        },
        description: "Open Promnexa",
      },
    },
    browser_specific_settings:
      browser === "firefox"
        ? {
            gecko: {
              id: "promnexa@promnexa.com",
              strict_min_version: "140.0",
              data_collection_permissions: {
                required: ["none"],
                optional: [
                  "authenticationInfo",
                  "websiteContent",
                  "personalCommunications",
                ],
              },
            },
            gecko_android: { strict_min_version: "142.0" },
          }
        : undefined,
  }),
});
