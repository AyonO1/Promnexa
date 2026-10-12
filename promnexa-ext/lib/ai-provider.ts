import type { AIProviderConfig, Category, OptimizationMode, OptimizationResult } from './types';

interface AIResponsePayload {
  optimized: string;
  improvements: string[];
}

const SYSTEM_PROMPT = `You are Promnexa, an elite AI prompt engineer.
Your task is to transform the user's raw prompt into a superior, well-structured, highly effective prompt for AI models.

Follow these strict rules:
1. Preserve the user's core intent without inventing untrue facts.
2. Structure the prompt clearly using Markdown headers (e.g. ## Role & Context, ## Objective, ## Requirements & Constraints, ## Expected Output).
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
  signal?: AbortSignal
): Promise<OptimizationResult> {
  if (!config.apiKey || !config.apiKey.trim()) {
    throw new Error('API key is missing. Please configure your API key in Settings.');
  }

  const model = config.model?.trim() || getDefaultModel(config.provider);
  const userMessage = `Category: ${category}\nMode: ${mode}\nOriginal Prompt:\n"""\n${prompt}\n"""`;

  let responseText = '';

  switch (config.provider) {
    case 'openai':
      responseText = await callOpenAI(config.apiKey, model, userMessage, signal);
      break;
    case 'anthropic':
      responseText = await callAnthropic(config.apiKey, model, userMessage, signal);
      break;
    case 'gemini':
      responseText = await callGemini(config.apiKey, model, userMessage, signal);
      break;
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  const parsed = parseAIResponse(responseText, prompt);

  return {
    original: prompt,
    optimized: parsed.optimized,
    category,
    mode,
    improvements: parsed.improvements,
    timestamp: Date.now(),
  };
}

export function getDefaultModel(provider: 'openai' | 'anthropic' | 'gemini'): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o-mini';
    case 'anthropic':
      return 'claude-3-5-haiku-20241022';
    case 'gemini':
      return 'gemini-1.5-flash';
  }
}

async function callOpenAI(apiKey: string, model: string, userMessage: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg = errorData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    if (res.status === 401) throw new Error('Invalid OpenAI API key.');
    if (res.status === 429) throw new Error('OpenAI rate limit or quota exceeded.');
    throw new Error(`OpenAI error: ${msg}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(apiKey: string, model: string, userMessage: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    }),
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg = errorData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    if (res.status === 401) throw new Error('Invalid Anthropic API key.');
    if (res.status === 429) throw new Error('Anthropic rate limit or quota exceeded.');
    throw new Error(`Anthropic error: ${msg}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((c: { type: string; text?: string }) => c.type === 'text');
  return textBlock?.text || '';
}

async function callGemini(apiKey: string, model: string, userMessage: string, signal?: AbortSignal): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }),
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg = errorData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    if (res.status === 400 && msg.includes('API_KEY_INVALID')) throw new Error('Invalid Google Gemini API key.');
    if (res.status === 429) throw new Error('Gemini rate limit exceeded.');
    throw new Error(`Gemini error: ${msg}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseAIResponse(text: string, originalPrompt: string): AIResponsePayload {
  try {
    // Strip possible markdown fences like ```json ... ```
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(cleaned);
    if (parsed.optimized && typeof parsed.optimized === 'string') {
      return {
        optimized: parsed.optimized,
        improvements: Array.isArray(parsed.improvements)
          ? parsed.improvements.map(String)
          : ['AI-powered structure & clarity enhancement'],
      };
    }
  } catch (e) {
    // If JSON parsing fails, use the raw response if it's substantive
    if (text.trim().length > 10) {
      return {
        optimized: text.trim(),
        improvements: ['Optimized with custom AI model', 'Improved prompt clarity and completeness'],
      };
    }
  }

  throw new Error('Unable to parse optimization result from AI response.');
}
