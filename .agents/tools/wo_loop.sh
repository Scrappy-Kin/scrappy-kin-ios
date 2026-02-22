#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  wo_loop.sh --wo <path> [--deliverable <path>] [--repo <path>] [--profile full|lite] [--gate-driven auto|yes|no] [--strict-spec]

What it does:
  1) Runs wo_spec_lint.py on the WO.
  2) Optionally runs wo_output_lint.py on the deliverable.
  3) If deliverable lint fails, emits a patch packet under deliverables/reviews/.
EOF
}

REPO="$(pwd)"
WO_PATH=""
DELIVERABLE_PATH=""
PROFILE="full"
GATE_DRIVEN="auto"
STRICT_SPEC="0"

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

echo "=== WO Loop :: Assign/Spec Preflight ==="
SPEC_ARGS=(--wo "$WO_ABS" --profile "$PROFILE")
if [[ "$STRICT_SPEC" == "1" ]]; then
  SPEC_ARGS+=(--strict)
fi

"$TOOLS_DIR/wo_spec_lint.py" "${SPEC_ARGS[@]}"
echo "Spec lint passed."

if [[ -z "$DELIVERABLE_PATH" ]]; then
  echo "No deliverable provided. Assign/preflight stage complete."
  exit 0
fi

DELIVERABLE_ABS="$(abs_path "$DELIVERABLE_PATH")"
if [[ ! -f "$DELIVERABLE_ABS" ]]; then
  echo "ERROR: deliverable file not found: $DELIVERABLE_ABS"
  exit 1
fi

echo ""
echo "=== WO Loop :: Review/Output Lint ==="
set +e
LINT_OUTPUT="$("$TOOLS_DIR/wo_output_lint.py" \
  --deliverable "$DELIVERABLE_ABS" \
  --profile "$PROFILE" \
  --gate-driven "$GATE_DRIVEN" 2>&1)"
LINT_STATUS=$?
set -e
echo "$LINT_OUTPUT"

if [[ $LINT_STATUS -eq 0 ]]; then
  echo "Output lint passed. Close stage can proceed."
  exit 0
fi

WO_BASE="$(basename "$WO_ABS" .md)"
DATE_STAMP="$(date +%Y-%m-%d)"
REVIEWS_DIR="$REPO/deliverables/reviews"
PATCH_PACKET="$REVIEWS_DIR/${WO_BASE}-patch-packet-${DATE_STAMP}.md"
mkdir -p "$REVIEWS_DIR"

TEMPLATE_PATH="$REPO/.agents/templates/patch-packet.md"
if [[ -f "$TEMPLATE_PATH" ]]; then
  cp "$TEMPLATE_PATH" "$PATCH_PACKET"
else
  cat > "$PATCH_PACKET" <<'EOF'
# Patch Packet
EOF
fi

cat >> "$PATCH_PACKET" <<EOF

## Auto Findings (wo_output_lint)

\`\`\`text
$LINT_OUTPUT
\`\`\`

## Auto Prompt

\`\`\`md
Please patch \`$DELIVERABLE_PATH\`.

Goal:
1. Resolve all \`wo_output_lint.py\` failures shown above.
2. Keep scope unchanged unless WO explicitly asks for expansion.

Validation checks (must pass):
- \`.agents/tools/wo_output_lint.py --deliverable "$DELIVERABLE_PATH" --profile $PROFILE --gate-driven $GATE_DRIVEN\`
- If WO is gate-driven, ensure consistency block statuses reconcile with footer + final merge line.
\`\`\`
EOF

echo ""
echo "Output lint failed; patch packet generated:"
echo "- $PATCH_PACKET"
exit 2
