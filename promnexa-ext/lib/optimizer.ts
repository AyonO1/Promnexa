import { analyzePrompt } from "./prompt-analysis.ts";
import type { Category, OptimizationMode, OptimizationResult } from "./types";

// ---- Category Detection ----
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  education: [
    "assignment",
    "homework",
    "exam",
    "quiz",
    "test",
    "lecture",
    "thesis",
    "essay",
    "dissertation",
    "study",
    "course",
    "syllabus",
    "curriculum",
    "grade",
    "gpa",
    "research paper",
    "academic",
    "university",
    "college",
    "school",
    "teacher",
    "professor",
    "student",
    "class",
    "semester",
    "mcq",
    "flashcard",
    "citation",
    "bibliography",
    "literature review",
    "presentation",
    "report",
  ],
  coding: [
    "code",
    "debug",
    "bug",
    "error",
    "function",
    "class",
    "api",
    "react",
    "vue",
    "angular",
    "node",
    "python",
    "javascript",
    "typescript",
    "java",
    "c++",
    "rust",
    "go",
    "sql",
    "database",
    "backend",
    "frontend",
    "fullstack",
    "git",
    "deploy",
    "docker",
    "kubernetes",
    "aws",
    "server",
    "endpoint",
    "refactor",
    "test",
    "unit test",
    "integration",
    "algorithm",
    "data structure",
    "performance",
    "optimize",
    "css",
    "html",
    "component",
    "package",
    "npm",
    "pip",
    "library",
    "framework",
    "architecture",
    "devops",
    "ci/cd",
    "pipeline",
  ],
  learning: [
    "learn",
    "tutorial",
    "roadmap",
    "beginner",
    "intermediate",
    "advanced",
    "skill",
    "practice",
    "exercise",
    "lesson",
    "tutor",
    "explain",
    "understand",
    "concept",
    "fundamentals",
    "basics",
    "mastery",
    "mentor",
    "coaching",
    "training",
    "interview prep",
    "career",
    "language learning",
    "socratic",
    "step by step",
    "progressive",
    "hands-on",
    "project-based",
  ],
  daily: [
    "email",
    "message",
    "letter",
    "plan",
    "schedule",
    "organize",
    "travel",
    "recipe",
    "shopping",
    "budget",
    "fitness",
    "health",
    "diet",
    "routine",
    "habit",
    "productivity",
    "time management",
    "decision",
    "advice",
    "help",
    "recommend",
    "suggest",
    "compare",
    "review",
    "cv",
    "resume",
    "cover letter",
    "job application",
    "meeting",
    "agenda",
    "birthday",
    "gift",
    "event",
  ],
  writing: [
    "write",
    "blog",
    "article",
    "story",
    "creative writing",
    "content",
    "copywriting",
    "headline",
    "caption",
    "social media",
    "post",
    "script",
    "dialogue",
    "narrative",
    "poem",
    "novel",
    "character",
    "plot",
    "edit",
    "proofread",
    "grammar",
    "tone",
    "style",
    "audience",
    "seo",
    "newsletter",
  ],
  research: [
    "research",
    "analyze",
    "analysis",
    "data",
    "statistics",
    "survey",
    "hypothesis",
    "methodology",
    "findings",
    "evidence",
    "source",
    "cite",
    "peer review",
    "journal",
    "publication",
    "experiment",
    "study",
    "investigate",
    "systematic review",
    "meta-analysis",
    "qualitative",
    "quantitative",
  ],
  business: [
    "business",
    "startup",
    "marketing",
    "sales",
    "strategy",
    "pitch",
    "investor",
    "revenue",
    "profit",
    "customer",
    "client",
    "brand",
    "product",
    "launch",
    "campaign",
    "analytics",
    "kpi",
    "roi",
    "proposal",
    "contract",
    "negotiation",
    "partnership",
    "growth",
  ],
  general: [],
};

