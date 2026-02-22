#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  wo_autopilot.sh --wo <path> [--deliverable <path>] [--repo <path>] [--profile full|lite] [--gate-driven auto|yes|no] [--strict-spec] [--engine codex|claude|none] [--fallback-engine codex|claude|none] [--max-passes <n>] [--log-dir <path>] [--codex-model <name>] [--codex-effort low|medium|high|xhigh] [--claude-model <name>] [--claude-effort low|medium|high]

What it does:
  1) Runs wo_loop.sh (spec + output lint flow).
  2) If failures are routine, dispatches a mayor-owned auto-fix pass to Codex or Claude CLI.
  3) Re-runs lint and repeats until success or max passes.
  4) Escalates only for intervention-level blockers or no-progress loops.

Escalation file:
  <log-dir>/<WO-base>-autopilot-escalation-<timestamp>.md
EOF
}

REPO="$(pwd)"
WO_PATH=""
DELIVERABLE_PATH=""
PROFILE="full"
GATE_DRIVEN="auto"
STRICT_SPEC="0"
ENGINE="codex"
FALLBACK_ENGINE="claude"
MAX_PASSES="2"
LOG_DIR_REL="deliverables/reviews"
CODEX_MODEL="gpt-5.3-codex"
CODEX_EFFORT="medium"
CLAUDE_MODEL=""
CLAUDE_EFFORT=""

while (($#)); do
  case "$1" in
    --repo)
      REPO="$2"
      shift 2
      ;;
    --wo)
      WO_PATH="$2"
      shift 2
      ;;
    --deliverable)
      DELIVERABLE_PATH="$2"
      shift 2
      ;;
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --gate-driven)
      GATE_DRIVEN="$2"
      shift 2
      ;;
    --strict-spec)
      STRICT_SPEC="1"
      shift
      ;;
    --engine)
      ENGINE="$2"
      shift 2
      ;;
    --fallback-engine)
      FALLBACK_ENGINE="$2"
      shift 2
      ;;
    --max-passes)
      MAX_PASSES="$2"
      shift 2
      ;;
    --log-dir)
      LOG_DIR_REL="$2"
      shift 2
      ;;
    --codex-model)
      CODEX_MODEL="$2"
      shift 2
      ;;
    --codex-effort)
      CODEX_EFFORT="$2"
      shift 2
      ;;
    --claude-model)
      CLAUDE_MODEL="$2"
      shift 2
      ;;
    --claude-effort)
      CLAUDE_EFFORT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unexpected argument: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$WO_PATH" ]]; then
  echo "ERROR: --wo is required"
  usage
  exit 1
fi

if [[ "$PROFILE" != "full" && "$PROFILE" != "lite" ]]; then
  echo "ERROR: invalid --profile value: $PROFILE"
  exit 1
fi

if [[ "$GATE_DRIVEN" != "auto" && "$GATE_DRIVEN" != "yes" && "$GATE_DRIVEN" != "no" ]]; then
  echo "ERROR: invalid --gate-driven value: $GATE_DRIVEN"
  exit 1
fi

if [[ "$ENGINE" != "codex" && "$ENGINE" != "claude" && "$ENGINE" != "none" ]]; then
  echo "ERROR: invalid --engine value: $ENGINE (expected codex|claude|none)"
  exit 1
fi

if [[ "$FALLBACK_ENGINE" != "codex" && "$FALLBACK_ENGINE" != "claude" && "$FALLBACK_ENGINE" != "none" ]]; then
  echo "ERROR: invalid --fallback-engine value: $FALLBACK_ENGINE (expected codex|claude|none)"
  exit 1
fi

if [[ "$ENGINE" != "none" && "$FALLBACK_ENGINE" == "$ENGINE" ]]; then
  echo "ERROR: --fallback-engine must differ from --engine when both are enabled"
  exit 1
fi

if [[ "$ENGINE" == "none" && "$FALLBACK_ENGINE" != "none" ]]; then
  echo "ERROR: --fallback-engine cannot be set when --engine is none"
  exit 1
fi

if [[ "$CODEX_EFFORT" != "low" && "$CODEX_EFFORT" != "medium" && "$CODEX_EFFORT" != "high" && "$CODEX_EFFORT" != "xhigh" ]]; then
  echo "ERROR: invalid --codex-effort value: $CODEX_EFFORT (expected low|medium|high|xhigh)"
  exit 1
fi

