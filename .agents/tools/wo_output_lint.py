#!/usr/bin/env python3
"""Lint WO deliverables for merge/readiness and consistency coherence."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


FOOTER_REQUIRED_HEADINGS = [
    "## A)",
    "## B)",
    "## C)",
    "## D)",
    "## E)",
    "## F)",
    "## G)",
    "## H)",
    "## I)",
    "## J)",
    "## K)",
]

CONSISTENCY_TO_MERGE = {
    "PASS": "ready",
    "FAIL": "patch required",
    "PATCH_REQUIRED": "patch required",
}


def has_heading(text: str, heading_prefix: str) -> bool:
    pattern = rf"^{re.escape(heading_prefix)}"
    return bool(re.search(pattern, text, flags=re.MULTILINE))


def extract_footer_status(text: str) -> str | None:
    m = re.search(
        r"^\s*-\s*Status:\s*`?(ready|patch required)`?\s*$",
        text,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    return m.group(1).lower() if m else None


def extract_final_merge_line_status(text: str) -> str | None:
    m = re.search(
        r"^\s*Merge readiness:\s*(ready|patch required)\s*$",
        text,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    return m.group(1).lower() if m else None


def extract_consistency_merge_status(text: str) -> str | None:
    m = re.search(
        r"merge_readiness_status:\s*(PASS|FAIL|PATCH_REQUIRED)",
        text,
        flags=re.IGNORECASE,
    )
    if not m:
        return None
    raw = m.group(1).upper()
    return CONSISTENCY_TO_MERGE.get(raw)


def infer_gate_driven(text: str, gate_driven_arg: str) -> bool:
    if gate_driven_arg == "yes":
        return True
    if gate_driven_arg == "no":
        return False
    return bool(
        re.search(r"decision gate|consistency check|merge_readiness_status", text, re.IGNORECASE)
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Lint a WO deliverable.")
    parser.add_argument("--deliverable", required=True, help="Path to deliverable markdown file")
    parser.add_argument("--profile", choices=("full", "lite"), default="full")
    parser.add_argument(
        "--gate-driven",
        choices=("auto", "yes", "no"),
        default="auto",
        help="Whether to enforce consistency block checks",
    )
    parser.add_argument(
        "--allow-missing-final-merge-line",
        action="store_true",
        help="Allow legacy deliverables that only include footer status",
    )
    args = parser.parse_args()

    deliverable_path = Path(args.deliverable).expanduser().resolve()
    if not deliverable_path.exists():
        print(f"[FAIL] Deliverable not found: {deliverable_path}")
        return 2

    text = deliverable_path.read_text(encoding="utf-8")
    gate_driven = infer_gate_driven(text, args.gate_driven)

    errors: list[str] = []
    warnings: list[str] = []

    if not has_heading(text, "## WO Compliance Checklist"):
        errors.append("missing `## WO Compliance Checklist` section")

    for heading in FOOTER_REQUIRED_HEADINGS:
        if not has_heading(text, heading):
            errors.append(f"missing footer heading `{heading}`")

    footer_status = extract_footer_status(text)
    final_merge_status = extract_final_merge_line_status(text)
    consistency_status = extract_consistency_merge_status(text)

    if footer_status is None:
        errors.append("missing footer status line (`- Status: `ready|patch required``)")

    if final_merge_status is None and not args.allow_missing_final_merge_line:
        errors.append("missing explicit final merge line (`Merge readiness: ready|patch required`)")
    elif final_merge_status is None and args.allow_missing_final_merge_line:
        warnings.append("legacy mode: final merge line missing")

    if gate_driven:
        if not re.search(r"^##\s+Consistency Check\b", text, flags=re.IGNORECASE | re.MULTILINE):
            errors.append("gate-driven deliverable missing `## Consistency Check` section")
        if not re.search(r"merge_readiness_status:\s*(PASS|FAIL|PATCH_REQUIRED)", text, re.IGNORECASE):
            errors.append("gate-driven deliverable missing `merge_readiness_status` in consistency block")
        if not re.search(r"status:\s*\"?(PASS|FAIL|PATCH_REQUIRED)\"?", text, re.IGNORECASE):
            errors.append("gate-driven deliverable missing canonical gate statuses in consistency block")

    if footer_status and final_merge_status and footer_status != final_merge_status:
        errors.append(
            f"footer status (`{footer_status}`) conflicts with final merge line (`{final_merge_status}`)"
        )

    if consistency_status and footer_status and consistency_status != footer_status:
        errors.append(
            "consistency block merge status conflicts with footer status "
            f"(`{consistency_status}` vs `{footer_status}`)"
        )

    if consistency_status and final_merge_status and consistency_status != final_merge_status:
        errors.append(
            "consistency block merge status conflicts with final merge line "
            f"(`{consistency_status}` vs `{final_merge_status}`)"
        )

    if errors:
        print(f"[FAIL] {deliverable_path} ({args.profile})")
        for item in errors:
            print(f"- {item}")
        if warnings:
            print("[WARNINGS]")
            for item in warnings:
                print(f"- {item}")
        return 1

    print(f"[PASS] {deliverable_path} ({args.profile})")
    if warnings:
        print("[WARNINGS]")
        for item in warnings:
            print(f"- {item}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
