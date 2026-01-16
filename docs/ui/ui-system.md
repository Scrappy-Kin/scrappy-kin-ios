# UI System (Scrappy Kin) — Source of Truth in Code

Purpose: define the shared UI language used across harness, primitives, and screens.

This repo uses Ionic React for iOS-first trust UX. We optimize for:
- Consistency over novelty
- Evidence over assurances
- Fast iteration via harness-first development

## Non-negotiables (hard rules)

1) **Harness before opinion**
   - All visual work must be demonstrable in the UI Harness before it lands in screens.  [oai_citation:0‡SKILL.md](sediment://file_00000000448471f5a77eace1d2471dd3)

2) **Observation before iteration**
   - If we can’t clearly see the effect, build a bridge (harness page, screenshot output) before iterating.  [oai_citation:1‡SKILL.md](sediment://file_00000000448471f5a77eace1d2471dd3)

3) **Small batches**
   - Work in micro-chunks (2–5 steps). Long sequences guarantee drift.  [oai_citation:2‡SKILL.md](sediment://file_00000000448471f5a77eace1d2471dd3)

4) **No mess**
   - Temporary scaffolding must be removed before merge.  [oai_citation:3‡SKILL.md](sediment://file_00000000448471f5a77eace1d2471dd3)

5) **Trust-critical UI uses progressive, on-demand depth**
   - Inline disclosures by default; bottom sheets for deeper reading; inspectable artifacts wherever possible.  [oai_citation:4‡Progressive, On-Demand Depth -- UI Best Practices.md](sediment://file_000000005fdc71f5bce99d4d9a9efb09)

## Harness parity
- The harness is production UI shown in isolation.
- No harness-only classes or one-off styles; if it exists in the harness, it must be valid in production.

## Vocabulary

- **Tokens**: named design decisions (color/space/type/radius).
- **Primitives (App*)**: reusable components that wrap Ionic and encode our rules.
- **Patterns**: compositional trust blocks (inline disclosure, inspectable artifact, read-more sheet).
- **Screens**: assemble primitives + patterns only. No styling invention.

## Repo structure

- `src/theme/`
  - `tokens.css` — design tokens (CSS variables)
  - `typography.css` — typography scale + global type rules
- `src/ui/harness/` — UI Harness routes/pages (the review surface)
- `src/ui/primitives/` — App* primitives (wrappers around Ion*)
- `src/ui/patterns/` — trust patterns used across onboarding + settings
- `src/screens/` — actual screens (composition-only)

## Token rules (must follow)

- No raw values in screens:
  - No hex colors (`#...`)
  - No ad hoc `px` spacing
  - No `font-family` declarations
- Components may only use:
  - CSS variables from `tokens.css` via `var(--...)`
  - classes defined inside the primitive/pattern stylesheet
- If a needed token is missing:
  - propose the token name + intent
  - add it in `tokens.css`
  - then use it

### Token MVP set (current)

Color:
- `--app-background`
- `--surface-1`, `--surface-2`
- `--text-1`, `--text-2`
- `--border-1`, `--border-2`
- `--brand-1` (plus `-rgb`, `-contrast`, `-shade`, `-tint`)
- `--shadow-1`

Spacing:
- `--space-1` through `--space-10`

Shape:
- `--radius-1`, `--radius-2`, `--radius-round`

## Typography utilities (MVP)
- `type-hero`: primary hero statement (1 per screen)
- `type-lead`: supporting lead under the hero
- `type-section-heading`: section header within a screen
- `type-body`: default body copy
- `type-body-strong`: emphasized body copy
- `type-caption`: secondary metadata
- `type-caption-tight`: micro labels, uppercase

## Ink usage
- `--text-1`: primary copy and headings
- `--text-2`: secondary copy and supporting labels

## Primitive rules (App* components)

- Screens must not import `Ion*` directly.
- Screens must not add new layout/styling decisions.
- All component states must be captured in the harness:
  - default, disabled, loading, error (where relevant)

### We intentionally do NOT use:
- Full-screen webviews for trust content  [oai_citation:5‡Progressive, On-Demand Depth -- UI Best Practices.md](sediment://file_000000005fdc71f5bce99d4d9a9efb09)
- Tooltips for anything >1 sentence  [oai_citation:6‡Progressive, On-Demand Depth -- UI Best Practices.md](sediment://file_000000005fdc71f5bce99d4d9a9efb09)
- Modals (we use AppSheet + inline disclosures)

## Trust patterns (must follow)

We follow "Progressive, On-Demand Depth":

1) **Inline expandable disclosures** (default)
   - collapsed state must stand alone; expansion adds proof, not meaning  [oai_citation:7‡Progressive, On-Demand Depth -- UI Best Practices.md](sediment://file_000000005fdc71f5bce99d4d9a9efb09)

2) **Bottom sheets for depth**
   - reading only, dismissible, never required to proceed  [oai_citation:8‡Progressive, On-Demand Depth -- UI Best Practices.md](sediment://file_000000005fdc71f5bce99d4d9a9efb09)

3) **Inspectable artifacts**
   - artifact first, explanation secondary; must show exactly what will be used/sent  [oai_citation:9‡Progressive, On-Demand Depth -- UI Best Practices.md](sediment://file_000000005fdc71f5bce99d4d9a9efb09)

4) **Contextual micro-links**
   - text links > icons; opens inline or sheet  [oai_citation:10‡Progressive, On-Demand Depth -- UI Best Practices.md](sediment://file_000000005fdc71f5bce99d4d9a9efb09)

5) **Trust/About hub**
   - library, not prerequisite  [oai_citation:11‡Progressive, On-Demand Depth -- UI Best Practices.md](sediment://file_000000005fdc71f5bce99d4d9a9efb09)

Copy rules:
- Prefer constraints over assurances ("We cannot access X")  [oai_citation:12‡Progressive, On-Demand Depth -- UI Best Practices.md](sediment://file_000000005fdc71f5bce99d4d9a9efb09)
- Plain language first; technical detail on demand  [oai_citation:13‡Progressive, On-Demand Depth -- UI Best Practices.md](sediment://file_000000005fdc71f5bce99d4d9a9efb09)

## The review loop (how work gets merged)

Every UI task must include:
- Context (1–2 lines)
- Action (copy-pasteable)
- Expected result
- What to do if it fails  [oai_citation:14‡SKILL.md](sediment://file_00000000448471f5a77eace1d2471dd3)

### Pause points (when to loop Jon in)

Loop Jon when:
- tokens/typography need value changes (taste calls)
- a new primitive or pattern is proposed
- the harness looks "off" but the fix is unclear

Do NOT loop Jon to validate routine wiring. Founder attention is for judgment calls.  [oai_citation:15‡SKILL.md](sediment://file_00000000448471f5a77eace1d2471dd3)

### Evidence required for review

Because agents can’t see the UI, every PR must include:
- a simulator screenshot of the relevant harness page(s)
- a short (<10 lines) summary of what changed and why  [oai_citation:16‡SKILL.md](sediment://file_00000000448471f5a77eace1d2471dd3)
