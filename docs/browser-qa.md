# Browser QA

## Purpose
Keep web-harness QA from confusing app failures with browser-runtime failures.

## Default Lane
Use the web harness plus the repo screenshot command for visual review.

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

Then run focused screenshot capture:

```bash
cd app
npm run capture:screens:manual -- --id flow-intro
```

Good first routes for interactive browser inspection:

- `http://localhost:4173/ui-harness/review-board`
- `http://localhost:4173/ui-harness/screenshots`
- `http://localhost:4173/capture/flow-intro?qa=1`

## Agent Visual QA
### App Store Review Request

Start `npm run preview:dev`, then open:

- `/capture/review-prompt-post-send?qa=1`: Next, then Later. On Home, leave
  the page idle for two seconds. A **Browser preview: review request** QA notice
  appears below the dashboard content. It is not Apple's sheet.
- The same route, but choose Subscribe: the mock purchase returns to Home with
  **no** review notice. Purchase/restore attempts discard the opportunity even
  if unsuccessful; a later fresh full send can qualify.
- `/capture/review-prompt-ready?qa=1`: direct eligible dashboard preview.
- `/capture/review-prompt-ready-subscribed?qa=1`: a fresh full round for an
  already-subscribed user is equally eligible; payment is not the trigger.
- `/capture/review-prompt-new-version?qa=1`: a stored attempt for `1.0.0`
  remains eligible in the simulated `1.1.0` marketing version.
- `/capture/review-prompt-partial?qa=1`,
  `/capture/review-prompt-after-purchase?qa=1`, and
  `/capture/review-prompt-already-attempted?qa=1`: no notice.

These capture routes reset browser-local QA data. They seed a fresh in-memory
send outcome without sending email. Reloading Home must not repeat the notice;
reopening a capture URL intentionally resets the test. Ordinary interaction
does not add timer machinery or burn eligibility.

`npm run test:launch-harness` covers the eligible journey, a mock purchase,
suppressed fixtures, ordinary interaction, version eligibility, and reload behavior.

Implementation policy approved in the operator conversation: the first eligible
full send creates a session-only opportunity. Navigation away from the post-send
journey, backgrounding, a browser/QA sheet, or a purchase/restore/manage attempt
discards it. One local value records the last marketing version for which the app
attempted a request; clearing all app data clears that value. A new marketing
version can request again after a new qualifying send. No rating, identity,
review-shown event, timestamp, attempt count, or server record is collected.

Native validation is separate: use a development-signed simulator/device build
to verify Apple's presentation and no sheet stacking, then physical-device
VoiceOver for dashboard announcement timing. Two seconds is an idle allowance,
not evidence that VoiceOver has finished. Apple may suppress requests in release
builds and does not show this sheet in TestFlight
([Apple documentation](https://developer.apple.com/documentation/storekit/appstore/requestreview%28in%3A%29-1q8qs)).

### Browser Sidecar
For command-level regression checks, repo scripts may connect to a loopback
Chrome DevTools endpoint when one is already running:

```bash
CAPTURE_CDP_ENDPOINT=http://127.0.0.1:9222 npm run capture:screens:manual -- --id flow-intro
CAPTURE_CDP_ENDPOINT=http://127.0.0.1:9222 npm run test:launch-harness
```

On the Agentic-Work-VM, product-ops owns the private launchd sidecar that
provides this endpoint. `capture:screens:manual`, `qa:web-preflight`, and
`test:launch-harness` auto-detect that sidecar unless `CAPTURE_CDP_AUTODETECT=0`
is set. This repo only depends on the public-safe CDP endpoint contract.

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

To also check the selected browser runtime, run:
On the Agentic-Work-VM this attaches to the sidecar instead of launching Chrome
from the Codex shell:

```bash
cd app
npm run qa:web-preflight
```

If browser launch fails from a sandboxed shell, start the VM browser sidecar, set
`CAPTURE_CDP_ENDPOINT`, or run `npm run capture:screens:manual` from a normal
Terminal outside that sandbox.

## Screenshot Capture
The first-class agent path is the repo screenshot command.

Manual/local capture remains available when the browser runtime is available
from a normal Terminal, CI, another unsandboxed runner, or the VM browser
sidecar:

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
CAPTURE_CDP_ENDPOINT=http://127.0.0.1:9222 npm run capture:screens:manual -- --id flow-intro
CAPTURE_CDP_ENDPOINT=http://127.0.0.1:9222 npm run test:launch-harness
```
