# Promnexa 1.1.0 — Free/BYOK launch

## Added
- Local client profiles and guided proposal, advertising-brief and client-reply workflows.
- English/Bengali workflow output, with audience and goal required before generation.
- Editable template variables (`{{name}}`, `${name}`, `[TOPIC]`).
- Saved prompt revisions linked to the original, and local usefulness feedback.
- Explicit configured-AI button in the floating assistant, processed in the background extension context.

## Fixed
- Disabled history no longer records new optimizations; existing history is retained until cleared.
- Backups exclude API keys. Imports validate the complete payload, limits and version before one write; legacy imported keys are discarded.
- Settings refresh across screens; changing providers no longer carries another provider's key/model.
- AI requests time out after 30 seconds; invalid provider JSON triggers local fallback.
- Constrained requests, creative forms and code fences preserve original wording. Bengali inputs keep Bengali guidance. English categories use word boundaries.
- Manual categories are preserved, rapid popup requests cannot overwrite newer results, and context-menu actions retain their explain/summarize intent.
- More reliable textarea/contenteditable insertion, failure notifications, close/reopen behavior and unique toast IDs.
- Correct CSV parsing preserves commas, escaped quotes and multiline prompts; import failures return nonzero. The imported library was regenerated from upstream.
- General-category filter is precise, the template catalog loads only when opened, and remote font requests are removed.
- Retired Claude/Gemini defaults updated. Custom model fields remain available; real provider access depends on the customer's account.
- Windows builder checks Node/npm and fails on failed installs/tests/builds. CI includes TypeScript verification.
- Firefox 140+ declares optional API-data consent. Enable AI once in the popup before using it in-page.

## Release boundaries
This is free local/BYOK software. No checkout, subscription, account server, cloud team sharing or included AI credits are implemented. Customers pay their chosen API provider directly. Client profiles and feedback remain local, unless included in a brief the user explicitly sends to AI. There is no claim of measured improvement in downstream AI results.

## Installation
Chrome/Edge/Brave: load `promnexa-ext/.output/chrome-mv3`, or extract the Chrome release ZIP and select its manifest folder. Existing local installations should be reloaded from the extension manager. Reload open AI websites after updating.
Firefox: use the Firefox ZIP for store submission/signing. Local about:debugging installs are temporary. Store approval is not implied by a successful build or lint run.
