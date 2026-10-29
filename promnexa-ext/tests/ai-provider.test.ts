import { safeProviderError, ProviderError } from "../lib/provider-errors.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  optimizeWithAI,
  parseAIResponse,
  outputTokenBudget,
} from "../lib/ai-provider.ts";
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
    { code: "AUTH" },
  );
});

for (const provider of ["openai", "anthropic", "gemini"] as const)
  test(`${provider}: controlled stalled request obeys timeout`, async (t) => {
    const original = globalThis.fetch;
    t.after(() => {
      globalThis.fetch = original;
    });
    let aborted = false;
    globalThis.fetch = async (_input, options) =>
      new Promise((_resolve, reject) => {
        assert.ok(options?.signal);
        options.signal.addEventListener(
          "abort",
          () => {
            aborted = true;
            reject(options.signal!.reason);
          },
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
        { provider, apiKey: "test", model: "" },
        undefined,
        15,
      ),
      (e) => safeProviderError(e).code === "TIMEOUT",
    );
    assert.equal(aborted, true);
  });
for (const [provider, payload] of [
  ["openai", { choices: [{ finish_reason: "length" }] }],
  ["anthropic", { stop_reason: "max_tokens" }],
  ["gemini", { candidates: [{ finishReason: "MAX_TOKENS" }] }],
] as const)
  test(`${provider} rejects truncated output before parsing`, async (t) => {
    const original = globalThis.fetch;
    t.after(() => {
      globalThis.fetch = original;
    });
    globalThis.fetch = async () => new Response(JSON.stringify(payload));
    await assert.rejects(
      optimizeWithAI("Task", "coding", "deep", {
        provider,
        apiKey: "test",
        model: "",
      }),
      { code: "TRUNCATED" },
    );
  });
test("Output budgets scale and remain bounded without automatic paid retries", () => {
  assert.ok(
    outputTokenBudget("short", "deep") > outputTokenBudget("short", "quick"),
  );
  assert.ok(outputTokenBudget("x".repeat(10000), "expert") > 4096);
  assert.equal(outputTokenBudget("x".repeat(100000), "expert"), 16000);
});
test("Safe error codes never return arbitrary provider messages", () => {
  assert.deepEqual(safeProviderError(new ProviderError("AUTH")).code, "AUTH");
  const safe = safeProviderError(new Error("a-provider-secret"));
  assert.ok(!safe.message.includes("a-provider-secret"));
});

test("Gemini invalid-key 400 is AUTH without returning the provider body", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: {
          message: "sensitive-provider-body",
          details: [{ reason: "API_KEY_INVALID" }],
        },
      }),
      { status: 400 },
    );
  await assert.rejects(
    optimizeWithAI("Task", "general", "quick", {
      provider: "gemini",
      apiKey: "test",
      model: "",
    }),
    (e) =>
      safeProviderError(e).code === "AUTH" &&
      !safeProviderError(e).message.includes("sensitive-provider-body"),
  );
});
