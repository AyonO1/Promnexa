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

// ---- Optimization Templates ----
interface OptimizationTemplate {
  prefix: string;
  structure: string[];
  suffix: string;
}

const MODE_TEMPLATES: Record<OptimizationMode, OptimizationTemplate> = {
  quick: {
    prefix: "",
    structure: [
      "Clear the objective",
      "Specify the expected output format",
      "Add relevant constraints",
    ],
    suffix: "Be concise and direct.",
  },
  deep: {
    prefix: "",
    structure: [
      "Define the role/expertise needed",
      "State the objective clearly",
      "Provide necessary context",
      "Specify requirements and constraints",
      "Define the expected output format",
      "Include quality criteria",
      "Add relevant examples if helpful",
    ],
    suffix: "Provide a thorough, well-structured response.",
  },
  expert: {
    prefix: "Act as a domain expert.",
    structure: [
      "Identify the professional domain",
      "Apply industry standards",
      "Reference best practices",
      "Include technical specifications",
      "Provide actionable recommendations",
      "Consider edge cases",
    ],
    suffix: "Apply professional-grade rigor to the response.",
  },
  beginner: {
    prefix: "",
    structure: [
      "Explain in simple, accessible language",
      "Use analogies and real-world examples",
      "Break down complex concepts step by step",
      "Avoid jargon unless defined",
      "Include practical exercises",
    ],
    suffix: "Make the explanation accessible to someone new to this topic.",
  },
  custom: {
    prefix: "",
    structure: [],
    suffix: "",
  },
};

// ---- Category-Specific Enhancements ----
function getCategoryEnhancements(category: Category): string {
  switch (category) {
    case "education":
      return "\n\nAdditional context:\n- Specify the academic level (high school / undergraduate / graduate)\n- Include learning objectives\n- Reference curriculum standards if applicable\n- Suggest assessment criteria";

    case "coding":
      return "\n\nTechnical context:\n- Specify the programming language and version\n- Mention the framework/library if relevant\n- Include error messages or stack traces if debugging\n- Define expected behavior vs actual behavior\n- Specify testing requirements";

    case "learning":
      return "\n\nLearning context:\n- Specify current skill level\n- Define learning goals and timeline\n- Prefer hands-on examples and exercises\n- Include progress checkpoints\n- Suggest resources for further learning";

    case "daily":
      return "\n\nPractical context:\n- Keep the response actionable and concise\n- Include specific steps or checklists\n- Consider time and budget constraints\n- Prioritize practicality over perfection";

    case "writing":
      return "\n\nWriting context:\n- Specify the target audience\n- Define the desired tone and style\n- Include word count or length guidelines\n- Consider SEO requirements if applicable\n- Maintain consistent voice throughout";

    case "research":
      return "\n\nResearch context:\n- Cite sources and evidence\n- Distinguish between established facts and hypotheses\n- Use appropriate methodology\n- Acknowledge limitations\n- Present findings objectively";

    case "business":
      return "\n\nBusiness context:\n- Include relevant metrics and KPIs\n- Consider stakeholder perspectives\n- Provide actionable recommendations\n- Account for timeline and resources\n- Include risk assessment";

    default:
      return "";
  }
}

