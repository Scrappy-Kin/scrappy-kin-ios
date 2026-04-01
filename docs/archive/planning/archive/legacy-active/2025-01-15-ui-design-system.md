Macro UI Design System implementation Plan + agent prompt (with pause points)


A) Macro plan doc

# UI System Build Plan (Macro)

Goal: a beautiful-by-default iOS-first trust UI that can iterate rapidly.
Approach: tokens + App* primitives + trust patterns + harness-first workflow.  [oai_citation:24‡SKILL.md](sediment://file_00000000448471f5a77eace1d2471dd3)

## Phase 0 — Guardrails (PR-0)
Deliverables:
- `docs/ui/ui-system.md` committed
- `docs/ui/ui-tokens.md` committed
- `docs/ui/ui-primitives.md` committed
- `docs/ui/ui-patterns.md` committed
- Screens import policy: screens may only import from `ui/primitives` and `ui/patterns`
- Simple CI guardrail (good-enough):
  - forbid `#` and `font-family` outside `src/theme/`
  - forbid `px` outside `src/theme/` and primitive stylesheets

Pause point (loop Jon):
- only if guardrail blocks legitimate Ionic usage; propose exception list.

## Phase 1 — Tokens + Type + Harness shell (PR-1)
Deliverables:
- `src/theme/tokens.css`
- `src/theme/typography.css`
- `src/theme/utilities.css`
- `src/ui/harness/` route with:
  - Tokens page (raw utilities + token previews)
  - Primitives page (App* variants/states)
  - Patterns page (trust blocks)

Evidence required:
- simulator screenshots of harness pages

Pause point (loop Jon):
- after harness pages render: Jon adjusts token values (taste call)

## Phase 2 — Core primitives (PR-2 to PR-5, one at a time)
Order (dependency-first):
1) AppText + AppHeading
2) AppButton
3) AppSurface + AppCard
4) AppList + AppListRow
5) AppInput + AppTextarea
6) AppToggle
7) AppNotice
8) AppDisclosure
9) AppSheet
10) AppProgress
11) AppToast
12) AppIcon

Rules:
- each primitive ships with a harness demo showing all variants/states
- no screens yet

Pause points (loop Jon):
- after each primitive harness demo is ready, for taste approval

## Phase 3 — Trust patterns (PR-6 to PR-8)
Implement patterns:
- InlineTrustClaim
- ReadMoreSheetLink
- InspectableArtifact

Rules:
- patterns must follow Progressive, On-Demand Depth guidance:
  - inline expandable as default
  - sheets for deeper reading
  - artifacts first, explanation second  [oai_citation:25‡Progressive, On-Demand Depth -- UI Best Practices.md](sediment://file_000000005fdc71f5bce99d4d9a9efb09)

Pause point (loop Jon):
- after each pattern harness demo is ready

## Phase 4 — Screen composition (Phase A) (PR-9+)
Implement Phase A screens using only primitives + patterns.
Flow guidance lives in:
- `docs/planning/backlog/2025-01-21-hiking-guide-onboarding.md`

Phase A screen set (updated):
- Welcome + trust expandables (methodology + privacy stance)
- Progress + “why/what” in situ (no standalone “How it works” screen)
- Early inspectable email artifact (before Gmail auth)
- Gmail connect + auth
- Broker list with threat/reach placeholders (single-broker test path)
- “Test the waters” step (replaces “Success”)
- Send flow + post‑send transparency log

Rules:
- if a screen needs new UI behavior:
  - add/extend a primitive or pattern first
  - update harness
  - then apply to screens
 - avoid heavy headers; use subtle back + progress affordance if needed (HIG‑aligned)

Pause point (loop Jon):
- only when a new primitive/pattern is proposed or a pattern needs UX changes

## Done criteria (system readiness)
- Harness covers tokens, every primitive state, and every trust pattern
- Phase A screens are composed-only
- No raw styling values introduced in screens
- PR summaries <10 lines and include screenshots  [oai_citation:26‡SKILL.md](sediment://file_00000000448471f5a77eace1d2471dd3)
