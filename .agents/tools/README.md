# Shared WO Tools

Auto-synced orchestration tools for mayor/contractor lanes.

## Included
- `wo_spec_lint.py` — Lint WO specs against `WO-Full`/`WO-Lite`.
- `wo_output_lint.py` — Lint deliverable footer/status/consistency coherence.
- `wo_loop.sh` — Run preflight/review and emit patch packets when output lint fails.
- `wo_autopilot.sh` — Run WO loop + routine auto-fix passes via Codex/Claude CLI, escalate only at intervention gates.

## Quick Usage
```bash
# Spec-only preflight
.agents/tools/wo_loop.sh --wo work-orders/WO-006-driver-and-seasonality-modeling.md --profile full --strict-spec

# Spec + output lint
.agents/tools/wo_loop.sh \
  --wo work-orders/WO-006-driver-and-seasonality-modeling.md \
  --deliverable deliverables/WO-006-driver-and-seasonality-modeling.md \
  --profile full \
  --gate-driven yes

# Routine auto-fix loop (Codex primary, Claude fallback)
.agents/tools/wo_autopilot.sh \
  --wo work-orders/WO-006-driver-and-seasonality-modeling.md \
  --deliverable deliverables/WO-006-driver-and-seasonality-modeling.md \
  --profile full \
  --gate-driven yes \
  --engine codex \
  --fallback-engine claude \
  --codex-model gpt-5.3-codex \
  --codex-effort medium \
  --max-passes 2
```

Notes:
- Closed-loop default: mayor runs routine repair loops directly; overseer is paged only for intervention-gate decisions.
- `wo_autopilot.sh` defaults to `--engine codex --fallback-engine claude`.
- Codex defaults: `--codex-model gpt-5.3-codex --codex-effort medium`.
- For small deterministic cleanup loops, use `--codex-effort low`.
- For harder reconciliation or ambiguity cleanup, use `--codex-effort high` (or `xhigh` sparingly).
- Use `--claude-model` / `--claude-effort` only when you need explicit fallback tuning.
- Escalation docs include a compact intervention packet (decision needed, recommendation, impact, fast resume command).
