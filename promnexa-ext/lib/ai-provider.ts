import { ProviderError, errorForResponse } from "./provider-errors.ts";
import type {
  AIProviderConfig,
  Category,
  OptimizationMode,
  OptimizationResult,
} from "./types";

interface AIResponsePayload {
  optimized: string;
  improvements: string[];
}

const SYSTEM_PROMPT = `You are Promnexa, an elite AI prompt engineer.
Your task is to transform the user's raw prompt into a superior, well-structured, highly effective prompt for AI models.

Follow these strict rules:
1. Preserve the user's core intent without inventing untrue facts.
2. Preserve explicit format, length, language and negative constraints. Add structure only when useful; do not add outlines, explanations or headers to constrained creative or JSON-only requests. Preserve Bengali and mixed-language intent, and honor any requested output language.
3. If important context is missing, include clear bracketed placeholders like [specify your language/level/audience].
4. Match the requested optimization mode:
   - "quick": Concise, clear, direct instructions with zero fluff.
   - "deep": Comprehensive, structured, contextual, edge-case aware.
   - "expert": Advanced technical standards, industry best practices, rigorous constraints.
   - "beginner": Step-by-step, accessible, encouraging, clear guidance.
5. Provide 3 to 5 concise bullet points describing the improvements made.

You MUST respond strictly with valid JSON conforming to this schema:
{
  "optimized": "The complete optimized prompt text",
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"]
}`;

export async function optimizeWithAI(
  prompt: string,
  category: Category,
  mode: OptimizationMode,
  config: AIProviderConfig,
  signal?: AbortSignal,
  timeoutMs = 30000,
): Promise<OptimizationResult> {
  if (!config.apiKey || !config.apiKey.trim()) {
    throw new ProviderError("AUTH");
  }

  if (!prompt.trim() || prompt.length > 100000)
    throw new ProviderError("INPUT");
  signal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)])
    : AbortSignal.timeout(timeoutMs);
  const retired: Record<string, string> = {
    "claude-3-5-haiku-20241022": "claude-haiku-5-5",
    "gemini-1.5-flash": "gemini-3.8-flash",
  };
  const selected = config.model?.trim();
  const model =
    retired[selected] || selected || getDefaultModel(config.provider);
  const userMessage = `Category: ${category}\nMode: ${mode}\nOriginal Prompt:\n"""\n${prompt}\n"""`;

  let responseText = "";

  switch (config.provider) {
    case "openai":
      responseText = await callOpenAI(
        config.apiKey,
        model,
        userMessage,
        signal,
      );
      break;
    case "anthropic":
      responseText = await callAnthropic(
        config.apiKey,
        model,
        userMessage,
        signal,
        mode,
      );
      break;
    case "gemini":
      responseText = await callGemini(
        config.apiKey,
        model,
        userMessage,
        signal,
      );
      break;
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  const parsed = parseAIResponse(responseText, prompt);

  return {
    original: prompt,
    optimized: parsed.optimized.trim(),
    category,
    mode,
    improvements: parsed.improvements,
    timestamp: Date.now(),
    engine: "ai",
    status:
      parsed.optimized.trim() === prompt.trim() ? "unchanged" : "improved",
  };
}

export function getDefaultModel(
  provider: "openai" | "anthropic" | "gemini",
): string {
  switch (provider) {
    case "openai":
      return "gpt-4o-mini";
    case "anthropic":
      return "claude-haiku-5-5";
    case "gemini":
      return "gemini-3.8-flash";
  }
}

async function callOpenAI(
  apiKey: string,
  model: string,
  userMessage: string,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    }),
    signal,
  });

  if (!res.ok) throw await errorForResponse(res);

  const data = await res.json();
  if (data.choices?.[0]?.finish_reason === "length")
    throw new ProviderError("TRUNCATED");
  return data.choices?.[0]?.message?.content || "";
}

async function callAnthropic(
  apiKey: string,
  model: string,
  userMessage: string,
  signal?: AbortSignal,
  mode: OptimizationMode = "quick",
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey.trim(),
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      max_tokens: outputTokenBudget(userMessage, mode),
    }),
    signal,
  });

  if (!res.ok) throw await errorForResponse(res);

  const data = await res.json();
  if (data.stop_reason === "max_tokens") throw new ProviderError("TRUNCATED");
  const textBlock = data.content?.find(
    (c: { type: string; text?: string }) => c.type === "text",
  );
  return textBlock?.text || "";
}

async function callGemini(
  apiKey: string,
  model: string,
  userMessage: string,
  signal?: AbortSignal,
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey.trim(),
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
    signal,
  });

  if (!res.ok) throw await errorForResponse(res);

  const data = await res.json();
  if (data.candidates?.[0]?.finishReason === "MAX_TOKENS")
    throw new ProviderError("TRUNCATED");
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || "")
      .join("") || ""
  );
}

export function parseAIResponse(
  text: string,
  originalPrompt?: string,
): AIResponsePayload {
  try {
    // Strip possible markdown fences like ```json ... ```
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    const parsed = JSON.parse(cleaned);
    if (
      typeof parsed.optimized === "string" &&
      parsed.optimized.trim() &&
      parsed.optimized.length <= 100000
    ) {
      return {
        optimized: parsed.optimized.trim(),
        improvements: Array.isArray(parsed.improvements)
          ? parsed.improvements
              .filter((x: unknown) => typeof x === "string")
              .slice(0, 8)
          : ["AI-powered structure & clarity enhancement"],
      };
    }
  } catch {
    // Invalid provider output must trigger the local fallback, not be presented as a prompt.
  }

  throw new ProviderError("PARSE");
}

export function outputTokenBudget(
  input: string,
  mode: OptimizationMode = "quick",
): number {
  return Math.min(
    16000,
    Math.max(
      mode === "deep" || mode === "expert" ? 4096 : 2048,
      Math.ceil(new TextEncoder().encode(input).length / 2) + 1024,
    ),
  );
}
