# Promnexa 1.1.0 verification

Date: October 28, 2026.

## Automated regression tests
56 Node tests cover local optimization, explicit constraints, Bengali behavior, word-boundary classification, storage and concurrent writes, disabled history, secret-free backups, atomic invalid-import rejection, limits and legacy imports, client profiles, prompt revisions and feedback, variable filling, guided workflows, CSV parsing and template filtering. Provider tests mock the network and cover endpoint/credential handling, malformed responses, authentication failure and timeout abortion.

Commands:
```
npm ci
npm run compile
npm test
npm run build
npm run build:firefox
```

## Browser smoke tests
`scripts/browser-smoke.cjs` uses Playwright and a separate headless Chrome process. Supply `PROMNEXA_PLAYWRIGHT` with a Playwright module location if it is not installed in the development environment, and optionally `PROMNEXA_CHROME` with a Chrome executable. Extension APIs and provider responses are mocked. The script exercises profiles, workflows, optimizer, revisions, feedback, immediate settings updates, history disablement, constrained prompts, lazy library and editable variables. It asserts no runtime errors or external network requests in local popup use. The floating assistant is tested against a simulated chat editor.

## Limits
Mocked API tests do not establish live account/model availability or cost. Simulated composer tests do not establish compatibility with every live ChatGPT/Claude/Gemini/DeepSeek/Copilot/Grok/Perplexity editor. Firefox consent requires live Firefox verification. Automated validation does not establish improved downstream AI response quality or guarantee browser-store acceptance. Firefox lint may flag dynamic HTML rendering in sanitized content UI and React internals; those warnings require reviewer context.


## Dependency audit
The initial audit found six affected development dependencies. Compatible updates were applied to the lockfile with `npm audit fix --ignore-scripts`. The earlier 1.1.1 audit reported zero known vulnerabilities at that time. The October 30 candidate audit reports four low-severity development-tool findings, all arising from deepmerge GHSA-gcqx-w48m-w2h4 through addons-linter, web-ext and WXT. The registry currently offers no patched deepmerge version (latest 4.3.1); npm suggests unrelated major downgrades, which were not applied. These packages are build/lint tooling rather than shipped extension runtime dependencies. Avoid feeding untrusted configurations to build tools; recheck before release.

## Firefox lint
Zero errors. Three remaining warnings concern dynamic HTML assignment: one in the floating assistant (user-derived text is escaped) and two in bundled React internals. Desktop minimum is 140; Android minimum is 142. These require normal reviewer assessment rather than suppression.


## Version 1.1.1 direct-chat verification
The browser test additionally checks one-click replacement with no preview, exact whitespace restoration, keyboard activation and Alt+Shift+P, repeated-click protection, manual-edit and navigation guards, empty composers, stale previews, plain/rich text editors and zero form submissions. Rich-editor Undo snapshots the normalized text inserted by the browser so line-break normalization does not disable Undo incorrectly.

GitHub delivery verification additionally checks and redacts credential-shaped examples in upstream prompt datasets. The importer applies the same redaction before future redistributions.


## 1.2.0 review-hardening candidate (October 30, 2026)
89 unit tests cover the original functionality plus all-provider stalled requests, safe errors, truncation, intent/format preservation, Bengali/Banglish cases, credential separation/migration/access policy, byte quotas, sensitivity scanning, shortcut matching and expiring/tab-bound context actions. The separate deterministic corpus checks 48 case/mode invariants; it does not grade downstream model quality. The built background smoke test verifies actual bundled message handling without network calls. The browser smoke test adds diff rendering, redaction, inline preferences, no direct local-storage access from content, ambiguity refusal and seven provider DOM fixtures. These fixtures are simulated; they are not a claim of live site certification.

The exact published 1.1.1 bundle was inspected to assess H1: all three provider fetch calls already carried an abort signal. No Gemini-signal patch was necessary. See REVIEW_RESPONSE.md for every finding and remaining limits. No live paid provider calls or arbitrary A/B quality scores were used.
