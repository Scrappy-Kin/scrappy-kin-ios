# Browser QA

## Purpose
Keep web-harness QA from confusing app failures with browser-runtime failures.

## Default Lane
Use the web harness plus the agent browser/MCP tool surface for visual review.

Start the preview server:

```bash
cd app
npm run preview:dev
```

Then run the HTTP preflight:

```bash
cd app
npm run qa:agent-browser
```

Then use the Codex Playwright MCP/browser tool to open and screenshot the
target route. Good first routes:

- `http://localhost:4173/ui-harness/review-board`
- `http://localhost:4173/ui-harness/screenshots`
- `http://localhost:4173/capture/flow-intro?qa=1`

## Agent Visual QA
For agent-driven visual QA in Codex, prefer the Playwright MCP/browser tool
surface when it is available. It can navigate localhost routes and capture
screenshots without launching a new Playwright browser from the sandboxed shell.

For command-level regression checks, repo scripts may connect to a loopback
Chrome DevTools endpoint when one is already running:

```bash
CAPTURE_CDP_ENDPOINT=http://127.0.0.1:9222 npm run test:launch-harness
```

On the Agentic-Work-VM, product-ops owns the private launchd sidecar that
provides this endpoint. This repo only depends on the public-safe CDP endpoint
contract.

The repo capture script remains useful, but on macOS it may fail when run from
some sandboxed agent shells. Known failure signatures include:

- `MachPortRendezvousServer`
- `bootstrap_check_in ... Permission denied (1100)`
- `SIGABRT`
- `Abort trap`

Treat those as browser-runtime failures, not app-code failures.

Do not make repo-local browser caches the default workaround for Codex agents.
The failure is the macOS browser launch context, not where the browser binary is
stored.

## Preflight
With the preview server running, check the harness routes:

```bash
cd app
npm run qa:agent-browser
```

To also check the selected Playwright browser launch:

```bash
cd app
npm run qa:web-preflight
```

If browser launch fails from a sandboxed shell, use the Codex Playwright
MCP/browser lane for visual review or run `npm run capture:screens:manual` from
a normal Terminal outside that sandbox.

## Screenshot Capture
The first-class agent path is the Codex Playwright MCP/browser tool.

Manual/local capture remains available when the browser runtime is available
from a normal Terminal, CI, or another unsandboxed runner:

```bash
cd app
npm run capture:screens:manual -- --group onboarding
```

The old `npm run capture:screens` alias is intentionally blocked by default so
agents do not rediscover sandboxed browser-launch failures. If an old automation
cannot be updated immediately, run that specific invocation with
`CAPTURE_SCREENS_LEGACY_OK=1` and then migrate it to `capture:screens:manual`.

Optional controls:

```bash
CAPTURE_BROWSER=firefox npm run capture:screens:manual -- --id flow-intro
CAPTURE_BASE_URL=http://localhost:4173 npm run capture:screens:manual
CAPTURE_CDP_ENDPOINT=http://127.0.0.1:9222 npm run test:launch-harness
```
