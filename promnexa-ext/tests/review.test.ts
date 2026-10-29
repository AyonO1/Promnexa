import test from "node:test";
import assert from "node:assert/strict";
import { analyzePrompt, textDifference } from "../lib/prompt-analysis.ts";
import {
  scanSensitiveInfo,
  redactSensitiveInfo,
  estimateTokens,
} from "../lib/sensitive-info.ts";
import { matchesShortcut } from "../lib/shortcuts.ts";
import { validContextAction, CONTEXT_TTL } from "../lib/context-actions.ts";
test("Constraint analysis identifies plain text, length, tone, audience and language", () => {
  const a = analyzePrompt(
    "Never use markdown. Answer in English in one sentence. Tone: friendly. Audience: owners.",
  );
  assert.equal(a.format, "plain");
  assert.equal(a.lengthLocked, true);
  assert.equal(a.tone, "friendly");
  assert.equal(a.audience, "owners");
  assert.equal(a.requestedLanguage, "English");
});
test("Difference preserves unchanged text and reports inserted or replaced spans", () => {
  assert.deepEqual(textDifference("a b c", "a better c"), {
    before: "a b",
    removed: "",
    added: "etter",
    after: " c",
  });
  const d = textDifference("original", "original");
  assert.equal(d.added, "");
  assert.equal(d.removed, "");
});
test("Sensitive scan offers redaction without persisting the source", () => {
  const text =
    "password=supersecret contact user@example.com key " +
    "sk-" +
    "a".repeat(30);
  assert.equal(scanSensitiveInfo(text).length, 3);
  const redacted = redactSensitiveInfo(text);
  for (const raw of ["supersecret", "user@example.com", "a".repeat(30)])
    assert.ok(!redacted.includes(raw));
  assert.ok(estimateTokens("ক") >= estimateTokens("a"));
});
test("Configurable shortcut matches exact modifier set", () => {
  const event = {
    key: "o",
    altKey: true,
    shiftKey: true,
    ctrlKey: false,
    metaKey: false,
  };
  assert.equal(matchesShortcut(event, "Alt+Shift+O"), true);
  assert.equal(matchesShortcut(event, "Alt+Shift+P"), false);
  assert.equal(
    matchesShortcut({ ...event, ctrlKey: true }, "Alt+Shift+O"),
    false,
  );
});
test("Context actions expire and cannot be consumed for another ID or tab", () => {
  const action = {
    id: "selection-1",
    action: "explain",
    text: "selected",
    timestamp: 1000,
    sourceTabId: 7,
  };
  assert.equal(validContextAction(action, 1001, "selection-1", 7), true);
  assert.equal(validContextAction(action, 1001, "selection-2", 7), false);
  assert.equal(validContextAction(action, 1001, "selection-1", 8), false);
  assert.equal(validContextAction(action, 1001 + CONTEXT_TTL), false);
  assert.equal(validContextAction(action, 999), false);
});
