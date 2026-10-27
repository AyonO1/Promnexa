import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const importedPath = path.resolve(__dirname, '../lib/imported-prompts.json');
const outputPath = path.resolve(__dirname, '../lib/curated-imported.json');

const imported = JSON.parse(fs.readFileSync(importedPath, 'utf8'));

// Take balanced distribution across categories
const byCat = {};
for (const p of imported) {
  if (!byCat[p.category]) byCat[p.category] = [];
  byCat[p.category].push(p);
}

const selected = [];
// Target: ~25 coding, ~25 education, ~25 learning, ~25 daily, ~25 writing, ~25 research, ~20 business, ~20 general
const quotas = {
  coding: 30,
  education: 30,
  learning: 30,
  daily: 25,
  writing: 25,
  research: 25,
  business: 20,
  general: 15,
};

for (const [cat, target] of Object.entries(quotas)) {
  const items = (byCat[cat] || []).slice(0, target);
  selected.push(...items);
}

console.log(`Selected ${selected.length} screened imported templates across categories.`);
fs.writeFileSync(outputPath, JSON.stringify(selected, null, 2), 'utf8');
console.log(`Saved to ${outputPath}`);