// ---- Core Optimization Logic ----
export function optimizePrompt(
  input: string,
  category: Category,
  mode: OptimizationMode,
): OptimizationResult {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return {
      original: input,
      optimized: "",
      category,
      mode,
      improvements: [],
      timestamp: Date.now(),
    };
  }

  if (trimmedInput.length > 100000)
    throw new Error("Prompt must be at most 100,000 characters.");
  const bn = /[\u0980-\u09FF]/.test(trimmedInput);
  const strict =
    /\b(only|exactly|verbatim|no (?:headings|explanation|markdown)|do not (?:add|change)|json|haiku|sonnet|poem|poetry|regex|csv)\b|শুধু|হুবহু|কবিতা|হাইকু/i.test(
      trimmedInput,
    );
  // Explicit constraints and code are stronger signals than prompt length.
  if (strict || /```/.test(trimmedInput) || mode === "custom") {
    return {
      original: input,
      optimized: trimmedInput,
      category,
      mode,
      improvements: [
        bn
          ? "মূল নির্দেশনা ও নির্দিষ্ট বিন্যাস অক্ষুণ্ণ রাখা হয়েছে"
          : "Preserved explicit constraints and original wording",
      ],
      timestamp: Date.now(),
    };
  }
  if (bn) {
    const extra =
      mode === "quick"
        ? "মূল উদ্দেশ্য বজায় রেখে সরাসরি ও সংক্ষিপ্ত উত্তর দিন।"
        : mode === "beginner"
          ? "সহজ ভাষায় ধাপে ধাপে ব্যাখ্যা করুন। প্রয়োজন হলে উদাহরণ দিন।"
          : "মূল উদ্দেশ্য ও সীমাবদ্ধতা মেনে নির্ভুল এবং ব্যবহারযোগ্য উত্তর দিন। তথ্য অনুপস্থিত হলে তা স্পষ্ট করুন; অনুমানকে সত্য হিসেবে লিখবেন না।";
    return {
      original: input,
      optimized: trimmedInput + "\n\n" + extra,
      category,
      mode,
      improvements: ["মূল ভাষা ও উদ্দেশ্য বজায় রাখা হয়েছে"],
      timestamp: Date.now(),
    };
  }
  const template = MODE_TEMPLATES[mode];
  const improvements: string[] = [];
  let optimized = "";

  // Detect if the prompt is too vague
  const isVague =
    !/\b(create|build|write|explain|make|fix|design|develop|analyze|generate|translate|summarize|draft|teach|plan)\b/i.test(
      trimmedInput,
    ) && trimmedInput.split(/\s+/).length < 5;
  const hasQuestion = /\?/.test(trimmedInput);
  const hasGoal =
    /\b(create|build|write|explain|help|make|fix|design|develop|improve|analyze|generate)\b/i.test(
      trimmedInput,
    );

  // Build the optimized prompt
  const parts: string[] = [];

  // 1. Role prefix
  if (mode === "expert") {
    const domain = detectDomain(trimmedInput, category);
    parts.push(`You are an expert ${domain}.`);
    improvements.push("Added relevant expert role");
  } else if (mode === "deep") {
    const domain = detectDomain(trimmedInput, category);
    parts.push(`You are a knowledgeable ${domain}.`);
    improvements.push("Added professional context");
  }

  // 2. Main objective — clarify the intent
  if (isVague) {
    parts.push(`\n## Objective\n${expandVaguePrompt(trimmedInput, category)}`);
    improvements.push("Expanded vague instruction into clear objective");
  } else {
    parts.push(`\n## Objective\n${clarifyPrompt(trimmedInput)}`);
    improvements.push("Clarified the main objective");
  }

  // 3. Context & requirements based on mode
  if (mode !== "quick") {
    const contextSection = buildContextSection(trimmedInput, category, mode);
    if (contextSection) {
      parts.push(contextSection);
      improvements.push("Added structured context and requirements");
    }
  }

  // 4. Output expectations
  const outputFormat = buildOutputExpectations(trimmedInput, category, mode);
  if (outputFormat) {
    parts.push(outputFormat);
    improvements.push("Specified expected output format");
  }

  // 5. Category-specific enhancements
  if (mode === "deep" || mode === "expert") {
    const enhancement = getCategoryEnhancements(category);
    if (enhancement) {
      parts.push(enhancement);
      improvements.push("Added category-specific guidelines");
    }
  }

  // 6. Quality constraints
  if (mode !== "quick") {
    parts.push("\n## Quality Guidelines");
    parts.push("- Be accurate and avoid making up information");
    parts.push("- Provide actionable and specific guidance");
    if (mode === "beginner") {
      parts.push("- Use simple language and clear explanations");
      parts.push("- Include helpful analogies where appropriate");
      improvements.push("Added beginner-friendly guidelines");
    }
    if (mode === "expert") {
      parts.push("- Apply industry best practices");
      parts.push("- Consider edge cases and potential issues");
      improvements.push("Added expert-level quality standards");
    }
  }

  // 7. Suffix
  if (template.suffix) {
    parts.push(`\n${template.suffix}`);
  }

  optimized = parts.join("\n");

  // Clean up
  optimized = optimized.replace(/\n{3,}/g, "\n\n").trim();

  return {
    original: input,
    optimized,
    category,
    mode,
    improvements,
    timestamp: Date.now(),
  };
}

// ---- Helper Functions ----
function detectDomain(text: string, category: Category): string {
  const domainMap: Record<Category, string> = {
    education: "educator and academic advisor",
    coding: "software engineer and technical architect",
    learning: "learning coach and curriculum designer",
    daily: "productivity consultant and personal advisor",
    writing: "professional writer and content strategist",
    research: "research analyst and data scientist",
    business: "business strategist and management consultant",
    general: "knowledgeable assistant",
  };
  return domainMap[category] || "knowledgeable assistant";
}

