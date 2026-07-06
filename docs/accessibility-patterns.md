# Accessibility patterns

Repo-local notes for implementation patterns that repeatedly show up in launch QA.
HQ remains the product canon for accessibility decisions.

## Compact action controls

- When a compact button, row, or radio option visually has a title plus supporting text, provide one explicit spoken label with a sentence break between the title/action and the supporting text.
- Prefer action-first labels for inactive choices, for example `Choose quiet. Up to 3 emails at a time.`
- For radio choices, distinguish focus speech from activation speech. Keep the option name available when the user lands on the control, but do not promise a custom post-tap phrase. On physical iOS VoiceOver, activation may only announce the system state change, such as `checked`.
- For compact card bullets with icons or short status items, use `AppBulletRow` instead of raw `ul` / `li`. Physical iOS VoiceOver can announce raw list markers as `bullet`; `AppBulletRow` exposes one clean spoken label per item. Keep raw semantic lists for longer prose where list semantics are worth the extra marker speech.

## Copy contracts

- When visible copy and VoiceOver copy intentionally differ, keep them in one typed copy object instead of writing separate strings at the call site.
- For normal interactive rows, make the visible title action-first and let `AppListRow` derive the spoken label from `title + ". " + description`.
- Add a small unit test for launch-critical copy objects when a row/card has already drifted once. The test should prove the visible copy remains action-first and non-empty, not duplicate stale spoken labels.
- Keep an intentional escape hatch for cases where the generated label is worse than a custom one. The override must live in the same copy object and include a short reason, so tests can allow it without becoming noisy.
- Use direct `accessibilityLabel` strings only for primitive/system-boundary cases where the visible text is structurally unsuitable, such as price formatting, browser/email actions, or route-entry headings.

## Route-entry focus

- On route entry, focus the screen's primary orientation target: usually the H1, or the main status/metric when that is the page's visible identity.
- Keep secondary navigation controls, such as Settings, in their normal visual and accessibility order. Do not hide them, duplicate them, or move them to a VoiceOver-only location.
- If a secondary top-nav action comes before the H1 in source order, the screen should still use the shared route-focus hook so the opening announcement matches the page's main purpose.
- If the primary target depends on async state, trigger route focus after that content is stable; an early focus call can be lost when the screen re-renders.

## External links and native browser modals

- Rows that open an external surface should use one action-first accessible name, for example `Open Help`, instead of a visible title plus a hidden hint like `Opens web page`.
- Email action labels should avoid prepending a role noun that duplicates the address text. Prefer `Contact support@example.com for help` over `Email support at support@example.com`.
- While a native in-app browser is open, hide and inert the app WebView so VoiceOver cannot keep interacting with the visually hidden app page behind the modal.

## Settings save returns

- Settings-originated saves should return to Settings home with a short saved notice when the edit is complete.
- Task-required edits may continue to the task route when the user must get back to review or send readiness.
- Settings status/action pages, such as Gmail connection, should stay on the child page after connect/disconnect. Use the status card as the visible source of truth, a short VoiceOver-only success message when needed, and H1 focus after completion.
- Same-screen saved notices should use the shared action-notice pattern. Avoid duplicate live announcements when the focused control already changes to the completed state.
