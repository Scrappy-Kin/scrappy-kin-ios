#!/usr/bin/env python3
"""Lint work-order specs against WO-Full / WO-Lite contracts."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Iterable


FULL_SECTION_PATTERNS = [
    ("assignment", r"^##\s*(1\)\s*)?Assignment\b"),
    ("required_reading", r"^##\s*(2\)\s*)?Required reading\b"),
    ("objective", r"^##\s*(3\)\s*)?Objective\b"),
    ("decision_gate", r"^##\s*(4\)\s*)?Decision gates?\b"),
    ("fixed_scope", r"^##\s*(5\)\s*)?Fixed scope\b"),
    ("allowed_sources_tools", r"^#{2,3}\s*(6\)|5\.\d+)?\s*Allowed sources/tools\b"),
    (
        "capture_schema",
        r"^#{2,3}\s*(7\)|5\.\d+)?\s*(Capture schema|Required schema|Modeling contract|Core schema/QA invariants)\b",
    ),
    ("quality_bars", r"^#{2,3}\s*(8\)|5\.\d+)?\s*(Minimum )?quality bars\b"),
    ("red_flag_rules", r"^#{2,3}\s*(9\)|5\.\d+)?\s*Red-flag escalation rules\b"),
    ("deliverable_format", r"^##\s*(10\)|6\))\s*Deliverable format\b"),
    ("stop_conditions", r"^##\s*(11\)|7\))\s*Stop conditions\b"),
    ("rules", r"^##\s*(12\)|8\))\s*Rules\b"),
    ("success_criteria", r"^##\s*(13\)|9\))\s*Success criteria\b"),
    ("decision_clock", r"^##\s*(14\)|10\))\s*Decision clock\b"),
    ("variant_cap", r"^##\s*(15\)|11\))\s*Variant cap and tranche plan\b"),
    (
        "consistency_requirement",
        r"^##\s*(16\)|13\))\s*Consistency Check requirement\b",
    ),
]

LITE_SECTION_PATTERNS = [
    ("assignment", r"^##\s*(1\)\s*)?Assignment\b"),
    ("required_reading", r"^##\s*(2\)\s*)?Required reading\b"),
    ("objective", r"^##\s*(3\)\s*)?Objective\b"),
    ("decision_gate", r"^##\s*(4\)\s*)?Decision gate\b"),
    ("fixed_scope", r"^##\s*(5\)\s*)?Fixed scope\b"),
    ("deliverable_format", r"^##\s*(6\)\s*)?Deliverable format\b"),
    ("stop_conditions", r"^##\s*(7\)\s*)?Stop conditions\b"),
    ("rules", r"^##\s*(8\)\s*)?Rules\b"),
    ("success_criteria", r"^##\s*(9\)\s*)?Success criteria\b"),
    ("merge_contract", r"^##\s*(10\)\s*)?Merge/readiness contract\b"),
]

AMBIGUOUS_THRESHOLD_PATTERNS = (
    r"\bif interpreted\b",
    r"\bif read as\b",
    r"\beither\b",
    r"\bor\b",
    r"\bdepending on\b",
)


def find_missing_sections(text: str, patterns: Iterable[tuple[str, str]]) -> list[str]:
    missing: list[str] = []
    for key, pattern in patterns:
        if not re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE):
            missing.append(key)
    return missing


def find_threshold_lines(lines: list[str]) -> list[tuple[int, str]]:
    hits: list[tuple[int, str]] = []
    threshold_re = re.compile(r"(>=|<=|>|<|==|=)\s*\d+")
    for idx, line in enumerate(lines, start=1):
        if threshold_re.search(line):
            hits.append((idx, line.strip()))
    return hits


def check_anchor_grade_overload(lines: list[str]) -> list[str]:
    issues: list[str] = []
    for idx, line in enumerate(lines, start=1):
        ll = line.lower()
        if "anchor_grade" in ll and ("fee" in ll or "completeness" in ll):
            issues.append(
                f"line {idx}: anchor_grade appears overloaded with fee/completeness semantics"
            )
    return issues


def check_ambiguous_thresholds(threshold_lines: list[tuple[int, str]]) -> list[str]:
    issues: list[str] = []
    for idx, line in threshold_lines:
        ll = line.lower()
        if any(re.search(pattern, ll) for pattern in AMBIGUOUS_THRESHOLD_PATTERNS):
            issues.append(f"line {idx}: ambiguous threshold phrasing -> {line}")
    return issues


def check_schema_explicitness(text: str) -> list[str]:
    issues: list[str] = []
    if re.search(r"capture schema|required schema|required columns", text, re.IGNORECASE):
        if "table_name" not in text:
            issues.append("schema section appears present but `table_name` is missing")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Lint a WO spec.")
    parser.add_argument("--wo", required=True, help="Path to WO markdown file")
    parser.add_argument(
        "--profile",
        choices=("full", "lite"),
        default="full",
        help="WO contract profile",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as errors",
    )
    args = parser.parse_args()

    wo_path = Path(args.wo).expanduser().resolve()
    if not wo_path.exists():
        print(f"[FAIL] WO not found: {wo_path}")
        return 2

    text = wo_path.read_text(encoding="utf-8")
    lines = text.splitlines()

    patterns = FULL_SECTION_PATTERNS if args.profile == "full" else LITE_SECTION_PATTERNS
    missing_sections = find_missing_sections(text, patterns)
    threshold_lines = find_threshold_lines(lines)
    anchor_issues = check_anchor_grade_overload(lines)
    ambiguous_thresholds = check_ambiguous_thresholds(threshold_lines)
    schema_issues = check_schema_explicitness(text)

    warnings: list[str] = []
    if threshold_lines and not re.search(
        r"metric[_\s-]?key|threshold[_\s-]?key|critical_counts",
        text,
        flags=re.IGNORECASE,
    ):
        warnings.append(
            "thresholds found but no metric-key block detected; add machine-checkable keys"
        )
    warnings.extend(schema_issues)

    errors: list[str] = []
    errors.extend([f"missing section: {name}" for name in missing_sections])
    errors.extend(anchor_issues)
    errors.extend(ambiguous_thresholds)
    if args.strict:
        errors.extend([f"(strict) {msg}" for msg in warnings])

    if errors:
        print(f"[FAIL] {wo_path} ({args.profile})")
        for item in errors:
            print(f"- {item}")
        if warnings and not args.strict:
            print("[WARNINGS]")
            for item in warnings:
                print(f"- {item}")
        return 1

    print(f"[PASS] {wo_path} ({args.profile})")
    if warnings:
        print("[WARNINGS]")
        for item in warnings:
            print(f"- {item}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
