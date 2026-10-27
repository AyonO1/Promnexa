import test from "node:test";
import assert from "node:assert/strict";
import { optimizeWithAI, parseAIResponse } from "../lib/ai-provider.ts";
test("Invalid or empty AI output is rejected instead of displayed", () => {
  for (const text of [
    "not a JSON response but long enough to look plausible",
    "null",
    "{}",
    '{"optimized":"   "}',
  ])
    assert.throws(() => parseAIResponse(text));
  assert.equal(
    parseAIResponse(
      '```json\n{"optimized":"Keep this","improvements":["Clearer",123]}\n```',
    ).optimized,
    "Keep this",
  );
});
for (const provider of ["openai", "anthropic", "gemini"] as const)
  test(`${provider} sends credentials only to the fixed provider endpoint`, async (t) => {
    const original = globalThis.fetch;
    t.after(() => {
      globalThis.fetch = original;
    });
    let url = "",
      body: any,
      headers: any;
    globalThis.fetch = async (input, options) => {
      url = String(input);
      body = JSON.parse(options!.body as string);
      headers = options!.headers;
      const content = JSON.stringify({
        optimized: "Preserved task",
        improvements: ["Clarity"],
      });
      return new Response(
        JSON.stringify(
          provider === "openai"
            ? { choices: [{ message: { content } }] }
            : provider === "anthropic"
              ? { content: [{ type: "text", text: content }] }
              : { candidates: [{ content: { parts: [{ text: content }] } }] },
        ),
        { status: 200 },
      );
    };
    const result = await optimizeWithAI("A real task", "general", "quick", {
      provider,
      apiKey: "test-key",
      model: "",
    });
    assert.equal(result.optimized, "Preserved task");
    assert.ok(!url.includes("test-key"));
    assert.ok(body.model || provider === "gemini");
    assert.equal(
      headers[
        provider === "openai"
          ? "Authorization"
          : provider === "anthropic"
            ? "x-api-key"
            : "x-goog-api-key"
      ],
      provider === "openai" ? "Bearer test-key" : "test-key",
    );
  });
test("A stalled provider request is aborted by the deadline", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async (_input, options) =>
    new Promise((_resolve, reject) => {
      options!.signal!.addEventListener(
        "abort",
        () => reject(options!.signal!.reason),
        { once: true },
      );
    });
  const keepAlive = setTimeout(() => {}, 1000);
  t.after(() => clearTimeout(keepAlive));
  await assert.rejects(
    optimizeWithAI(
      "Task",
      "general",
      "quick",
      { provider: "openai", apiKey: "test", model: "" },
      undefined,
      15,
    ),
    { name: "TimeoutError" },
  );
});
test("Provider authentication failures do not expose credentials", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async () => new Response("{}", { status: 401 });
  await assert.rejects(
    optimizeWithAI("Task", "general", "quick", {
      provider: "openai",
      apiKey: "secret",
      model: "",
    }),
    /Invalid OpenAI API key/,
  );
});
