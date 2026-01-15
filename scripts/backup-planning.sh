#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$repo_root/docs/planning"
volume_root="/Volumes/T7-Dev"
backup_root="$volume_root/resolve/scrappy-kin-backups"
backup_dir="$backup_root/planning"
log_file="$HOME/Library/Logs/scrappy-kin-planning-backup.log"

ts() {
  date "+%Y-%m-%d %H:%M:%S"
}

if [[ ! -d "$source_dir" ]]; then
  echo "$(ts) missing source dir: $source_dir" >> "$log_file"
  exit 1
fi

if [[ ! -d "$volume_root" ]]; then
  echo "$(ts) volume not mounted: $volume_root" >> "$log_file"
  exit 0
fi

mkdir -p "$backup_dir"

echo "$(ts) backup start" >> "$log_file"
rsync -a --delete "$source_dir/" "$backup_dir/" >> "$log_file" 2>&1
rm -f "$backup_root/.last-backup" 2>/dev/null || true
printf "%s\n" "$(ts)" > "$backup_root/.last-backup"
echo "$(ts) backup complete" >> "$log_file"
