# Promnexa 1.2.0 — review hardening candidate

- Conservative intent/format analysis replaces generic Markdown boilerplate. Added technical and Bengali/Banglish guidance, explicit unchanged reasons, clarification questions and text/version comparison.
- Session-first, separately stored API keys; explicit Remember option; sanitized content configuration; Chrome trusted-context access restriction. Existing keys migrate with a notice. No encryption claim is made.
- New installs default to history off. Byte budgets protect local storage; history rolls within its budget and save failures are visible. Saved prompts are not silently deleted.
- Context-menu selections open a visible extension editor, expire after two minutes and are consumed once, tied to the source tab.
- Safe provider error codes, explicit fallback labels, all-provider timeout regressions, dynamic Claude output budget and truncation detection. No automatic paid retries.
- Sensitive-information redaction/consent and an input limit with approximate token estimates before API use.
- Real inline-shortcut configuration, provider-specific editor fixtures and ambiguous-target refusal. No automatic sending.

This candidate is for review. Live provider calls, live-site coverage, downstream A/B quality evaluation and store acceptance remain unverified. Read REVIEW_RESPONSE.md for the evidence and limitations, including findings that did not reproduce.
