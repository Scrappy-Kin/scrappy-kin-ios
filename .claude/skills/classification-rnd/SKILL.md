---
name: classification-rnd
description: Self-directed R&D loop for building classification pipelines against human-labeled datasets. Use when experimenting with automated tagging, labeling, or categorization.
---

# Classification R&D Guide

A self-directed experiment loop for building automated classification against human-generated labels.

⸻

## ⚡ Five Non-Negotiables

1. **Snapshot before experiment** — Export a frozen dataset copy before any run. Never classify against a moving target.
2. **Holdout is sacred** — Reserve ≥20% of labeled data as a holdout set. Never train, tune prompts, or select few-shot examples from it.
3. **Deterministic first** — Before touching an LLM, exhaust rule-based and keyword approaches. They're free, fast, and set the baseline.
4. **Log everything, interpret later** — Every run writes structured results. Raw predictions, per-tag metrics, model ID, timestamp. Analysis is a separate step.
5. **Credits are finite, compute is overnight** — Use SOTA for planning, evaluation design, and synthesis. Use local models for bulk classification. Queue heavy work for batch execution.

⸻

## 🗺️ Tag Tiering (Do This First)

Before designing experiments, classify the *tags themselves* by automation difficulty:

| Tier | Description | Method | Action |
|------|-------------|--------|--------|
| 0 — Deterministic | Applied by business logic, not content | Skip | Already automated. Exclude from experiments. |
| 1 — Surface Signal | Direct keywords, patterns, or regex in the text | Keyword/regex | Write matchers, score against labeled set. Day 1 task. |
| 2 — LLM-Amenable | Requires understanding tone, hedging, or intent. 30+ labeled examples. | LLM few-shot | Design prompt variants, run local model comparisons. |
| 3 — Sparse / Hard | <20 labeled examples. Can't evaluate reliably. | Human-only (for now) | Flag for future labeling. Revisit as dataset grows. |

**Verify tiering against actual data before proceeding.** Run frequency counts, spot-check examples, adjust assignments.

⸻

## 🔄 The R&D Loop

### Phase 1: Setup (once per cycle)

1. **Export snapshot** — Freeze labeled data to `data/snapshot-YYYY-MM-DD.jsonl`
2. **Split holdout** — Deterministic split (e.g., hash of record ID). Document the method. Never change mid-cycle.
3. **Verify tag tiering** — Counts, spot-checks, tier adjustments.
4. **Build evaluation harness** — Script: predictions file × holdout → per-tag precision/recall/F1 + summary. This is your most important artifact.

### Phase 2: Baselines (no credits)

5. **Keyword/regex for Tier 1** — Pattern matchers, scored against full labeled set for intuition, then holdout for measurement.
6. **Evaluate on holdout** — Record per-tag metrics. This is the floor everything must beat.

### Phase 3: LLM Experiments (local models, batch-friendly)

7. **Design prompt variants** — Zero-shot, few-shot (examples from training set only), chain-of-thought. Version them.
8. **Select candidate models** — Start small and fast. Only test larger models if small ones plateau.
9. **Batch classify** — For each (model × prompt × tag-set) combo, classify all holdout records. Write predictions to structured files. This is the overnight work.
10. **Evaluate and compare** — Run through harness. Build comparison table.

### Phase 4: Pipeline Assembly

11. **Pick winners per tag** — Route each tag to its best method (regex, LLM, or human-only).
12. **Evaluate combined pipeline** on holdout.
13. **Pre-label unlabeled data** — Run pipeline on untagged records with confidence scores.

### Phase 5: Human Review → Correction Loop

14. **Human reviews pre-labeled data** — Confirms or corrects predictions.
15. **Log corrections as diffs** — Record: `{record_id, tag, predicted, corrected, model_id, run_id}`. These are first-class training data.
16. **Analyze correction patterns** — Which tags get corrected most? Which model/tag pairs produce systematic errors? This feeds the next R&D cycle.
17. **Merge confirmed labels into canonical dataset** — Grow the labeled pool for the next cycle's snapshot.

### Phase 6: Synthesis

18. **Write findings** — What worked, what didn't, per-tag accuracy, recommended pipeline, where human review is still needed, what improves with more data, what corrections revealed.

⸻

## 🔁 The Correction-as-Data Loop

