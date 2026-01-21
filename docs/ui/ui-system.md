# UI System — Ownership and Hierarchy

Purpose: define who owns what in the UI stack so screens stay consistent and boring.

TL;DR
- Tokens define values. Utilities expose values. Primitives own intent. Patterns compose primitives.
- The harness is production UI shown in isolation (no harness-only styles).
- Screens never import `Ion*`; they compose `App*` only.

## Scope and relationship
- This doc defines the hierarchy and non-negotiables.
- Token details live in `docs/ui/ui-tokens.md`.
- Primitive catalog lives in `docs/ui/ui-primitives.md`.
- Pattern catalog lives in `docs/ui/ui-patterns.md`.

## Hierarchy (source of truth)
1) **Tokens** (`src/theme/tokens.css`)
   - Named values only (color, space, radius, shadow).
2) **Utilities** (`src/theme/typography.css`, `src/theme/utilities.css`)
   - Descriptive classes only (size/weight/text/bg/border).
3) **Primitives** (`src/ui/primitives/`)
   - Own intent. Map intent -> utilities.
4) **Patterns** (`src/ui/patterns/`)
   - Compose primitives into trust UX blocks.
5) **Screens** (`src/screens/`)
   - Composition only. No new styling.

## Non-negotiables
1) **Harness before opinion**
2) **Harness equals production**
   - No harness-only classes or one-off styles.
3) **Primitives own intent**
   - Utilities are descriptive only.
4) **Screens never touch `Ion*`**
   - Screens use `App*` primitives only.
5) **No raw values in screens**
   - No hex colors, no ad hoc px.
6) **Cards are optional, not default**
   - Use cards for distinct objects, summaries, or previews only.

## Execution loop (for any UI work)
1) Clarify target in 1–2 sentences.
2) Update harness first (visible evidence).
3) Iterate in small batches; delete temporary work.
4) Capture screenshots when asking for review.

## Review evidence required
- Harness route and screenshot(s) for the change.
- A short (<10 lines) change summary with why.

## Pause points
- Token value changes (taste calls).
- New primitives or patterns.
- Harness looks off and fix is unclear.

## Harness structure
- `/ui-harness/tokens` — tokens + utilities
- `/ui-harness/primitives` — App* variants and states
- `/ui-harness/patterns` — trust patterns

## Known gotchas (keep us honest)
- CSS import order matters: load Ionic CSS first, then tokens/utilities/theme.
- Use palette tokens + property utilities (no role tokens like `--surface-*`).
- Prefer global intent mapping over scoped overrides; change intent once, not per component.

## Success tests
- A new agent can name the correct layer in <30 seconds.
- Harness pages mirror the hierarchy without one-off styling.