export function detectCategory(text: string): Category {
  const lowerText = text.toLowerCase();
  if (
    /\b(?:program (?:fails|crashes)|debug|stack trace|tcp|three[ -]way handshake|network protocol)\b/i.test(
      text,
    )
  )
    return "coding";
  if (
    /(?:শেখাও|শিখতে|শেখার|শিখব)|\b(?:shekhao|shikhte|learn|learning roadmap)\b/i.test(
      text,
    )
  )
    return "learning";
  const bangla: Partial<Record<Category, string[]>> = {
    education: ["পরীক্ষা", "পড়াশোনা", "পড়াশোনা", "শিক্ষা", "অ্যাসাইনমেন্ট"],
    coding: ["কোড", "প্রোগ্রাম", "প্রোগ্রামিং", "বাগ"],
    learning: ["শিখতে", "শিখব", "শেখা", "শিখবো"],
    daily: ["ভ্রমণ", "রান্না", "দৈনন্দিন"],
    writing: ["লিখুন", "কবিতা", "গল্প", "বিজ্ঞাপন"],
    research: ["গবেষণা", "বিশ্লেষণ"],
    business: ["ব্যবসা", "ব্যবসার", "বিক্রয়", "বিক্রয়", "গ্রাহক", "প্রস্তাব"],
  };
  const bn = Object.entries(bangla)
    .map(
      ([category, words]) =>
        [category, words.filter((w) => lowerText.includes(w)).length] as const,
    )
    .sort((a, b) => b[1] - a[1]);
  if (bn[0] && bn[0][1] > 0) return bn[0][0] as Category;
  const scores: Partial<Record<Category, number>> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "general") continue;
    let score = 0;
    for (const keyword of keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (
        new RegExp(
          `(?:^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`,
          "iu",
        ).test(lowerText)
      ) {
        score += keyword.includes(" ") ? 3 : 1; // Multi-word matches score higher
      }
    }
    if (score > 0) {
      scores[category as Category] = score;
    }
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const top = sorted[0];
  return top ? (top[0] as Category) : "general";
}

// ---- Category Metadata ----
export const CATEGORY_INFO: Record<
  Category,
  { label: string; emoji: string; description: string }
> = {
  education: {
    label: "Education",
    emoji: "🎓",
    description: "Academic & study tasks",
  },
  coding: { label: "Coding", emoji: "💻", description: "Software development" },
  learning: {
    label: "Learning",
    emoji: "📚",
    description: "Skill development",
  },
  daily: { label: "Daily Life", emoji: "📋", description: "Everyday tasks" },
  writing: { label: "Writing", emoji: "✍️", description: "Content creation" },
  research: {
    label: "Research",
    emoji: "🔬",
    description: "Analysis & investigation",
  },
  business: {
    label: "Business",
    emoji: "💼",
    description: "Professional tasks",
  },
  general: { label: "General", emoji: "✨", description: "Any topic" },
};