function expandVaguePrompt(text: string, category: Category): string {
  const expanded = text.charAt(0).toUpperCase() + text.slice(1);
  const templates: Record<Category, string> = {
    education: `${expanded}\n\nPlease provide a comprehensive and well-structured explanation that includes:\n- Key concepts and definitions\n- Practical examples\n- Common misconceptions to avoid\n- Practice exercises or questions to test understanding`,
    coding: `${expanded}\n\nPlease provide:\n- A clear, working solution with code\n- Step-by-step explanation of the approach\n- Best practices and potential pitfalls\n- Alternative approaches if applicable`,
    learning: `${expanded}\n\nPlease create a structured learning path that includes:\n- Prerequisites and foundational concepts\n- Progressive lessons from basics to advanced\n- Hands-on exercises and projects\n- Resources for further learning`,
    daily: `${expanded}\n\nPlease provide:\n- Clear, actionable steps\n- Practical tips and recommendations\n- Things to consider or watch out for\n- A summary of key points`,
    writing: `${expanded}\n\nPlease:\n- Define the target audience and tone\n- Create a structured outline\n- Write engaging content with clear structure\n- Include a compelling introduction and conclusion`,
    research: `${expanded}\n\nPlease provide:\n- A thorough analysis with evidence\n- Key findings and insights\n- Methodology and sources\n- Conclusions and recommendations`,
    business: `${expanded}\n\nPlease include:\n- Strategic analysis and recommendations\n- Key metrics and success criteria\n- Implementation timeline\n- Risk assessment and mitigation strategies`,
    general: `${expanded}\n\nPlease provide a thorough, well-organized response that covers:\n- Key points and main ideas\n- Supporting details and examples\n- Practical takeaways`,
  };
  return templates[category] || templates.general;
}

function clarifyPrompt(text: string): string {
  let clarified = text.trim();

  // Capitalize first letter
  clarified = clarified.charAt(0).toUpperCase() + clarified.slice(1);

  // Ensure it ends with proper punctuation
  if (!/[.!?]$/.test(clarified)) {
    clarified += ".";
  }

  return clarified;
}

function buildContextSection(
  text: string,
  category: Category,
  mode: OptimizationMode,
): string {
  const sections: string[] = [];

  sections.push("\n## Requirements");

  if (category === "coding") {
    sections.push("- Provide clean, well-commented code");
    sections.push("- Follow established coding conventions");
    sections.push("- Include error handling");
    if (mode === "expert") {
      sections.push("- Consider performance implications");
      sections.push("- Include test cases");
      sections.push("- Follow SOLID principles");
    }
  } else if (category === "education") {
    sections.push("- Structure the explanation logically");
    sections.push("- Use clear examples to illustrate concepts");
    if (mode === "beginner") {
      sections.push("- Start from the basics and build up");
      sections.push("- Avoid technical jargon");
    }
  } else if (category === "writing") {
    sections.push("- Maintain consistent tone and style");
    sections.push("- Use engaging and clear language");
    sections.push("- Structure content with headers and sections");
  } else {
    sections.push("- Be thorough yet concise");
    sections.push("- Focus on practical, actionable information");
    sections.push("- Organize the response clearly");
  }

  // Add placeholders for missing context
  if (text.split(" ").length < 10) {
    sections.push("\n## Context (please fill in)");
    sections.push("- [Specify your current level of knowledge on this topic]");
    sections.push("- [Describe any specific constraints or preferences]");
    sections.push("- [Mention the intended use or audience]");
  }

  return sections.join("\n");
}

function buildOutputExpectations(
  text: string,
  category: Category,
  mode: OptimizationMode,
): string {
  const sections: string[] = ["\n## Expected Output"];

  if (mode === "quick") {
    sections.push("- Provide a clear, concise response");
    return sections.join("\n");
  }

  switch (category) {
    case "coding":
      sections.push("- Working code with inline comments");
      sections.push("- Brief explanation of the approach");
      if (mode !== "beginner") {
        sections.push("- Time and space complexity analysis");
      }
      break;
    case "education":
      sections.push("- Structured explanation with examples");
      sections.push("- Key takeaways summary");
      sections.push("- Practice questions or exercises");
      break;
    case "writing":
      sections.push("- Well-structured content with clear sections");
      sections.push("- Engaging opening and strong conclusion");
      break;
    case "research":
      sections.push("- Evidence-based analysis");
      sections.push("- Clear methodology description");
      sections.push("- Summary of findings");
      break;
    default:
      sections.push("- Well-organized response with clear structure");
      sections.push("- Practical examples where applicable");
      sections.push("- Summary of key points");
  }

  return sections.join("\n");
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
