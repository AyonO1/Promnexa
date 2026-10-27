import {redactCredentialPatterns} from '../scripts/prompt-safety.mjs';
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWorkflow,
  fillTemplate,
  templateVariables,
} from "../lib/workflows.ts";
import { parseCSV } from "../scripts/csv.mjs";
import { searchTemplates } from "../lib/templates.ts";
test("Variable extraction supports repeated braces and imported dollar notation", () => {
  const text = "Hello {{ name }}, ${offer} {{name}}";
  assert.deepEqual(templateVariables(text), ["name", "offer"]);
  assert.equal(
    fillTemplate(text, { name: "Ayon", offer: "Design $100" }),
    "Hello Ayon, Design $100 Ayon",
  );
  assert.equal(fillTemplate("{{name}}", {}), "{{name}}");
  assert.deepEqual(
    templateVariables("[TOPIC] for [LEVEL - beginner/intermediate/advanced]"),
    ["TOPIC", "LEVEL - beginner/intermediate/advanced"],
  );
});
test("Workflow requires actual audience and goal", () => {
  assert.throws(() =>
    buildWorkflow("proposal", "brief", null, "en", {
      audience: "",
      goal: "",
      constraints: "",
    }),
  );
});
for (const kind of ["proposal", "advertising", "reply"] as const)
  test(`Bilingual ${kind} workflow includes the selected client and constraints`, () => {
    const client = {
      id: "1",
      name: "Example",
      audience: "Business owners",
      offer: "Design",
      tone: "Warm",
      constraints: "No discounts",
    };
    for (const language of ["en", "bn"] as const) {
      const result = buildWorkflow(
        kind,
        "ক্লায়েন্টের বিবরণ",
        client,
        language,
        { audience: "Owners", goal: "Book a call", constraints: "500 words" },
      );
      for (const value of [
        "Example",
        "No discounts",
        "ক্লায়েন্টের বিবরণ",
        "500 words",
      ])
        assert.ok(result.includes(value));
      assert.ok(
        result.includes(
          language === "bn" ? "বাংলায় লিখুন" : "Write in English",
        ),
      );
    }
  });
test("CSV preserves quoted commas, newlines, escaped quotes and BOM", () => {
  assert.deepEqual(
    parseCSV(
      '\uFEFFact,prompt\r\n"Writer","Use commas, and ""quotes""\nNext line"\r\n',
    ),
    [
      ["act", "prompt"],
      ["Writer", 'Use commas, and "quotes"\nNext line'],
    ],
  );
  assert.throws(() => parseCSV('act,prompt\n"unclosed'));
});
test("General category filter returns general only", () =>
  assert.ok(
    searchTemplates("", "general").every((t) => t.category === "general"),
  ));

test('Imported credential-shaped samples are redacted before redistribution',()=>{
  const sample='API_KEY='+'ghp_'+'a'.repeat(36);
  assert.equal(redactCredentialPatterns(sample),'API_KEY=[REDACTED_CREDENTIAL]');
  assert.equal(redactCredentialPatterns('Use your own API key'),'Use your own API key');
});