if [[ -n "$CLAUDE_EFFORT" && "$CLAUDE_EFFORT" != "low" && "$CLAUDE_EFFORT" != "medium" && "$CLAUDE_EFFORT" != "high" ]]; then
  echo "ERROR: invalid --claude-effort value: $CLAUDE_EFFORT (expected low|medium|high)"
  exit 1
fi

if ! [[ "$MAX_PASSES" =~ ^[0-9]+$ ]]; then
  echo "ERROR: --max-passes must be a non-negative integer"
  exit 1
fi

TOOLS_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$REPO" && pwd)"

abs_path() {
  local path="$1"
  if [[ "$path" = /* ]]; then
    echo "$path"
  else
    echo "$REPO/$path"
  fi
}

WO_ABS="$(abs_path "$WO_PATH")"
if [[ ! -f "$WO_ABS" ]]; then
  echo "ERROR: WO file not found: $WO_ABS"
  exit 1
fi

LOG_DIR_ABS="$(abs_path "$LOG_DIR_REL")"
mkdir -p "$LOG_DIR_ABS"

WO_BASE="$(basename "$WO_ABS" .md)"
TS="$(date +%Y%m%d-%H%M%S)"
SESSION_LOG="$LOG_DIR_ABS/${WO_BASE}-autopilot-${TS}.log"
ESCALATION_FILE="$LOG_DIR_ABS/${WO_BASE}-autopilot-escalation-${TS}.md"

run_loop_once() {
  local output_file="$1"
  local status=0
  local -a cmd=("$TOOLS_DIR/wo_loop.sh" --repo "$REPO" --wo "$WO_PATH" --profile "$PROFILE" --gate-driven "$GATE_DRIVEN")
  if [[ -n "$DELIVERABLE_PATH" ]]; then
    cmd+=(--deliverable "$DELIVERABLE_PATH")
  fi
  if [[ "$STRICT_SPEC" == "1" ]]; then
    cmd+=(--strict-spec)
  fi

  set +e
  "${cmd[@]}" >"$output_file" 2>&1
  status=$?
  set -e
  return "$status"
}

is_leverage_failure() {
  local output_file="$1"
  local -a leverage_patterns=(
    'RED FLAG:'
    'missing section: assignment'
    'missing section: objective'
    'missing section: decision_gate'
    'missing section: fixed_scope'
    'missing section: stop_conditions'
    'missing section: success_criteria'
    'ambiguous threshold phrasing'
    'FOUNDATION MISSING'
    'DATA THIN'
    'ACCESS BLOCKED'
  )
  local pattern
  for pattern in "${leverage_patterns[@]}"; do
    if grep -qiE "$pattern" "$output_file"; then
      return 0
    fi
  done
  return 1
}

intervention_decision_needed() {
  local reason="$1"
  case "$reason" in
    leverage-trigger)
      echo "Scope/policy/threshold decision is required before routine loop can continue."
      ;;
    no-progress-after-agent-pass|max-passes-exceeded)
      echo "Choose next path: re-scope WO, change engine/effort, or approve targeted human assist."
      ;;
    agent-cli-error)
      echo "Choose execution path: restore agent CLI runtime or route through manual patch packet."
      ;;
    *)
      echo "Confirm unblock decision for mayor closed-loop continuity."
      ;;
  esac
}

intervention_recommended_action() {
  local reason="$1"
  case "$reason" in
    leverage-trigger)
      echo "Lock decision-gate/scope policy, then rerun autopilot."
      ;;
    no-progress-after-agent-pass|max-passes-exceeded)
      echo "Issue one narrowed patch objective and rerun with same contractor context."
      ;;
    agent-cli-error)
      echo "Switch engine or run one manual patch pass, then resume autopilot."
      ;;
    *)
      echo "Apply smallest unblock and resume mayor loop."
      ;;
  esac
}

build_resume_command() {
  local cmd
  cmd=".agents/tools/wo_autopilot.sh --wo \"$WO_PATH\" --profile \"$PROFILE\" --gate-driven \"$GATE_DRIVEN\" --engine \"$ENGINE\" --fallback-engine \"$FALLBACK_ENGINE\" --max-passes \"$MAX_PASSES\" --codex-model \"$CODEX_MODEL\" --codex-effort \"$CODEX_EFFORT\""
  if [[ -n "$DELIVERABLE_PATH" ]]; then
    cmd="$cmd --deliverable \"$DELIVERABLE_PATH\""
  fi
  if [[ "$STRICT_SPEC" == "1" ]]; then
    cmd="$cmd --strict-spec"
  fi
  if [[ -n "$CLAUDE_MODEL" ]]; then
    cmd="$cmd --claude-model \"$CLAUDE_MODEL\""
  fi
  if [[ -n "$CLAUDE_EFFORT" ]]; then
    cmd="$cmd --claude-effort \"$CLAUDE_EFFORT\""
  fi
  echo "$cmd"
}

emit_escalation() {
  local reason="$1"
  local output_file="$2"
  local attempts="$3"
  local last_agent_log="${4:-}"
  local decision_needed
  local recommended_action
  local resume_cmd
  decision_needed="$(intervention_decision_needed "$reason")"
  recommended_action="$(intervention_recommended_action "$reason")"
  resume_cmd="$(build_resume_command)"

  cat >"$ESCALATION_FILE" <<EOF
# WO Autopilot Escalation

- WO: \`$WO_PATH\`
- Deliverable: \`${DELIVERABLE_PATH:-n/a}\`
- Profile: \`$PROFILE\`
- Gate-driven: \`$GATE_DRIVEN\`
- Engine: \`$ENGINE\`
- Fallback engine: \`$FALLBACK_ENGINE\`
- Attempted autopatch passes: \`$attempts\`
- Escalation reason: \`$reason\`
- Session log: \`$SESSION_LOG\`
- Last agent log: \`${last_agent_log:-n/a}\`

## Intervention Packet
- Decision needed now: $decision_needed
- Recommended action: $recommended_action
- Impact if delayed: routine WO chain remains blocked and downstream WOs may slip.
- Fast resume command: \`$resume_cmd\`

## Latest lint output
\`\`\`text
$(cat "$output_file")
\`\`\`
EOF
}

build_prompt() {
  local output_file="$1"
  local prompt_file="$2"
  local pass_no="$3"

  cat >"$prompt_file" <<EOF
You are running a routine WO compliance autopatch pass.

Repository root: $REPO
WO file: $WO_PATH
Deliverable file: ${DELIVERABLE_PATH:-n/a}
Profile: $PROFILE
Gate-driven mode: $GATE_DRIVEN
Pass: $pass_no of $MAX_PASSES

Scope and guardrails:
1. Apply the smallest possible edits to clear the lint failures shown below.
2. Do not change objective, decision gate, fixed scope, or decision outcome claims.
3. Do not broaden scope, add new analysis tracks, or alter thresholds unless explicitly required by lint.
4. Edit only these files unless absolutely required:
   - $WO_PATH
EOF
  if [[ -n "$DELIVERABLE_PATH" ]]; then
    cat >>"$prompt_file" <<EOF
   - $DELIVERABLE_PATH
EOF
  fi
  cat >>"$prompt_file" <<EOF

Required verification:
- $TOOLS_DIR/wo_loop.sh --repo "$REPO" --wo "$WO_PATH" --profile "$PROFILE" --gate-driven "$GATE_DRIVEN"${DELIVERABLE_PATH:+ --deliverable "$DELIVERABLE_PATH"}$( [[ "$STRICT_SPEC" == "1" ]] && echo " --strict-spec" )

Current failures:
\`\`\`text
$(cat "$output_file")
\`\`\`

When done, output a short changelog (max 8 bullets) and stop.
EOF
}

run_agent_pass() {
  local engine="$1"
  local prompt_file="$2"
  local agent_log="$3"
  local status=0

  case "$engine" in
    codex)
      local -a cmd=(codex exec --dangerously-bypass-approvals-and-sandbox -C "$REPO")
      if [[ -n "$CODEX_MODEL" ]]; then
        cmd+=(--model "$CODEX_MODEL")
      fi
      cmd+=(-c "model_reasoning_effort=\"$CODEX_EFFORT\"")
      cmd+=(-)
      set +e
      "${cmd[@]}" <"$prompt_file" >"$agent_log" 2>&1
      status=$?
      set -e
      return "$status"
      ;;
    claude)
      local -a cmd=(claude -p --permission-mode bypassPermissions --dangerously-skip-permissions)
      if [[ -n "$CLAUDE_MODEL" ]]; then
        cmd+=(--model "$CLAUDE_MODEL")
      fi
      if [[ -n "$CLAUDE_EFFORT" ]]; then
        cmd+=(--effort "$CLAUDE_EFFORT")
      fi
      set +e
      "${cmd[@]}" <"$prompt_file" >"$agent_log" 2>&1
      status=$?
      set -e
      return "$status"
      ;;
    none)
      return 125
      ;;
    *)
      echo "ERROR: unsupported engine: $ENGINE" >"$agent_log"
      return 126
      ;;
  esac
}

append_session_block() {
  local label="$1"
  local file="$2"
  {
    echo "===== $label ====="
    cat "$file"
    echo
  } >>"$SESSION_LOG"
}

echo "=== WO Autopilot ==="
echo "WO: $WO_PATH"
echo "Deliverable: ${DELIVERABLE_PATH:-n/a}"
echo "Engine: $ENGINE"
echo "Fallback engine: $FALLBACK_ENGINE"
echo "Max passes: $MAX_PASSES"
if [[ -n "$CODEX_MODEL" ]]; then
  echo "Codex model override: $CODEX_MODEL"
fi
echo "Codex effort: $CODEX_EFFORT"
if [[ -n "$CLAUDE_MODEL" ]]; then
  echo "Claude model override: $CLAUDE_MODEL"
fi
if [[ -n "$CLAUDE_EFFORT" ]]; then
  echo "Claude effort: $CLAUDE_EFFORT"
fi
echo "Session log: $SESSION_LOG"
echo ""

attempt=0
last_failure_hash=""
last_agent_log=""

while true; do
  loop_output="$(mktemp)"
  if run_loop_once "$loop_output"; then
    cat "$loop_output"
    append_session_block "LINT PASS" "$loop_output"
    rm -f "$loop_output"
    echo ""
    echo "WO autopilot completed successfully."
    exit 0
  else
    loop_status=$?
  fi
  cat "$loop_output"
  append_session_block "LINT FAIL (status $loop_status)" "$loop_output"

  current_hash="$(shasum "$loop_output" | awk '{print $1}')"
  if is_leverage_failure "$loop_output"; then
    emit_escalation "leverage-trigger" "$loop_output" "$attempt" "$last_agent_log"
    rm -f "$loop_output"
    echo ""
    echo "Escalated (leverage trigger): $ESCALATION_FILE"
    exit 3
  fi

  if [[ "$ENGINE" == "none" ]]; then
    rm -f "$loop_output"
    echo ""
    echo "Routine failures detected but --engine none was selected."
    echo "Patch packet (if output lint failed) was generated by wo_loop."
    exit "$loop_status"
  fi

  if [[ -n "$last_failure_hash" && "$current_hash" == "$last_failure_hash" ]]; then
    emit_escalation "no-progress-after-agent-pass" "$loop_output" "$attempt" "$last_agent_log"
    rm -f "$loop_output"
    echo ""
    echo "Escalated (no progress): $ESCALATION_FILE"
    exit 4
  fi

  if (( attempt >= MAX_PASSES )); then
    emit_escalation "max-passes-exceeded" "$loop_output" "$attempt" "$last_agent_log"
    rm -f "$loop_output"
    echo ""
    echo "Escalated (max passes exceeded): $ESCALATION_FILE"
    exit 5
  fi

  attempt=$((attempt + 1))
  prompt_file="$(mktemp)"
  build_prompt "$loop_output" "$prompt_file" "$attempt"
  rm -f "$loop_output"

  agent_pass_ok="0"
  engines_to_try=()
  if [[ "$ENGINE" != "none" ]]; then
    engines_to_try+=("$ENGINE")
  fi
  if [[ "$FALLBACK_ENGINE" != "none" && "$FALLBACK_ENGINE" != "$ENGINE" ]]; then
    engines_to_try+=("$FALLBACK_ENGINE")
  fi

  for engine_name in "${engines_to_try[@]}"; do
    agent_log="$LOG_DIR_ABS/${WO_BASE}-autopilot-agent-pass-${attempt}-${engine_name}-${TS}.log"
    echo ""
    echo "--- Autopatch pass $attempt/$MAX_PASSES via $engine_name ---"
    if run_agent_pass "$engine_name" "$prompt_file" "$agent_log"; then
      append_session_block "AGENT PASS (pass $attempt engine $engine_name)" "$agent_log"
      last_agent_log="$agent_log"
      agent_pass_ok="1"
      break
    fi
    append_session_block "AGENT FAIL (pass $attempt engine $engine_name)" "$agent_log"
    last_agent_log="$agent_log"
  done

  rm -f "$prompt_file"
  if [[ "$agent_pass_ok" != "1" ]]; then
    emit_escalation "agent-cli-error" "$last_agent_log" "$attempt" "$last_agent_log"
    echo "Escalated (agent CLI error): $ESCALATION_FILE"
    exit 6
  fi

  last_failure_hash="$current_hash"
done
