# Accessibility patterns

Repo-local notes for implementation patterns that repeatedly show up in launch QA.
HQ remains the product canon for accessibility decisions.

## Compact action controls

- When a compact button, row, or radio option visually has a title plus supporting text, provide one explicit spoken label with a sentence break between the title/action and the supporting text.
- Prefer action-first labels for inactive choices, for example `Choose quiet. Up to 3 emails at a time.`
- For radio choices, distinguish focus speech from activation speech. Keep the option name available when the user lands on the control, but do not promise a custom post-tap phrase. On physical iOS VoiceOver, activation may only announce the system state change, such as `checked`.

## Settings save returns

- Settings-originated saves should return to Settings home with a short saved notice when the edit is complete.
- Task-required edits may continue to the task route when the user must get back to review or send readiness.
- Same-screen saved notices should use the shared action-notice pattern. Avoid duplicate live announcements when the focused control already changes to the completed state.
