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

Preview build for stable local review:

```bash
cd app
npm run preview:dev
```

This serves the dev-lane build on `http://localhost:4173`, so `/ui-harness/*` and `/capture/*` work there too.

Open:
- `http://localhost:5173/ui-harness`
- `http://localhost:5173/ui-harness/screenshots`
- `http://localhost:5173/ui-harness/review-board`
- `http://localhost:5173/ui-harness/tokens` (Tokens)
- `http://localhost:5173/ui-harness/primitives`
- `http://localhost:5173/ui-harness/patterns`
- `http://localhost:4173/ui-harness/screenshots` after `npm run preview:dev`
- `http://localhost:4173/ui-harness/review-board` after `npm run preview:dev`

Rules:
- Use the browser review board first for everyday UI review.
- Use the screenshot gallery for side-by-side comparison, not live editing.
- Keep the harness surface thin and reuse production screens rather than inventing a parallel review app.
- Update the harness recipe first for user-facing composition changes.
- Primitive screenshots alone are not enough for screen-level changes.
- Simulator-native capture is QA-only and should stay secondary.
- The simulator capture script writes to ignored local review-artifact paths under `app/dist/review-artifacts/`.
- The simulator capture route is QA-armed and uses an app-specific review scheme, not the Gmail OAuth redirect scheme.

Static review screenshots live under ignored local `app/public/review-artifacts/` output.

Simulator QA only:

```bash
cd app
npm run capture:screens:simulator
```
