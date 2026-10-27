import {redactCredentialPatterns} from './prompt-safety.mjs';
import { parseCSV } from "./csv.mjs";
/**
 * Promnexa Prompt Collection & Importer Pipeline
 * Downloads, normalizes, categorizes, validates, deduplicates,
 * and exports curated prompts from permitted open-source repositories.
 *
 * Source: Awesome ChatGPT Prompts (f/awesome-chatgpt-prompts)
 * License: CC0 1.0 Universal (Public Domain)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.resolve(__dirname, "../lib/imported-prompts.json");

const SOURCE_URL =
  "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv";

// Category keyword maps
const CATEGORY_MAP = {
  education: [
    "teacher",
    "math",
    "academic",
    "student",
    "essay",
    "philosophy",
    "historian",
    "scientist",
    "educational",
  ],
  coding: [
    "developer",
    "code",
    "python",
    "javascript",
    "sql",
    "linux",
    "terminal",
    "regex",
    "git",
    "fullstack",
    "cyber security",
    "bug",
  ],
  learning: [
    "tutor",
    "mentor",
    "explain",
    "learn",
    "language tutor",
    "speech",
    "dialect",
    "trainer",
  ],
  daily: [
    "travel",
    "trip",
    "budget",
    "diet",
    "personal trainer",
    "doctor",
    "chef",
    "recipe",
    "friend",
    "relationship",
  ],
  writing: [
    "writer",
    "storyteller",
    "screenwriter",
    "poet",
    "novelist",
    "journalist",
    "editor",
    "copywriter",
    "lyricist",
  ],
  research: [
    "statistician",
    "data",
    "analyst",
    "research",
    "scientific",
    "investigator",
  ],
  business: [
    "recruiter",
    "interviewer",
    "product manager",
    "marketing",
    "advertiser",
    "startup",
    "financial",
    "accountant",
    "sales",
  ],
};

function detectCategory(title, text) {
  const combined = `${title} ${text}`.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => combined.includes(kw))) {
      return cat;
    }
  }
  return "general";
}

function extractTags(title, text) {
  const words = `${title}`
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  return Array.from(new Set(words)).slice(0, 4);
}

// Simple CSV parser supporting quotes and escaped quotes
// Safety check: verify no malicious prompt injection patterns
function isSafePrompt(text) {
  const lower = text.toLowerCase();
  const dangerousPatterns = [
    "ignore all previous instructions",
    "system prompt override",
    "bypass security",
    "exploit vulnerability",
  ];
  return !dangerousPatterns.some((p) => lower.includes(p));
}

// Deduplication helper using token sets (Jaccard similarity > 0.85)
const tokenCache = new WeakMap();
function isNearDuplicate(prompt, existingPrompts) {
  const tokensA = new Set(
    prompt
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
  if (tokensA.size === 0) return false;

  for (const existing of existingPrompts) {
    let tokensB = tokenCache.get(existing);
    if (!tokensB) {
      tokensB = new Set(
        existing.template
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3),
      );
      tokenCache.set(existing, tokensB);
    }
    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }
    const union = tokensA.size + tokensB.size - intersection;
    const similarity = intersection / union;
    if (similarity > 0.85) return true;
  }
  return false;
}

async function runPipeline() {
  console.log("🚀 Promnexa Prompt Collection Pipeline starting...");
  console.log(`📥 Fetching data from: ${SOURCE_URL}`);

  try {
    const res = await fetch(SOURCE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const csvContent = await res.text();

    console.log(`📊 Parsing CSV data (${csvContent.length} bytes)...`);
    const rows = parseCSV(csvContent);

    if (rows.length <= 1) {
      throw new Error("CSV is empty or invalid");
    }

    // Header: act, prompt
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const actIdx = headers.indexOf("act");
    const promptIdx = headers.indexOf("prompt");

    if (actIdx === -1 || promptIdx === -1) {
      throw new Error(
        `CSV headers missing required columns. Found: ${headers.join(", ")}`,
      );
    }

    const rawRecords = rows.slice(1);
    console.log(`📝 Total raw records found: ${rawRecords.length}`);

    const normalized = [];
    let skippedDuplicates = 0;
    let skippedUnsafe = 0;
    let skippedEmpty = 0;

    for (let i = 0; i < rawRecords.length; i++) {
      const row = rawRecords[i];
      const title = row[actIdx]?.trim();
      const promptText = redactCredentialPatterns(row[promptIdx]?.trim() || "");

      if (!title || !promptText || promptText.length < 20) {
        skippedEmpty++;
        continue;
      }

      if (!isSafePrompt(promptText)) {
        skippedUnsafe++;
        continue;
      }

      if (isNearDuplicate(promptText, normalized)) {
        skippedDuplicates++;
        continue;
      }

      const category = detectCategory(title, promptText);
      const tags = extractTags(title, promptText);

      normalized.push({
        id: `imp-${String(normalized.length + 1).padStart(3, "0")}`,
        title: `Act as a ${title}`,
        description: `Adopt the role of ${title} with tailored domain guidance.`,
        template: promptText,
        category,
        subcategory: title.toLowerCase(),
        tags,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "Awesome ChatGPT Prompts (CC0 1.0)",
      });
    }

    console.log("\n--- Pipeline Results ---");
    console.log(`✅ Successfully normalized: ${normalized.length} prompts`);
    console.log(`⚠️  Skipped duplicates: ${skippedDuplicates}`);
    console.log(`🛡️  Skipped unsafe: ${skippedUnsafe}`);
    console.log(`❌ Skipped empty/short: ${skippedEmpty}`);

    // Category breakdown
    const categoryCounts = {};
    for (const item of normalized) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    }
    console.log("\nCategory breakdown:");
    for (const [cat, count] of Object.entries(categoryCounts)) {
      console.log(`  - ${cat}: ${count}`);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(normalized, null, 2), "utf8");
    console.log(`\n💾 Saved clean dataset to: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error("❌ Pipeline failed:", err);
    process.exitCode = 1;
  }
}

runPipeline();
