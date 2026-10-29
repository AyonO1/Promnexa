import test from "node:test";
import assert from "node:assert/strict";
import { detectCategory, optimizePrompt } from "../lib/optimizer.ts";

test("Category Detection - Coding", () => {
  const result = detectCategory(
    "Fix my React useEffect infinite loop bug in TypeScript",
  );
  assert.equal(result, "coding");
});

test("Category Detection - Education", () => {
  const result = detectCategory(
    "Explain quantum mechanics for my university exam",
  );
  assert.equal(result, "education");
});

test("Category Detection - Learning", () => {
  const result = detectCategory(
    "Create a 6-month roadmap to learn Python from scratch",
  );
  assert.equal(result, "learning");
});

test("Category Detection - Daily Life", () => {
  const result = detectCategory(
    "Write a polite email asking for meeting reschedule",
  );
  assert.equal(result, "daily");
});

test("Category Detection - Writing", () => {
  const result = detectCategory(
    "Write an engaging blog post intro about remote work",
  );
  assert.equal(result, "writing");
});

test("Category Detection - Research", () => {
  const result = detectCategory(
    "Analyze statistical significance in this experimental dataset",
  );
  assert.equal(result, "research");
});

test("Category Detection - Business", () => {
  const result = detectCategory(
    "Draft a startup pitch deck outline for angel investors",
  );
  assert.equal(result, "business");
});

test("Category Detection - Fallback to General", () => {
  const result = detectCategory("something completely random without keywords");
  assert.equal(result, "general");
});

test("Optimizer - Quick preserves the task and adds learning-specific guidance", () => {
  const res = optimizePrompt("Teach me machine learning", "learning", "quick");
  assert.equal(res.mode, "quick");
  assert.ok(res.optimized.startsWith(res.original));
  assert.ok(!res.optimized.includes("##"));
  assert.ok(res.improvements.length > 0);
});

test("Optimizer - Deep requests debugging evidence without inventing it", () => {
  const res = optimizePrompt("Fix my React code", "coding", "deep");
  assert.equal(res.mode, "deep");
  assert.ok(res.optimized.startsWith("Fix my React code"));
  assert.ok(res.optimized.includes("missing evidence"));
  assert.ok(res.questions?.some((q) => q.includes("code and error")));
});

test("Optimizer - Expert preserves architecture intent and adds verification", () => {
  const res = optimizePrompt(
    "Design a high-throughput microservice architecture",
    "coding",
    "expert",
  );
  assert.equal(res.mode, "expert");
  assert.ok(
    res.optimized.includes("high-throughput microservice architecture"),
  );
  assert.ok(res.optimized.includes("failure modes"));
  assert.ok(res.optimized.includes("verified"));
});

test("Optimizer - Beginner Mode enforces accessible language", () => {
  const res = optimizePrompt(
    "Explain calculus limits",
    "education",
    "beginner",
  );
  assert.equal(res.mode, "beginner");
  assert.ok(
    res.optimized.includes("simple language") ||
      res.optimized.includes("basics"),
  );
});

test("Optimizer - Edge Case: Empty Input", () => {
  const res = optimizePrompt("   ", "general", "quick");
  assert.equal(res.optimized, "");
  assert.equal(res.improvements.length, 0);
});

test("Optimizer - Edge Case: Very Long Prompt with Code", () => {
  const longPrompt =
    "Debug this function: function test() { return 1; } " + "a".repeat(2000);
  const res = optimizePrompt(longPrompt, "coding", "deep");
  assert.ok(res.optimized.length > 50);
  assert.equal(res.category, "coding");
});

test("Optimizer - Special Characters and Unicode", () => {
  const prompt = "কিভাবে React শিখব? What is @param <T> in TypeScript & Rust?";
  const res = optimizePrompt(prompt, "coding", "deep");
  assert.ok(res.optimized.includes("TypeScript"));
});

for (const input of [
  "write a haiku",
  "Return only valid JSON with keys name and age. No headings or explanation.",
  "Translate exactly: hello",
  "শুধু একটি কবিতা লিখুন",
  "```js\nconst value = 1;\n```",
]) {
  test(`Preserve constrained intent: ${input.slice(0, 35)}`, () => {
    for (const mode of ["quick", "deep", "expert", "beginner"] as const)
      assert.equal(
        optimizePrompt(input, detectCategory(input), mode).optimized,
        input,
      );
  });
}
test("Bengali business intent and Bengali output", () => {
  const input = "আমার ব্যবসার জন্য একটি পরিকল্পনা তৈরি করুন";
  assert.equal(detectCategory(input), "business");
  const result = optimizePrompt(input, "business", "deep");
  assert.ok(result.optimized.startsWith(input));
  assert.ok(!result.optimized.includes("Requirements"));
});
test("English category matching uses word boundaries", () => {
  assert.equal(
    detectCategory(
      "Return only valid JSON with keys name and age. No headings or explanation.",
    ),
    "general",
  );
  assert.equal(detectCategory("A testament to database design"), "coding");
});
test("Short explicit writing task does not receive an outline", () => {
  const result = optimizePrompt("write an email", "writing", "quick");
  assert.ok(!result.optimized.includes("structured outline"));
});
test("Oversize prompts are rejected", () =>
  assert.throws(() => optimizePrompt("x".repeat(100001), "general", "quick")));

for (const input of [
  "Never use markdown; answer in plain text",
  "Answer in one sentence: what is TCP?",
  "Explain in at most 20 words",
  "No headings: explain DNS",
  "Return only CSV rows",
  "Return only a regex",
  "Translate exactly: hello",
])
  test(`Review constraint: ${input}`, () => {
    const result = optimizePrompt(input, detectCategory(input), "expert");
    assert.ok(result.optimized.includes(input));
    assert.ok(!result.optimized.includes("##"));
    assert.equal(result.status, "unchanged");
    assert.ok(result.improvements.length);
  });
test("Poetry with a subject can be improved without changing form", () => {
  const input = "write a poem about rain";
  const r = optimizePrompt(input, "writing", "deep");
  assert.ok(r.optimized.startsWith(input));
  assert.notEqual(r.optimized, input);
  assert.ok(!r.optimized.includes("##"));
});
test("Debugging guidance preserves fenced code byte-for-byte", () => {
  const code = "```python\ndef broken(x):\n    return x / 0\n```";
  const input = "Fix this code: " + code;
  const r = optimizePrompt(input, "coding", "expert");
  assert.ok(r.optimized.includes(code));
  assert.notEqual(r.optimized, input);
  assert.ok(r.optimized.includes("focused test"));
});
test("Review technical examples classify correctly and avoid generic headings", () => {
  for (const input of [
    "What is TCP three way handshake?",
    "Explain why the program fails",
  ])
    assert.equal(detectCategory(input), "coding");
  const r = optimizePrompt(
    "What is TCP three way handshake?",
    "coding",
    "quick",
  );
  assert.ok(r.optimized.includes("SYN-ACK"));
  assert.ok(!r.optimized.includes("##"));
});
test("Bengali and Banglish learning prompts receive relevant guidance", () => {
  for (const input of ["আমাকে Javascript শেখাও", "amake JavaScript shekhao"]) {
    assert.equal(detectCategory(input), "learning");
    const r = optimizePrompt(input, "learning", "quick");
    assert.ok(r.optimized.startsWith(input));
    assert.ok(
      r.optimized.includes(
        input.includes("আমাকে") ? "উদাহরণ" : "practical example",
      ),
    );
  }
});
