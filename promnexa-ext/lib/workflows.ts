import type { ClientProfile, WorkflowKind } from "./types";
const VARIABLE =
  /\{\{\s*([\w -]+)\s*\}\}|\$\{([\w -]+)\}|\[([A-Z][A-Za-z0-9 _\-/]*)\]/g;
export function templateVariables(text: string): string[] {
  return [
    ...new Set(
      [...text.matchAll(VARIABLE)].map((m) =>
        (m[1] || m[2] || m[3] || "").trim(),
      ),
    ),
  ];
}
export function fillTemplate(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(
    VARIABLE,
    (match, a, b, c) => values[(a || b || c).trim()]?.trim() || match,
  );
}
export function buildWorkflow(
  kind: WorkflowKind,
  brief: string,
  profile: ClientProfile | null,
  language: "en" | "bn",
  details: { audience: string; goal: string; constraints: string },
): string {
  if (!brief.trim() || !details.audience.trim() || !details.goal.trim())
    throw new Error(
      language === "bn"
        ? "বিবরণ, লক্ষ্য ও পাঠক পূরণ করুন।"
        : "Fill in the brief, audience and goal.",
    );
  const tasks =
    language === "bn"
      ? {
          proposal:
            "ক্লায়েন্টের জন্য একটি প্রস্তাব তৈরি করুন। কাজের পরিধি, ধাপ, সময়সীমা এবং অনুমান আলাদা করে লিখুন।",
          advertising:
            "একটি বিজ্ঞাপনের ব্রিফ তৈরি করুন। মূল বার্তা, তিনটি ধারণা এবং আহ্বান দিন। প্রমাণ ছাড়া দাবি করবেন না।",
          reply:
            "ক্লায়েন্টকে একটি পেশাদার উত্তর লিখুন। প্রতিক্রিয়া স্বীকার করুন এবং পরবর্তী কাজগুলো স্পষ্ট করুন।",
        }
      : {
          proposal:
            "Draft a client proposal with scope, deliverables, milestones, timeline and clearly labeled assumptions.",
          advertising:
            "Create an advertising brief with a core message, three concepts and a call to action. Do not invent product claims.",
          reply:
            "Draft a professional client reply acknowledging the feedback and specifying next steps.",
        };
  const labels =
    language === "bn"
      ? ["মূল বিবরণ", "পাঠক", "লক্ষ্য", "সীমাবদ্ধতা", "ক্লায়েন্টের তথ্য"]
      : ["Original brief", "Audience", "Goal", "Constraints", "Client context"];
  const context = profile
    ? JSON.stringify(
        {
          name: profile.name,
          audience: profile.audience,
          offer: profile.offer,
          tone: profile.tone,
          constraints: profile.constraints,
        },
        null,
        2,
      )
    : "";
  return [
    tasks[kind],
    `${labels[0]}:\n${brief.trim()}`,
    `${labels[1]}: ${details.audience.trim()}`,
    `${labels[2]}: ${details.goal.trim()}`,
    details.constraints.trim()
      ? `${labels[3]}: ${details.constraints.trim()}`
      : "",
    context ? `${labels[4]}:\n${context}` : "",
    language === "bn"
      ? "বাংলায় লিখুন। অনুপস্থিত তথ্য সম্পর্কে প্রশ্ন করুন; দাম, প্রতিশ্রুতি বা তথ্য উদ্ভাবন করবেন না।"
      : "Write in English. Ask about missing facts; do not invent prices, commitments or evidence.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
