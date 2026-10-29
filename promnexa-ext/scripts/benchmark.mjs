import fs from "node:fs";
import assert from "node:assert/strict";
import { optimizePrompt } from "../lib/optimizer.ts";
const cases = JSON.parse(
  fs.readFileSync(
    new URL("../tests/fixtures/prompt-benchmark.json", import.meta.url),
    "utf8",
  ),
);
let passed = 0;
for (const item of cases)
  for (const mode of ["quick", "deep", "expert", "beginner"]) {
    const result = optimizePrompt(item.input, item.category, mode);
    assert.ok(
      result.optimized.startsWith(item.input.trim()),
      `${item.id}/${mode}: original task changed`,
    );
    if (item.noNewMarkdown)
      assert.ok(
        !result.optimized.slice(item.input.trim().length).includes("##"),
        `${item.id}/${mode}: introduced Markdown`,
      );
    if (item.protected)
      assert.ok(
        result.optimized.includes(item.protected),
        `${item.id}/${mode}: changed literal code`,
      );
    if (item.unchanged) assert.equal(result.optimized, item.input);
    assert.ok(result.improvements.length);
    passed++;
  }
console.log(
  `${passed}/${cases.length * 4} preservation/constraint invariants passed. This is not a downstream AI-quality score; live paired model comparisons were not run.`,
);
