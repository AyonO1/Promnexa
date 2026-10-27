# Promnexa 1.1.1 — Store submission

## Listing
Name: Promnexa — AI Prompt Optimizer
Category: Productivity
Summary: Create reusable prompts and bilingual client briefs with local tools or your own AI provider.
Support: https://github.com/AyonO1/Promnexa/issues
Privacy policy: publish the updated PRIVACY.md to main before submitting its GitHub URL.

## Suggested description
Promnexa is a free browser extension for reusable prompts and client work. Use local tools without an account, or connect your own OpenAI, Anthropic or Gemini API key. Provider usage may incur separate charges.

- Save client profiles and build proposal, advertising and reply briefs.
- Choose English or Bengali workflow output.
- Browse 235 built-in/imported templates and fill reusable variables.
- Save prompt revisions and local usefulness feedback.
- Improve a draft directly inside supported AI chat composers, review it before sending, and Undo the change. Options retains explicit optional AI requests.
- Control local history, export backups without API keys, and clear local data.
- Local mode has no telemetry, analytics or remote font requests.

There are no subscriptions, included AI credits or hosted team workspaces in this release. Some settings and in-page controls remain English. Prompt suggestions do not guarantee better downstream AI results.

## Permissions and disclosures
- storage: local preferences, API configuration, clients, saved prompts, revisions and history.
- contextMenus: user-triggered actions on selected text.
- activeTab: existing extension permission for active-tab actions.
- Site matches: inject the floating assistant into the supported AI sites. The extension reads the composer when the user opens the assistant.
- API hosts: only api.openai.com, api.anthropic.com and generativelanguage.googleapis.com; requests occur when users choose AI.
- Firefox 140+/Android 142+: optional authenticationInfo, websiteContent and personalCommunications consent is required before AI transmission. Grant from the popup; local mode remains available without consent.
- Keys are stored unencrypted in local extension storage and excluded from exports. Prompts/client context can be sent to the selected provider on explicit AI use.

## Reviewer instructions
1. Install the ZIP. Complete onboarding; no login or payment is required.
2. Optimize a prompt locally. Try `write a haiku`: the constrained request is preserved.
3. Open Workflows. Add a client and fill brief, audience and goal. Create a brief and save an optimized result.
4. Open Saved. Create a revision and mark it Useful.
5. Turn history off in Settings. New optimizations must not add history.
6. Open Library, choose a template with variables, fill the fields and use it.
7. Optional: configure your own test provider key. The provider may charge separately. Real API/model availability is account-dependent. In Firefox, grant optional consent on the first popup AI request. The in-page AI button then uses the same configuration.
8. Review the source and TESTING_REPORT.md. Three Firefox HTML-assignment warnings remain: escaped content UI plus React internals.

## Before submitting
- Upload the updated source, lockfile and privacy policy to the repository.
- Run npm ci, npm run compile, npm test and both production builds.
- Verify live provider calls and live supported-site insertion. These are not established by simulated browser tests.
- Prepare current screenshots at store-required dimensions. Existing marketing assets should be reviewed for outdated claims.
- Chrome/Edge package: `.output/promnexa-1.1.1-chrome.zip`.
- Firefox package: `.output/promnexa-1.1.1-firefox.zip`; include `.output/promnexa-1.1.1-sources.zip` for reviewers.
- Complete store privacy declarations accurately; store approval and Firefox signing remain pending.
