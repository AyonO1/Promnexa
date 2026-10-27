# Promnexa 1.1.1 — Improve directly in chat

- Click **Improve prompt** to update the current AI chat draft in place with the local optimizer. No intermediate preview is required and no message is submitted.
- Review the new draft and press the AI site's Send button yourself.
- **Undo** restores the exact original draft, including whitespace. It never overwrites subsequent edits, a replacement editor or a different conversation.
- Alt+Shift+P and keyboard activation of the button use the same direct flow.
- **Options** keeps the preview, modes, copy action and explicit configured-AI request. Preview insertion also provides Undo and refuses to overwrite a changed draft.
- Empty, disabled, read-only or missing composers are handled without sending or modifying unrelated fields. Already-improved drafts are not repeatedly expanded.

Reload Promnexa in the extension manager, then refresh any open AI chat tabs. Browser smoke tests use simulated plain and rich-text editors; live site compatibility still needs verification. No automatic sending or new paid feature is included.

GitHub delivery: CI has read-only repository access and uploads build artifacts; releases are prepared manually under the creator account.

Credential-shaped examples in imported datasets are redacted before redistribution.
