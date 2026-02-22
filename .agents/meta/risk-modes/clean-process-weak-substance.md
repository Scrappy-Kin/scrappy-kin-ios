# Risk Mode: clean-process_weak-substance

## Intent
Prevent decision-quality failures where schema/lint/format checks pass but the underlying analysis is weak, contradictory, or non-actionable.

## Trigger Signature
- Structural checks pass (`wo_spec_lint` / `wo_output_lint`) but decision-grade claims remain unsupported.
- Cross-file contracts disagree (for example WO/data dictionary/CSV/QA thresholds or vocabularies).
- Repeated tool attempts produce the same blocker with minimal evidence gain.
- Manual assist requests remain stale after root-cause changes.

## Canonical Example
- Legacy case: `WO-005B` lane B channel calibration.
- Pattern: strong process compliance + explicit `PATCH_REQUIRED`, but significant time spent in retry loops before converging on structural block.

## Detection Checks (Substance Gate)
Run before merge recommendation on gate-driven WOs.

1. Contract Coherence
- Required enums/threshold definitions are consistent across:
  - WO contract
  - Data dictionary / schema docs
  - Output CSV values
  - QA summary claims
- If inconsistent: `patch required`.

2. Claim-Evidence Validity
- Decision-grade conclusions must be backed by decision-grade evidence.
- If all pairs are low confidence or comparability is false, block distribution/gate claims that depend on those pairs.
- If violated: `patch required`.

3. Blocker Freshness
- Root-cause narrative and human-assist requests must reflect latest confirmed blocker state.
- Deprecated recovery paths must be removed after disconfirmation.
- If stale: `patch required`.

4. Evidence Delta
- Each major retry tranche must add net-new facts, not just new tool calls.
- If two consecutive retries produce no material evidence delta, stop and escalate as structural block.

## Enforcement Profile (minimal control-plane)
Goal: catch decision-threatening contradictions without over-constraining nuanced reasoning.

Default hard-fail checks:
- Contract coherence contradictions across WO/schema/data/QA.
- Explicit gate/status/threshold contradictions in a deliverable.

Default warning checks:
- Claim-evidence validity drift.
- Blocker freshness drift.
- Evidence-delta/loop-stall signals.

Promotion rule:
- Promote warning -> hard fail only when the warning can change the decision outcome
  or violates fixed WO assumptions.

## Escalation Contract
Use explicit red flags:
- `RED FLAG: DATA THIN`
- `RED FLAG: ACCESS BLOCKED`
- `RED FLAG: LOOP STALL` (no material evidence delta after repeated attempts)

Each red flag includes:
1. exact blocker,
2. where it occurred,
3. what was tried,
4. human assist request (1-3 actions),
5. what new evidence did or did not change.

## Guardrails
- Do not upgrade confidence tiers to satisfy gates.
- Do not reinterpret threshold basis ad hoc in deliverable prose.
- Do not ship decision-grade output from blocked calibration lanes.
- Preserve useful partial outputs while explicitly sealing blocked lanes as `PATCH_REQUIRED`.

## Telemetry Fields (Mayor)
Track per WO:
- `risk_mode_clean_process_weak_substance`: yes/no
- `contract_drift_detected`: yes/no
- `loop_stall_detected`: yes/no
- `stale_human_assist_detected`: yes/no
- `lane_salvage_applied`: yes/no (for example base lane merged, blocked lane deferred)

## Design Note
This risk mode is a regression test case for meta improvements. It should be re-run against new orchestration rules to confirm the system halts weak-substance outputs even when formatting checks pass.
