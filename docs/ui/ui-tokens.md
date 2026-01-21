# UI Tokens — Palette and Utilities

Purpose: define the token vocabulary and the raw utilities that expose it.

TL;DR
- Tokens are values only. Utilities are descriptive only.
- No role tokens (`--surface-*`, `--text-*`).
- Primitives map intent to utilities.

## Scope and relationship
- System hierarchy lives in `docs/ui/ui-system.md`.
- Primitive catalog lives in `docs/ui/ui-primitives.md`.
- Pattern catalog lives in `docs/ui/ui-patterns.md`.

## Token MVP set (current)

Color:
- `--primary` (plus `-rgb`, `-contrast`, `-shade`, `-tint`)
- `--secondary`
- `--danger` (plus `-rgb`, `-contrast`, `-shade`, `-tint`)
- `--neutral-0`, `--neutral-50`
- `--neutral-700`, `--neutral-900`
- `--neutral-900-12`, `--neutral-900-20`
- `--shadow-1`

Spacing:
- `--space-1` through `--space-10`

Shape:
- `--radius-1`, `--radius-2`, `--radius-round`

## Utilities (raw)

Typography:
- Size: `t-3xl`, `t-2xl`, `t-xl`, `t-lg`, `t-md`, `t-base`, `t-sm`, `t-xs`
- Line-height: `lh-3xl`, `lh-2xl`, `lh-xl`, `lh-lg`, `lh-md`, `lh-sm`, `lh-xs`
- Weight: `w-400`, `w-500`, `w-600`
- Letter spacing: `ls-tight`, `ls-wide`
- Transform: `uc`

Color:
- Text: `text-primary`, `text-secondary`, `text-danger`
- Background: `bg-neutral-0`, `bg-neutral-50`
- Border: `border-neutral-900-12`, `border-neutral-900-20`

## Usage rules
- Utilities are descriptive only; do not encode intent in class names.
- Screens do not use utilities directly; primitives own intent.
- No raw values in screens (no hex colors, no ad hoc px).
- Add the token first, then use it.

## Success tests
- Tokens are values only; no role naming.
- Utilities map 1:1 to tokens or typography scale.
