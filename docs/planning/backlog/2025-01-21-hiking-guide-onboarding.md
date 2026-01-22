Purpose: define the “hiking guide” onboarding flow update (trust by evidence, just‑in‑time depth) and the minimal UI additions needed to support it.

TL;DR
- Collapse trust content into a single welcome screen with inline expandables.
- Surface inspectable artifacts and a “single broker test” earlier to reduce trust load.
- Add lightweight back + progress affordance that avoids heavy headers.

Scope & relationship
- Applies to Phase A onboarding flow and screen composition.
- Uses existing primitives/patterns where possible (`InlineTrustClaim`, `ReadMoreSheetLink`, `InspectableArtifact`).
- Updates Phase 4 in `docs/planning/active/2025-01-15-ui-design-system.md`.

Key principles / constraints
- Hiking guide, not museum tour: depth is optional and on‑demand.
- Trust via evidence first, explanation second.
- Avoid heavy navigation bars; keep back + progress subtle and in-flow (per HIG).
- No founder intro in v1 onboarding.

Plan (ordered)
1) Welcome + trust consolidation (low effort, high impact)
   - One screen: value prop + inline expandables for “methodology” + “privacy stance.”
   - Use `InlineTrustClaim` for each expandable section.

2) Progress + “why/what” in situ (medium effort, high impact)
   - Replace “How it works” list with a small progress indicator plus inline “why/what.”
   - Optional deeper context via `ReadMoreSheetLink`.
   - Consider a new UI element if `AppProgress` is not sufficient:
     - Candidate: `AppStepIndicator` (primitive) or `StepProgressRow` (pattern).

3) Inspectable artifact early (medium effort, high impact)
   - Show the email template preview before Gmail auth.
   - Keep the artifact visible in-flow; avoid full-screen transitions.

4) Back + progress affordance (low effort, medium impact)
   - Add a subtle back control and step count (no heavy header).
   - If needed, define a small pattern for this (likely `Pattern` not `Primitive`).

5) Replace “Success” with “test the waters” prompt (medium effort, high impact)
   - Copy: “Great — you’re ready to start emailing brokers. Test the waters with a single email.”
   - Leads directly into the single-broker test path.

6) Single broker test + threat/reach metrics (higher effort, high value)
   - Show two metrics per broker (placeholder now):
     - 🔍 Search visibility: 78/100
     - 📄 Indexed pages: ~124,000
   - Frame: “start with the highest threat” to build momentum.

7) Post‑send transparency log (medium effort, medium impact)
   - Show audit details: what was sent, when, how stored (or not stored).

Dependencies / related docs
- `docs/ui/ui-patterns.md` (trust patterns)
- `docs/ui/ui-primitives.md` (candidate new element if needed)
- `docs/library/onboarding-best-practices.md`
- `docs/library/hig/navigation-bars.md`
- `docs/library/hig/toolbars.md`
- `docs/library/hig/sheets.md`
- `docs/strategy/privacy-openess-security.md`
