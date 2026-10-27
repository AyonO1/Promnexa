# Free/BYOK launch plan

Decision: launch free with user-supplied provider keys. Validate demand before adding billing.

1. Submit the Chrome build and Firefox build with accurate optional-AI and local-storage disclosures. Supply reviewer instructions, screenshots, the privacy policy URL, and reproducible source. Verify live provider access and site integrations before submitting.
2. Recruit 10–15 freelancers or small agencies. Observe their existing proposal, advertising and client-response workflows using their own examples and consent.
3. Offer assisted setup of client profiles and three reusable workflows. Validate whether users return weekly and whether at least three would pay for a specific recurring benefit.
4. Compare original and rewritten prompts on the same model using a small consented benchmark. Measure constraint compliance, intent preservation, editing effort and acceptance. Do not equate prompt length with quality.
5. Test a paid setup service before committing to a subscription backend. Suggested experiments: $50–150 setup; later $7–12/month solo or $29–49/month small agency. These are hypotheses, not demand or revenue forecasts.
6. If demand is established, choose a merchant provider supported in the owner's country and implement hosted checkout, verified webhooks, server-side entitlements, refunds and cancellation. Never embed merchant/provider secrets in the extension or trust a local `isPro` switch.

Browser-store installation does not itself produce revenue. Chrome's native Web Store payments have been discontinued; an external billing service is needed for paid features. Firefox also permits monetization subject to its add-on policies. Account setup, payment eligibility, billing configuration, store submission and publishing remain owner tasks.

Sources checked October 28, 2026:
- https://developer.chrome.com/docs/webstore/cws-payments-deprecation
- https://extensionworkshop.com/documentation/publish/make-money-from-browser-extensions/
- https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