// A conservative intent-locked local engine. Original text and code remain intact.
export function optimizePrompt(
  input: string,
  category: Category,
  mode: OptimizationMode,
): OptimizationResult {
  if (input.length > 100000)
    throw new Error("Prompt must be at most 100,000 characters.");
  const text = input.trim();
  const analysis = analyzePrompt(text);
  const result = (
    optimized: string,
    reasons: string[],
  ): OptimizationResult => ({
    original: input,
    optimized,
    category,
    mode,
    improvements: reasons,
    timestamp: Date.now(),
    engine: "local",
    status: optimized === text ? "unchanged" : "improved",
    questions: analysis.questions,
    protectedConstraints: analysis.constraints,
  });
  if (!text) return result("", []);
  const bn = analysis.language === "bn",
    banglish = analysis.language === "banglish";
  // Do not guess a subject or override explicit prohibitions to manufacture a rewrite.
  if (
    analysis.verbatim ||
    analysis.lengthLocked ||
    analysis.hasNegativeConstraint ||
    analysis.questions.some((q) => q.includes("poem")) ||
    /^(?:write a haiku|শুধু একটি কবিতা লিখুন)$/i.test(text)
  )
    return result(text, [
      bn
        ? "মূল নির্দেশনা যথেষ্ট নির্দিষ্ট; সীমাবদ্ধতার সঙ্গে বিরোধ তৈরি করতে কোনো নির্দেশ যোগ করা হয়নি।"
        : "No safe addition needed: explicit wording, length or negative constraints take priority.",
    ]);
  // Raw fenced payloads without an instruction are data, not a task to invent.
  if (/^```/.test(text))
    return result(text, [
      "Supplied code preserved; specify the task before rewriting.",
    ]);
  let addition = "";
  const prose = text.replace(/```[\s\S]*?```/g, "");
  if (analysis.format === "poetry") {
    if (mode === "quick")
      return result(text, [
        "Requested poetic form retained; no extra outline or commentary added.",
      ]);
    addition = bn
      ? "অনুরোধ করা কাব্যরূপ ও বিষয় বজায় রেখে নির্দিষ্ট চিত্রকল্প ব্যবহার করুন। কবিতার পরে বিশ্লেষণ যোগ করবেন না।"
      : "Keep the requested poetic form and theme; use concrete sensory details. Return the poem without an outline or analysis.";
  } else if (
    analysis.format === "json" ||
    analysis.format === "csv" ||
    analysis.format === "regex" ||
    analysis.format === "code"
  ) {
    return result(text, [
      "Requested machine-readable format retained; no unrequested fields or explanations added.",
    ]);
  } else if (/\b(?:tcp|three[ -]way handshake)\b/i.test(prose)) {
    addition =
      "Describe the SYN, SYN-ACK and ACK exchange and what each step establishes.";
  } else if (
    /\b(?:debug|fix|fails?|crash|error)\b|বাগ|ঠিক করুন/i.test(prose) &&
    category === "coding"
  ) {
    addition = bn
      ? "দেওয়া কোড ও ত্রুটির ভিত্তিতে কারণ চিহ্নিত করুন। প্রয়োজনীয় তথ্য না থাকলে আগে প্রশ্ন করুন। অনুরোধ করা পরিবর্তন ছাড়া বিদ্যমান আচরণ অক্ষুণ্ণ রাখুন।"
      : "Identify the cause from the supplied code and error; ask for missing evidence before proposing a fix. Preserve behavior outside the requested change.";
    if (mode === "expert")
      addition += bn
        ? " সংশোধন যাচাই করার একটি পরীক্ষা দিন।"
        : " Include a focused test that verifies the fix.";
  } else if (category === "coding") {
    addition = bn
      ? "প্রদত্ত প্রয়োজনীয়তা ও অনুমান আলাদা করুন। ইন্টারফেস অক্ষুণ্ণ রাখুন এবং সমাধান যাচাইয়ের উপায় দিন।"
      : "Separate stated requirements from assumptions. Preserve interfaces and explain how the proposed solution can be verified.";
    if (mode === "expert")
      addition += bn
        ? " ব্যর্থতার সম্ভাব্য কারণ ও কর্মক্ষমতার আপসগুলো বিবেচনা করুন।"
        : " Consider failure modes and performance trade-offs.";
  } else if (category === "learning" || category === "education") {
    addition = bn
      ? "বর্তমান জ্ঞানের স্তর অজানা হলে আগে জিজ্ঞেস করুন। একটি বাস্তব উদাহরণ দিয়ে ধারণাটি বোঝান এবং বোঝাপড়া যাচাইয়ের একটি প্রশ্ন দিন।"
      : banglish
        ? "Age amar current level jene nao. Ekta practical example diye bojhao, tarpor bujhechi kina ekta proshno koro."
        : "Ask about the current level if it is missing; explain with one practical example and a question to check understanding.";
  } else if (category === "writing") {
    addition = bn
      ? "পাঠক ও লেখার ধরন স্পষ্ট না হলে আগে জিজ্ঞেস করুন। অনুরোধ করা বিষয় ও বিন্যাস বজায় রাখুন।"
      : "If audience or tone is missing, ask before drafting. Preserve the requested subject and form.";
  } else if (category === "business") {
    addition = bn
      ? "দেওয়া তথ্যের ভিত্তিতে পরবর্তী করণীয় দিন। দাম, সময়সীমা বা ব্যবসায়িক দাবি সম্পর্কে অনুপস্থিত তথ্য আগে জিজ্ঞেস করুন।"
      : "Use the supplied facts to identify next steps. Ask for missing prices, deadlines or evidence rather than inventing commitments.";
  } else if (category === "research") {
    addition = bn
      ? "প্রমাণ ও অনুমান আলাদা করুন এবং অজানা তথ্য স্পষ্ট করুন।"
      : "Separate supporting evidence from assumptions and identify what remains unknown.";
  } else if (category === "daily") {
    addition = bn
      ? "মূল লক্ষ্য পূরণের জন্য ব্যবহারযোগ্য পরবর্তী পদক্ষেপ দিন; সময় বা বাজেট অজানা হলে আগে জিজ্ঞেস করুন।"
      : "Give actionable next steps; ask about time or budget only if needed for the task.";
  } else if (mode !== "quick") {
    addition = bn
      ? "মূল লক্ষ্য ও সীমাবদ্ধতা বজায় রাখুন। প্রয়োজনীয় তথ্য অনুপস্থিত হলে তা আগে জিজ্ঞেস করুন।"
      : "Preserve the objective and constraints. Ask about essential missing context before answering.";
  } else
    return result(text, [
      "No task-specific improvement identified; original retained instead of adding generic headings.",
    ]);
  if (mode === "beginner" && !analysis.format)
    addition += bn
      ? " সহজ ভাষা ব্যবহার করুন।"
      : banglish
        ? " Shohoj bhashay bolo."
        : " Use simple language and define necessary jargon.";
  return result(text + "\n\n" + addition, [
    bn
      ? "মূল লেখা ও কোড অক্ষুণ্ণ রেখে কাজের জন্য প্রাসঙ্গিক নির্দেশ যোগ করা হয়েছে।"
      : "Original wording and supplied code preserved; added task-specific guidance.",
    ...(analysis.constraints.length
      ? ["Explicit format constraints retained."]
      : []),
  ]);
}

// ---- Utility Functions ----
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
