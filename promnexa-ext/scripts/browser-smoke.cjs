const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PROMNEXA_PLAYWRIGHT || "playwright");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.PROMNEXA_CHROME ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 440, height: 720 },
    });
    const errors = [];
    const network = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (!r.url().startsWith("https://promnexa.test/")) network.push(r.url());
    });
    await page.route("https://promnexa.test/**", async (route) => {
      const rel =
        new URL(route.request().url()).pathname.slice(1) || "popup.html";
      const file = path.resolve(".output/chrome-mv3", rel);
      const body = await fs.readFile(file);
      await route.fulfill({
        body,
        contentType: rel.endsWith(".js")
          ? "application/javascript"
          : rel.endsWith(".css")
            ? "text/css"
            : rel.endsWith(".html")
              ? "text/html"
              : "image/png",
      });
    });
    await page.addInitScript(() => {
      const listeners = new Set();
      const data = {
        promnexa_settings: {
          onboardingComplete: true,
          theme: "dark",
          language: "en",
          showHistory: true,
        },
      };
      window.__apiRequests = [];
      const api = {
        runtime: {
          id: "promnexatest",
          getManifest: () => ({ manifest_version: 3 }),
          sendMessage: async (message) => {
            if (message.type === "PROMNEXA_CONSUME_CONTEXT")
              return { action: null };
            window.__apiRequests.push(structuredClone(message));
            return {
              error: "Provider authentication failed. Check your API key.",
              code: "AUTH",
            };
          },
        },
        storage: {
          local: {
            get: async (key) =>
              typeof key === "string"
                ? { [key]: structuredClone(data[key]) }
                : structuredClone(data),
            set: async (values) => {
              const changes = {};
              for (const [k, v] of Object.entries(values)) {
                changes[k] = {
                  oldValue: structuredClone(data[k]),
                  newValue: structuredClone(v),
                };
                data[k] = structuredClone(v);
              }
              for (const fn of listeners) fn(changes, "local");
            },
            remove: async (key) => {
              delete data[key];
            },
            clear: async () => {
              for (const k of Object.keys(data)) delete data[k];
            },
          },
          onChanged: {
            addListener: (fn) => listeners.add(fn),
            removeListener: (fn) => listeners.delete(fn),
          },
        },
        permissions: { getAll: async () => ({}), request: async () => true },
      };
      window.browser = api;
      window.chrome = api;
      window.__testData = data;
    });
    await page.goto("https://promnexa.test/popup.html");
    await page.getByRole("heading", { name: "Optimize Your Prompt" }).waitFor();
    await page.getByRole("button", { name: "Workflows", exact: true }).click();
    await page.getByRole("button", { name: "New client", exact: true }).click();
    await page.getByLabel("Name", { exact: true }).fill("Test Agency");
    await page
      .getByLabel("Audience", { exact: true })
      .first()
      .fill("Local business owners");
    await page
      .getByLabel("Product or service", { exact: true })
      .fill("Website design");
    await page.getByLabel("Tone", { exact: true }).fill("Professional");
    await page
      .getByLabel("Constraints", { exact: true })
      .fill("Never invent pricing");
    await page
      .getByRole("button", { name: "Save client", exact: true })
      .click();
    await page.getByText("Client saved", { exact: true }).waitFor();
    await page
      .getByLabel("Original brief", { exact: true })
      .fill("A client needs a landing page");
    await page
      .getByLabel("Audience", { exact: true })
      .fill("Local business owners");
    await page
      .getByLabel("Goal", { exact: true })
      .fill("Book a discovery call");
    await page.locator(".app-content").evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.screenshot({
      path: ".output/workflows-smoke.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Create reusable brief", exact: true })
      .click();
    assert.ok(
      (await page.locator("textarea").inputValue()).includes("Test Agency"),
    );
    await page
      .getByRole("button", { name: "Optimize Prompt", exact: true })
      .click();
    await page.getByText("Optimized Prompt", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Save to favorites", exact: true })
      .click();
    await page.getByRole("button", { name: "Saved", exact: true }).click();
    await page
      .getByRole("button", { name: "Create revision", exact: true })
      .first()
      .click();
    await page
      .getByLabel("Prompt revision")
      .fill("A better version of the brief.");
    await page
      .getByRole("button", { name: "Save revision", exact: true })
      .click();
    await page
      .getByText("Revision saved in favorites", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Useful", exact: true })
      .first()
      .click();
    const state = await page.evaluate(() => window.__testData);
    assert.equal(state.promnexa_clients[0].name, "Test Agency");
    assert.equal(state.promnexa_saved[0].feedback, "useful");
    assert.ok(state.promnexa_saved[0].parentId);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page
      .locator(".settings-item")
      .filter({ hasText: "Save optimization history" })
      .getByRole("button")
      .click();
    await page.getByRole("button", { name: "Optimize", exact: true }).click();
    await page.locator("textarea").fill("write a haiku");
    await page
      .getByRole("button", { name: "Optimize Prompt", exact: true })
      .click();
    await page.getByText("Optimized Prompt", { exact: true }).waitFor();
    assert.equal(
      await page.locator(".result-text").innerText(),
      "write a haiku",
    );
    const after = await page.evaluate(() => window.__testData);
    assert.equal(after.promnexa_history.length, state.promnexa_history.length);
    await page.getByRole("button", { name: "Library", exact: true }).click();
    await page.getByRole("heading", { name: "Prompt Library" }).waitFor();
    await page
      .getByPlaceholder("Search templates...")
      .fill("Explain a Complex Topic");
    await page
      .getByRole("button", { name: "Use Template", exact: true })
      .first()
      .click();
    await page.getByLabel("TOPIC", { exact: true }).fill("Bayesian inference");
    await page
      .getByLabel("LEVEL - beginner/intermediate/advanced", { exact: true })
      .fill("beginner");
    await page
      .getByRole("button", { name: "Use Template", exact: true })
      .first()
      .click();
    assert.ok(
      (await page.locator("textarea").inputValue()).includes(
        "Bayesian inference",
      ),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(network, []);
    await page
      .getByRole("button", { name: "Optimize Prompt", exact: true })
      .click();
    await page.getByText("Optimized Prompt", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Changes", exact: true }).click();
    assert.ok((await page.locator(".result-text mark").innerText()).length > 0);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page
      .getByLabel("Improve directly in chat")
      .selectOption("Alt+Shift+O");
    await page.getByRole("button", { name: "Optimize", exact: true }).click();
    await page
      .locator("textarea")
      .fill("email user@example.com password=sample-password");
    await page
      .getByRole("button", { name: "Redact before AI use", exact: true })
      .click();
    assert.ok(
      !(await page.locator("textarea").inputValue()).includes(
        "sample-password",
      ),
    );
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page
      .locator(".settings-item")
      .filter({ hasText: "API Configuration" })
      .click();
    await page.getByLabel("Provider", { exact: true }).selectOption("openai");
    await page.getByLabel("API Key", { exact: true }).fill("demo-test-key");
    await page.getByRole("button", { name: "Optimize", exact: true }).click();
    await page.getByRole("button", { name: "openai", exact: true }).waitFor();
    await page.locator("textarea").fill("Help plan a client meeting");
    await page
      .getByRole("button", { name: "Optimize Prompt", exact: true })
      .click();
    await page.getByText(/Local fallback/).waitFor();
    const beforeConsent = await page.evaluate(
      () => window.__apiRequests.length,
    );
    await page
      .locator("textarea")
      .fill("Write an email with password=demo-password");
    page.once("dialog", (dialog) => dialog.dismiss());
    await page
      .getByRole("button", { name: "Optimize Prompt", exact: true })
      .click();
    await page.getByText(/Local fallback/).waitFor();
    assert.equal(
      await page.evaluate(() => window.__apiRequests.length),
      beforeConsent,
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Optimize Prompt", exact: true })
      .click();
    await page.getByText(/Local fallback/).waitFor();
    assert.equal(
      await page.evaluate(() => window.__apiRequests.at(-1).sensitiveConsent),
      true,
    );
    assert.ok(
      !(
        await page.evaluate(() => JSON.stringify(window.__apiRequests))
      ).includes("demo-test-key"),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(network, []);
    await page.screenshot({ path: ".output/popup-smoke.png", fullPage: true });
    console.log(
      "PASS: lazy template library, editable placeholders, client profiles, workflows, optimize, save, revision, feedback, settings sync, disabled history, intent preservation, zero external requests, no runtime errors.",
    );
    const chat = await browser.newPage();
    const chatErrors = [];
    chat.on("pageerror", (error) => chatErrors.push(error.message));
    await chat.route("https://chatgpt.com/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<html><body><form><textarea id="prompt-textarea"></textarea><button type="submit" id="send">Send</button></form></body></html>',
      }),
    );
    await chat.addInitScript(() => {
      window.__sendCount = 0;
      document.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();
          window.__sendCount++;
        },
        true,
      );
      window.browser = {
        runtime: {
          id: "test",
          onMessage: {
            addListener: (fn) => {
              window.__settingsListener = fn;
            },
          },
          sendMessage: async (message) =>
            message.type === "PROMNEXA_PUBLIC_SETTINGS"
              ? {
                  settings: {
                    websiteIntegrations: [],
                    defaultMode: "quick",
                    inlineShortcut: "Alt+Shift+P",
                    language: "en",
                    maxAiInputCharacters: 20000,
                  },
                }
              : { error: "Mock API unavailable" },
        },
        storage: {
          local: {
            get: async () => {
              throw new Error("Content scripts must not read local storage.");
            },
          },
          onChanged: { addListener: () => {} },
        },
      };
      window.chrome = window.browser;
    });
    await chat.goto("https://chatgpt.com/");
    await chat.addScriptTag({
      path: ".output/chrome-mv3/content-scripts/content.js",
    });
    const editor = chat.locator("#prompt-textarea");
    const original = "  Help me prepare for a client meeting  \n";
    await editor.fill(original);
    await chat
      .getByRole("button", { name: "Improve prompt", exact: true })
      .click();
    const improved = await editor.inputValue();
    assert.notEqual(improved, original);
    assert.ok(improved.includes("client meeting"));
    assert.equal(await chat.locator("#promnexa-quick-card").count(), 0);
    assert.equal(await chat.evaluate(() => window.__sendCount), 0);
    await chat.locator("#promnexa-undo-btn").waitFor();
    assert.equal(await chat.locator("#promnexa-undo-btn").isEnabled(), true);
    await chat
      .getByRole("button", { name: "Improve prompt", exact: true })
      .click();
    assert.equal(await editor.inputValue(), improved);
    await chat.locator("#promnexa-undo-btn").click();
    assert.equal(await editor.inputValue(), original);
    await chat.keyboard.press("Alt+Shift+P");
    assert.equal(await editor.inputValue(), improved);
    await editor.fill("Help me plan a revised client meeting");
    assert.equal(await chat.locator("#promnexa-undo-btn").isDisabled(), true);
    assert.equal(
      await editor.inputValue(),
      "Help me plan a revised client meeting",
    );
    await chat
      .getByRole("button", { name: "Improve prompt", exact: true })
      .focus();
    await chat.keyboard.press("Enter");
    assert.notEqual(
      await editor.inputValue(),
      "Help me plan a revised client meeting",
    );
    await chat.locator("#promnexa-undo-btn").click();
    assert.equal(
      await editor.inputValue(),
      "Help me plan a revised client meeting",
    );
    await editor.fill("");
    await chat
      .getByRole("button", { name: "Improve prompt", exact: true })
      .click();
    assert.equal(await editor.inputValue(), "");
    await editor.fill("write a haiku");
    await chat.locator("#promnexa-options-btn").click();
    await chat.locator("#pmx-ai").click();
    await chat
      .getByText("Mock API unavailable Local result is still available.", {
        exact: true,
      })
      .waitFor();
    await chat.locator("#pmx-btn-insert").click();
    assert.equal(await editor.inputValue(), "write a haiku");
    await chat.locator("#promnexa-options-btn").click();
    await editor.fill("A newer draft while preview was open");
    await chat.locator("#pmx-btn-insert").click();
    assert.equal(
      await editor.inputValue(),
      "A newer draft while preview was open",
    );
    await chat.locator("#pmx-close-btn").click();
    await chat.locator("#promnexa-options-btn").click();
    await chat.locator("#pmx-close-btn").click();
    await chat.locator("#promnexa-options-btn").click();
    assert.equal(await chat.locator("#pmx-close-btn").count(), 1);
    await chat.locator("#pmx-close-btn").click();
    await editor.fill(
      'Write <img src=x onerror="window.__injected=true"> as literal text.',
    );
    await chat.locator("#promnexa-options-btn").click();
    assert.equal(await chat.locator("#promnexa-quick-card img").count(), 0);
    assert.equal(await chat.evaluate(() => window.__injected), undefined);
    await chat.locator("#pmx-close-btn").click();
    await editor.evaluate((element) => {
      const rich = document.createElement("div");
      rich.id = "prompt-textarea";
      rich.className = "ProseMirror";
      rich.contentEditable = "true";
      element.replaceWith(rich);
    });
    const richOriginal = "Help me prepare for a meeting";
    await editor.fill(richOriginal);
    await chat
      .getByRole("button", { name: "Improve prompt", exact: true })
      .click();
    assert.notEqual(await editor.innerText(), richOriginal);
    await chat.locator("#promnexa-undo-btn").click();
    assert.equal(await editor.innerText(), richOriginal);
    await chat
      .getByRole("button", { name: "Improve prompt", exact: true })
      .click();
    await chat.evaluate(() =>
      history.pushState({}, "", "/another-conversation"),
    );
    await chat.locator("#promnexa-undo-btn").click();
    assert.notEqual(await editor.innerText(), richOriginal);
    assert.equal(await chat.evaluate(() => window.__sendCount), 0);
    await chat.evaluate(() =>
      window.__settingsListener({
        type: "PROMNEXA_PUBLIC_SETTINGS_CHANGED",
        settings: {
          websiteIntegrations: [],
          defaultMode: "quick",
          inlineShortcut: "Alt+Shift+O",
          language: "en",
          maxAiInputCharacters: 20000,
        },
      }),
    );
    await editor.fill("Help plan a meeting");
    await chat.keyboard.press("Alt+Shift+P");
    assert.equal(await editor.innerText(), "Help plan a meeting");
    await chat.keyboard.press("Alt+Shift+O");
    assert.notEqual(await editor.innerText(), "Help plan a meeting");
    await chat.locator("#promnexa-undo-btn").click();
    await editor.evaluate((el) => {
      el.remove();
      document
        .querySelector("form")
        .insertAdjacentHTML(
          "afterbegin",
          '<textarea id="first">First draft</textarea><textarea id="second">Second meeting draft</textarea>',
        );
    });
    await chat.locator("#send").focus();
    await chat
      .getByRole("button", { name: "Improve prompt", exact: true })
      .click();
    assert.equal(await chat.locator("#first").inputValue(), "First draft");
    assert.equal(
      await chat.locator("#second").inputValue(),
      "Second meeting draft",
    );
    await chat.locator("#second").focus();
    await chat
      .getByRole("button", { name: "Improve prompt", exact: true })
      .click();
    assert.equal(await chat.locator("#first").inputValue(), "First draft");
    assert.notEqual(
      await chat.locator("#second").inputValue(),
      "Second meeting draft",
    );
    assert.equal(await chat.evaluate(() => window.__sendCount), 0);
    assert.deepEqual(chatErrors, []);
    // Provider-specific adapters are exercised with simulated DOMs, never live accounts.
    for (const [host, markup, selector] of [
      [
        "chatgpt.com",
        '<textarea id="prompt-textarea"></textarea>',
        "#prompt-textarea",
      ],
      [
        "claude.ai",
        '<div class="ProseMirror" contenteditable="true"></div>',
        ".ProseMirror",
      ],
      [
        "gemini.google.com",
        '<rich-textarea><div contenteditable="true"></div></rich-textarea>',
        'rich-textarea div[contenteditable="true"]',
      ],
      [
        "chat.deepseek.com",
        '<textarea id="chat-input"></textarea>',
        "#chat-input",
      ],
      [
        "perplexity.ai",
        '<div role="textbox" contenteditable="true"></div>',
        'div[role="textbox"]',
      ],
      [
        "copilot.microsoft.com",
        '<textarea placeholder="Ask Copilot"></textarea>',
        "textarea[placeholder]",
      ],
      [
        "grok.com",
        '<textarea placeholder="Ask anything"></textarea>',
        "textarea[placeholder]",
      ],
    ]) {
      const adapterPage = await browser.newPage();
      const adapterErrors = [];
      adapterPage.on("pageerror", (e) => adapterErrors.push(e.message));
      await adapterPage.route(`https://${host}/**`, (route) =>
        route.fulfill({
          contentType: "text/html",
          body: `<form>${markup}<textarea id="decoy">Unrelated draft</textarea><button type="submit">Send</button></form>`,
        }),
      );
      await adapterPage.addInitScript(() => {
        window.__submitted = 0;
        document.addEventListener(
          "submit",
          (e) => {
            e.preventDefault();
            window.__submitted++;
          },
          true,
        );
        window.browser = {
          runtime: {
            id: "test",
            onMessage: { addListener: () => {} },
            sendMessage: async () => ({
              settings: {
                websiteIntegrations: [],
                defaultMode: "quick",
                inlineShortcut: "Alt+Shift+P",
                language: "en",
                maxAiInputCharacters: 20000,
              },
            }),
          },
          storage: {
            local: {
              get: async () => {
                throw new Error("Direct storage access");
              },
            },
          },
        };
        window.chrome = window.browser;
      });
      await adapterPage.goto(`https://${host}/`);
      await adapterPage.addScriptTag({
        path: ".output/chrome-mv3/content-scripts/content.js",
      });
      const target = adapterPage.locator(selector);
      const raw = "Help me prepare for a client meeting";
      await target.fill(raw);
      await adapterPage
        .getByRole("button", { name: "Improve prompt", exact: true })
        .click();
      assert.notEqual(
        await target.evaluate((el) =>
          el instanceof HTMLTextAreaElement ? el.value : el.innerText,
        ),
        raw,
        host,
      );
      await adapterPage.locator("#promnexa-undo-btn").click();
      assert.equal(
        await target.evaluate((el) =>
          el instanceof HTMLTextAreaElement ? el.value : el.innerText,
        ),
        raw,
        host,
      );
      assert.equal(
        await adapterPage.locator("#decoy").inputValue(),
        "Unrelated draft",
      );
      assert.equal(await adapterPage.evaluate(() => window.__submitted), 0);
      assert.deepEqual(adapterErrors, []);
      await adapterPage.close();
    }
    console.log(
      "PASS: seven provider adapter fixtures preserve unrelated editors, restore drafts and never submit.",
    );

    console.log(
      "PASS: direct improvement, exact Undo, edit/navigation guards, keyboard activation, no automatic submission, empty input, advanced AI fallback, stale previews, rich editor, HTML escaping, rapid close/reopen.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
