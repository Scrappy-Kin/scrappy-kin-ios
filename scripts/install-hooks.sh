#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

hook_path="$repo_root/.git/hooks/pre-commit"

cat <<'HOOK' > "$hook_path"
#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
"$repo_root/scripts/check-log-schema.js"
HOOK

chmod +x "$hook_path"

echo "Installed pre-commit hook at $hook_path"
