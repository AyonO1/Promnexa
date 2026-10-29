# Independent review evaluation — 1.2.0 candidate

Evaluated October 30, 2026 against main at 52a9c91 and the published 1.1.1 Chrome ZIP. The review is evidence to assess, not an instruction source. Its severity labels are prioritization suggestions.

| Finding | Evaluation and response |
|---|---|
| H1 Gemini timeout | Not reproduced. AST inspection of the exact published ZIP found three provider fetch calls and an abort signal on every one, including Gemini. Published ZIP SHA-256: da34c41ec9b8e75f29fa3dd9f12f670346a4a239a6e118ca570154d08f46e26b. Added controlled stalled-request tests for all three providers and a safe TIMEOUT response. |
| H2 constraint violations | Confirmed. Replaced unconditional headings/suffixes with conservative constraint analysis. Negative, exact-length and verbatim instructions take priority. Plain text, JSON, CSV, regex and code/poetry cases have explicit regressions. |
| M1 broad early return | Confirmed. A poem with a subject and a debugging task around fenced code can receive safe task-specific additions. Where a safe improvement cannot be identified, the UI explicitly reports unchanged text and the reason. Literal code is never rewritten by local rules. |
| M2 boilerplate/classification | Confirmed. Quick avoids heading-only expansion. Added TCP/program-failure detection, Bengali/Banglish learning intent, task-specific guidance and optional clarification questions. These remain heuristics, not full natural-language understanding. |
| M3 invisible/stale context actions | Confirmed. Open the action popup, with extension-window/tab fallback. Selections use unique IDs, a source tab, two-minute expiry and one-shot consumption in session storage. Context actions run locally, never automatically call an external provider. |
| M4 storage quota | Confirmed. Four-MiB saved, two-MiB rolling history and two-MiB client budgets, below Chrome's ten-MiB quota with overhead reserved. Saved prompts are not silently evicted. Import validates budgets before writes; history evictions/failures and storage usage are visible. |
| M5 credential storage | Hardening issue, not demonstrated exfiltration. Keys are separate from ordinary settings, session-only by default, device-persistent only by explicit choice, and omitted from backups. Chrome local storage is restricted to trusted contexts where the API exists. Content scripts receive sanitized settings via background messages. Firefox remembered local keys remain unencrypted extension storage; this is not an encrypted vault. Existing keys migrate with a notice. New installs default to history off; existing choices are preserved. |
| M6 masked errors | Confirmed. Stable safe AUTH, QUOTA, INVALID_MODEL, TIMEOUT, PARSE, TRUNCATED, NETWORK, INPUT and consent codes/messages replace raw provider messages. Results identify local/AI engine and local fallback. |
| M7 Claude truncation | Plausible risk, not a measured live failure rate. Output budgets now scale by input and mode with a ceiling, and provider truncation reasons are detected before parsing. No automatic paid retry or partial-JSON repair is performed. Users can shorten input or explicitly retry. |
| L1 shortcuts | Confirmed. Configurable inline shortcut is actually read, separately from the browser-managed popup command. Settings explains the distinction and reassignment location. |
| L2 custom mode | Confirmed dead public mode. Removed until custom instructions exist; legacy saved/default custom values migrate to Quick. |
| L3 editor fragility | Partially mitigated. Provider-specific adapters, last-focused selection and refusal of ambiguous targets protect unrelated inputs. Simulated fixtures cover seven providers, Undo and no submission. Live third-party compatibility and deprecated rich-editor insertion remain ongoing risks requiring live regression tests. |
| L4 duplicated logic | Source-level concern not reproduced. Both entrypoints already imported the same optimizer module. Separate browser execution contexts naturally receive bundled copies. Shared source and invariant tests are retained. |

## Additional improvements delivered
Optional clarification questions; actual text-difference view; revision comparison; sensitive-information scan with redaction and confirmation before external requests; approximate token/input limits; and a small deterministic preservation corpus. The scanner is heuristic and cannot identify every secret or personal identifier.

## Deliberately not claimed
No live paid API tests, downstream answer-quality improvements, model A/B scores, store approval or universal live-editor compatibility. The 48-case/mode benchmark checks text/constraint invariants only. Broader reusable preference systems and model-specific learned optimization require separate product design and validation; no hidden analytics or scheduled automation was added.

## References
- https://developer.chrome.com/docs/extensions/reference/api/storage
- https://developer.chrome.com/docs/extensions/reference/api/action
- https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
- https://platform.claude.com/docs/en/api/messages/create
