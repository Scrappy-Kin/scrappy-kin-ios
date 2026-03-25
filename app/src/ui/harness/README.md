# UI Harness

Purpose: review the browser-first review board, tokens, active primitives, patterns, and screen-composition recipes before product screens.

Run locally:

```bash
cd app
npm install
npm run dev
```

Primary browser review board:

http://localhost:5173/ui-harness/review-board

Open:
- `http://localhost:5173/ui-harness`
- `http://localhost:5173/ui-harness/review-board`
- `http://localhost:5173/ui-harness/tokens` (Tokens)
- `http://localhost:5173/ui-harness/primitives`
- `http://localhost:5173/ui-harness/patterns`

Rules:
- Use the browser review board first for everyday UI review.
- Keep the harness surface thin and reuse production screens rather than inventing a parallel review app.
- Update the harness recipe first for user-facing composition changes.
- Primitive screenshots alone are not enough for screen-level changes.
- Simulator-native capture is QA-only and should stay secondary.
- The simulator capture script writes to ignored local review-artifact paths under `app/dist/review-artifacts/`.
- The simulator capture route is QA-armed and uses an app-specific review scheme, not the Gmail OAuth redirect scheme.

Screenshots live in ignored local review-artifact paths unless they are explicit hand-curated examples.

Simulator QA only:

```bash
cd app
npm run capture:screens:simulator
```