This is the compound advantage. Each review cycle produces:

```
Cycle 1: 161 labeled → train → pre-label 374 → human corrects → ~535 labeled
Cycle 2: 535 labeled → retrain → pre-label new data → human corrects → ...
```

**Corrections are more valuable than random labels** because they're concentrated on exactly the cases the model gets wrong — the hard examples.

**Track corrections as structured diffs:**
```json
{
  "record_id": "email-1234",
  "tag": "confirmation__deleted_if_found",
  "predicted": true,
  "corrected": false,
  "correct_tag": "confirmation__deleted",
  "model_id": "hermes3:8b",
  "prompt_version": "few-shot-v2",
  "run_id": "RUN-20260211",
  "timestamp": "2026-02-11T14:30:00Z"
}
```

**Use correction data to:**
- Build confusion matrices (which tag pairs does the model conflate?)
- Select targeted few-shot examples (show the model its common mistakes)
- Track accuracy improvement across cycles
- Identify tags approaching "good enough" automation vs still needing human review

⸻

## 📁 File Structure

```
data/
  snapshot-YYYY-MM-DD.jsonl       # Frozen dataset export
  holdout-ids.txt                 # Held-out record IDs
  corrections/                    # Human review diffs
    corrections-YYYY-MM-DD.jsonl

experiments/
  prompts/                        # Prompt templates (versioned)
  runs/                           # Raw prediction outputs per run
    RUN-ID.jsonl
  results/                        # Evaluation summaries per run
    RUN-ID-eval.json
  comparison.md                   # Running comparison table

scripts/
  export-snapshot.py              # Source data → JSONL
  eval-harness.py                 # Predictions × holdout → metrics
  classify-regex.py               # Tier 1 keyword classifiers
  classify-llm.py                 # Tier 2 LLM batch classifier
  pipeline.py                     # Combined best-of pipeline
  analyze-corrections.py          # Correction diff analysis
```

⸻

## 💰 Credit Conservation

| Task | Run Where | Why |
|------|-----------|-----|
| Planning, experiment design, evaluation review | SOTA agent | Needs judgment, fast |
| Prompt drafting and iteration | SOTA agent | Creative work |
| Bulk classification (N records × M models) | Local models | Slow but free. Batch overnight. |
| Regex/keyword development | Local scripts | Zero cost |
| Results synthesis, next-step decisions | SOTA agent | Needs judgment |

**Overnight pattern:** Queue batch runs as shell scripts before end of session. Next session starts with analyzing result files.

⸻

## 📊 Evaluation Standards

**Primary metric:** Per-tag F1 on holdout set.

**Minimum bar:** Must beat keyword/regex baseline for its target tags.

**Comparison table (one row per run):**

| Run ID | Method | Model | Prompt | Tags | Avg F1 | Best Tag | Worst Tag | Runtime | Notes |
|--------|--------|-------|--------|------|--------|----------|-----------|---------|-------|

**Confidence for pre-labeling:** Output confidence scores (model log-probs or multi-model agreement). Flag low-confidence predictions for priority human review.

⸻

## ⚠️ Failure Modes

| Mode | Description |
|------|-------------|
| Holdout Contamination | Using holdout examples in few-shot prompts or tuning |
| Baseline Skipping | Jumping to LLMs without keyword baselines |
| Single-Metric Tunnel Vision | Optimizing aggregate accuracy while one tag is at 40% |
| Prompt Overfitting | Tuning prompts against full labeled set instead of dev split |
| Overnight Amnesia | Batch jobs without enough metadata to interpret results |
| Gold-Plating | Chasing 95% on a tag already at 85% while others are stuck |
| Credit Burn | SOTA work that could run locally |
| Correction Blindness | Discarding correction diffs instead of feeding next cycle |

⸻

## ✅ Cycle Complete When

- [ ] Every non-Tier-0 tag has a measured baseline
- [ ] Combined pipeline routes each tag to its best method
- [ ] Pipeline evaluated on holdout with per-tag metrics logged
- [ ] Unlabeled data pre-labeled with confidence scores
- [ ] Correction diffs structured and stored for next cycle
- [ ] Synthesis doc: what works, what doesn't, what to invest in next
- [ ] All artifacts in defined file structure, no temp files remain