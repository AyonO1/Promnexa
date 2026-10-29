export interface SensitiveFinding {
  kind: string;
  start: number;
  end: number;
}
export function scanSensitiveInfo(text: string): SensitiveFinding[] {
  const patterns: [string, RegExp][] = [
    [
      "API key",
      /\b(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[A-Za-z0-9_-]{25,})\b/g,
    ],
    [
      "password or secret",
      /\b(?:password|passwd|secret|api[_ -]?key)\s*[:=]\s*["']?[^\s"',;]{4,}/gi,
    ],
    ["email address", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
    [
      "private key",
      /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----[\s\S]*?(?:-----END [^-]+-----|$)/g,
    ],
  ];
  const found = patterns
    .flatMap(([kind, re]) =>
      [...text.matchAll(re)].map((m) => ({
        kind,
        start: m.index!,
        end: m.index! + m[0].length,
      })),
    )
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: SensitiveFinding[] = [];
  for (const finding of found) {
    const previous = merged.at(-1);
    if (previous && finding.start < previous.end) {
      previous.end = Math.max(previous.end, finding.end);
      if (!previous.kind.includes(finding.kind))
        previous.kind += " / " + finding.kind;
    } else merged.push({ ...finding });
  }
  return merged;
}
export function redactSensitiveInfo(text: string): string {
  for (const f of scanSensitiveInfo(text).sort((a, b) => b.start - a.start))
    text = text.slice(0, f.start) + `[REDACTED ${f.kind}]` + text.slice(f.end);
  return text;
}
export function estimateTokens(text: string): number {
  return Math.ceil(new TextEncoder().encode(text).length / 3);
}
