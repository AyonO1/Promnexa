export interface PromptAnalysis {
  language: "en" | "bn" | "banglish";
  format: "plain" | "json" | "csv" | "regex" | "code" | "poetry" | null;
  lengthLocked: boolean;
  verbatim: boolean;
  hasNegativeConstraint: boolean;
  constraints: string[];
  audience?: string;
  tone?: string;
  requestedLanguage?: string;
  questions: string[];
}
export function analyzePrompt(text: string): PromptAnalysis {
  // Analyze prose separately: literal code/JSON contents must not become instructions.
  const prose = text.replace(/```[\s\S]*?```/g, " [supplied code] ");
  const language = /[\u0980-\u09ff]/.test(prose)
    ? "bn"
    : /\b(amake|amar|kivabe|shekhao|shikhte|bujhao|banglay|likhe|likho)\b/i.test(
          prose,
        )
      ? "banglish"
      : "en";
  const plain =
    /(?:never|don['’]?t|do not|no|without|avoid)\s+(?:use\s+)?(?:any\s+)?(?:markdown|headings|formatting)|plain[ -]text|মার্কডাউন.*(?:নয়|নয়|না)|সাধারণ টেক্সট/i.test(
      prose,
    );
  const format = plain
    ? "plain"
    : /\bjson\b/i.test(prose)
      ? "json"
      : /\bcsv\b/i.test(prose)
        ? "csv"
        : /\bregex|regular expression/i.test(prose)
          ? "regex"
          : /\b(poem|poetry|haiku|sonnet)\b|কবিতা|হাইকু/i.test(prose)
            ? "poetry"
            : /\b(?:only|return|output)\s+(?:the\s+)?code\b/i.test(prose)
              ? "code"
              : null;
  const lengthLocked =
    /\b(?:exactly|at most|under|no more than|within|maximum)\s+(?:\d+|one|two|three|five|ten)\s+(?:words?|sentences?|lines?|characters?|tokens?)|\b(?:one|single)[ -]sentence|\bbrief(?:ly)?\b|\bshort answer\b|\d+\s*(?:শব্দ|বাক্য|লাইন)|সংক্ষেপে/i.test(
      prose,
    );
  const verbatim =
    /\b(verbatim|exactly as (?:written|provided)|do not (?:add|change|rewrite)|translate exactly)\b|হুবহু/i.test(
      prose,
    );
  const hasNegativeConstraint =
    /\b(never|avoid|without|don't|do not|no (?:(?:extra )?(?:headings|explanation|markdown|formatting|commentary|bullets|code|tables|analysis|jargon|examples)))\b|করবেন না|লিখবেন না|শুধু/i.test(
      prose,
    );
  const audience = prose
    .match(/\baudience\s*:\s*([^\n.;]{1,80})/i)?.[1]
    ?.trim();
  const tone = prose.match(/\btone\s*:\s*([^\n.;]{1,60})/i)?.[1]?.trim();
  const requestedLanguage =
    prose.match(
      /\b(?:answer|respond|write|output)\s+in\s+(English|Bengali|Bangla|Spanish|French|German|Arabic|Hindi)\b/i,
    )?.[1] ||
    (/ইংরেজিতে/.test(prose)
      ? "English"
      : /বাংলায়|বাংলায়/.test(prose)
        ? "Bengali"
        : undefined);
  const constraints = [
    ...(format ? [`Requested format: ${format}`] : []),
    ...(lengthLocked ? ["Explicit response length"] : []),
    ...(verbatim ? ["Exact wording or transformation"] : []),
    ...(hasNegativeConstraint ? ["Negative instructions retained"] : []),
    ...(audience ? [`Audience: ${audience}`] : []),
    ...(tone ? [`Tone: ${tone}`] : []),
    ...(requestedLanguage ? [`Output language: ${requestedLanguage}`] : []),
  ];
  const questions: string[] = [];
  const bn = language === "bn";
  if (
    /\b(debug|fix|fails?|error)\b|বাগ|ঠিক করুন/i.test(prose) &&
    !text.includes("```")
  )
    questions.push(
      bn
        ? "কোন কোড ও ত্রুটির বার্তা দেখা যাচ্ছে?"
        : "What code and error message should be examined?",
    );
  if (
    /\b(write|draft|create)\b|লিখুন|লিখে/i.test(prose) &&
    !format &&
    !/audience|\bfor\s+\w|পাঠক|জন্য/i.test(prose)
  )
    questions.push(
      bn ? "কার জন্য লেখাটি তৈরি হবে?" : "Who is the intended audience?",
    );
  if (/^(?:help|improve|make|do|fix)(?:\s+this)?[.!?]?$/i.test(prose.trim()))
    questions.push(bn ? "আপনি কী ফলাফল চান?" : "What outcome do you want?");
  if (
    /^(?:write a (?:haiku|poem|sonnet)|একটি কবিতা লিখুন)[.!?]?$/i.test(
      prose.trim(),
    )
  )
    questions.push(
      bn ? "কবিতার বিষয় কী হবে?" : "What should the poem be about?",
    );
  if (format === "json" && !/keys|schema|fields|কী|স্কিমা/i.test(prose))
    questions.push(
      bn
        ? "JSON-এ কোন কী ও বিন্যাস প্রয়োজন?"
        : "Which keys and schema must the JSON follow?",
    );
  if (format === "csv" && !/columns|headers|কলাম/i.test(prose))
    questions.push(
      bn ? "CSV-এ কোন কলাম প্রয়োজন?" : "Which columns must the CSV contain?",
    );
  return {
    language,
    format,
    lengthLocked,
    verbatim,
    hasNegativeConstraint,
    audience,
    tone,
    requestedLanguage,
    constraints,
    questions: questions.slice(0, 3),
  };
}
export function textDifference(original: string, changed: string) {
  let start = 0;
  while (
    start < original.length &&
    start < changed.length &&
    original[start] === changed[start]
  )
    start++;
  let end = 0;
  while (
    end < original.length - start &&
    end < changed.length - start &&
    original[original.length - 1 - end] === changed[changed.length - 1 - end]
  )
    end++;
  return {
    before: original.slice(0, start),
    removed: original.slice(start, original.length - end),
    added: changed.slice(start, changed.length - end),
    after: end ? original.slice(-end) : "",
  };
}
