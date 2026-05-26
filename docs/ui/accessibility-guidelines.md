# Accessibility Guidelines

Purpose: keep accessibility QA close to the app code while avoiding launch-time
guesswork. These rules are public-safe and repo-local; private release authority
and workstation policy live outside this repo.

## Default QA Protocol

Use the cheapest surface that can answer the accessibility question, then confirm
the launch-critical flows on a real device.

1. Web harness: fastest loop for copy, layout, focus-order intent, and obvious
   ARIA/semantic regressions in app-owned UI.
2. Simulator XCTest accessibility audit: default agent-driven native audit
   surface. Use this for repeatable checks of labels, traits, hit regions,
   contrast, and other XCTest-supported accessibility issues before asking for
   physical-device review.
3. Physical-device VoiceOver: launch truth for what VoiceOver highlights, reads,
   and announces while moving through the shipping app.

Accessibility Inspector GUI is useful for human debugging, but it is not part of
the default QA ladder right now. Prefer XCTest audits for agent-repeatable checks
and physical-device VoiceOver for final signoff.

## Implementation Rules

- Interactive controls need clear accessible names that match the user's task.
- Hints should explain non-obvious outcomes, not repeat the visible label.
- Group decorative or repeated visual details away from the accessibility tree.
- Preserve the prepared-batch send flow as a simple, understandable sequence.
- Do not rely on color alone for status, warnings, or progress.
- Keep QA-only badges, diagnostics, and sink-recipient messaging out of release
  signoff unless the lane explicitly allows them.

## Handoff Checklist

Before calling a launch-critical flow ready:

- Web harness pass covers the changed surfaces.
- Simulator accessibility audit has either passed or has documented acceptable
  exceptions.
- Physical-device VoiceOver pass covers onboarding, subscription, Gmail consent,
  prepared-batch review, send confirmation, settings, and support/legal links.
- Any VoiceOver wording issue is fixed in app code or explicitly deferred in the
  launch backlog.
