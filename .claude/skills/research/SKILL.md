---
name: research
description: Guardrails for high-signal research loops. Use when gathering information to support a decision - know when to stop and build a harness instead.
---

# Agentic Research Guide

Reusable guardrails for high-signal research loops with minimal drift, safe tooling practices, and decision-ready outputs.

⸻

## ⚡ Four Non-Negotiables

1. **Decision-first** — Start from the question the research must resolve, not "gather information"
2. **Know when to stop** — If a harness can prove it in 10 minutes, stop researching and start testing
3. **Privacy-first** — Strip PII/IP before sending to external tools; assume they're compromised
4. **Auditability over convenience** — If a claim cannot be audited, label it **Unknown** or exclude it from conclusions

⸻

## Research Modes (pick one up front)

- **Quick scan** — fast orientation, directional only, no gate decision.
- **Decision dossier** — decision-grade readout with counterevidence and explicit limits.
- **Deep dive** — broader mapping when uncertainty is still high after a dossier pass.

If mode is not specified, default to **Decision dossier**.

⸻

## Research Kickoff Gate (for new research endeavors)

Before collecting new external evidence, lock these fields in writing:

1. **Decision target**
   - Exact decision this research must support.
   - What changes if the answer is A vs B.
2. **Population and unit**
   - Population of interest (what world you want to generalize to).
   - Unit of analysis (what one row/record means).
3. **Inclusion/exclusion rules**
   - Predeclare filters before viewing outcomes.
   - Any post-hoc filter requires explicit `PATCH NOTE` plus reason.
4. **Comparability contract**
   - Normalize key dimensions (time window, currency, geography, segment, etc).
   - Mixed units are allowed only when explicitly labeled and separated.
5. **Minimum viable stats discipline**
   - Define missing-data handling (`drop`, `impute`, or `unknown`) up front.
   - Separate claim classes: `directional` vs `decision-grade`.
   - Require uncertainty expression for decision-grade outputs (range/band + confidence label).
   - Run at least 2 sensitivity checks for high-impact assumptions.
6. **Sufficiency thresholds**
   - Minimum source/sample thresholds needed for decision-grade use.
   - If below threshold, return `RED FLAG: DATA THIN` instead of forcing precision.
7. **Stop/ship rules**
   - Timebox and explicit stop conditions.
   - Define what qualifies as "good enough to decide now."
8. **Failure modes to watch**
   - Sample bias, convenience sampling, survivorship bias, stale data, duplicated sources.

For incremental follow-up work on an already locked thread, reference the existing kickoff lock and list only deltas.

⸻

## Capture Schema Discipline (for research/data work)

When a WO/deliverable uses a capture schema:

1. Keep comparator fields single-purpose.
   - Example: `anchor_grade` should only encode comparability (`YES|NO` for exact-window eligibility).
   - Do not overload comparator fields with data-quality or fee-visibility semantics.
2. Separate quality/completeness into distinct fields.
   - Example: `fee_completeness` = `full|partial|unknown|included_not_itemized`.
3. Keep contract fields explicit, even if they look redundant.
   - If schema requires `table_name`, include `table_name` as a real column/field.
   - Do not infer required fields from section headers or prose.
4. Treat schema relaxation as a spec change, not a run-time exception.
   - Update WO/spec/template first, then execute.
5. If a required field is missing or ambiguous, return `RED FLAG: FOUNDATION MISSING` before deeper analysis.

⸻

## ⚠️ Stop Researching If...

- **You can test your hypothesis with a harness in <10 minutes** → Build it instead  
  Exception: for high-stakes legal/financial/regulatory decisions, do not force a speed shortcut—prioritize verification depth.
- **You're gathering "more context" without a specific decision gate** → You're procrastinating
- **You've found 3+ independent sources saying the same thing** → Confidence threshold met, move on  
  Independence check: avoid same-origin echo chains (for example syndications or mutually citing summaries).

**When in doubt:** Switch to Operating Guide and build a harness. Testing beats researching.

⸻

## Consequential Claim Contract

For each consequential claim, include:
- `claim_type`: `fact` | `inference` | `hypothesis`
- `confidence`: `H` | `M` | `L`
- `allowed_use`: `decision` | `directional` | `exploratory`
- short rationale (<=12 words)

Usage rule:
- `fact + H/M` can support decision gates.
- `inference` supports directional guidance only.
- `hypothesis` is exploratory only.

Never use `inference` or `hypothesis` as a headline fact.

⸻

## Core Principles

- **Stage realism:** Tailor examples to operating reality (team size, budget, ARR stage). Flag aspirational exemplars.
- **Evidence discipline:** Every claim links to a source (URL + access date + credibility note). Cross-verify critical facts. Dynamic metrics must include an “as-of” timestamp (and “approx” if not exact).
- **Auditability:** For sources without permalinks, include an Evidence Log and a local evidence artifact.
- **Leverage per hour:** Time is the scarcest resource. Favor workflows that batch, template, or delegate well.

⸻

## 🔄 The Research Loop

1. **Clarify intent** – Restate the research question, decision gate, and deliverables before exploring.
2. **Audit existing knowledge** – Skim internal docs and prior findings. **Log the internal file paths you used.** Only expand scope when you hit a gap.
3. **Map hypotheses** – List candidate explanations or strategies to evaluate.
4. **Plan tool usage** – Choose discovery vs verification tools up front.
5. **Collect evidence** – Gather data in focused bursts, logging sources and quick takeaways.
6. **Synthesize early** – Summarize findings after each burst; update confidence and open questions.
7. **Know when to stop** – If your hypothesis can be validated by running code, switch to the Operating Guide.
8. **Package outputs** – Deliver concise summaries, tables, and appendices.

⸻

## Auditability Protocol (Evergreen)

### 1) Evidence Log (required for non-permalink sources)
If a source does **not** offer permalinks (e.g., app reviews, some forums), you may still use it **only** if you record:
- Source type + primary URL
- Author/reviewer handle (as shown, minimally necessary), date, rating (if relevant)
- Retrieval timestamp (YYYY-MM-DD HH:MM local)
- Evidence artifact path (screenshot or copied snippet)

If no artifact exists → mark **Unverified** and **exclude from conclusions**.

Privacy note:
- Apply data minimization. Capture only what is needed for reproducibility.
- Redact personal identifiers where feasible (for example initials or partial handles).

**Evidence Log table (include in deliverable):**

| Evidence ID | Source type | Primary URL | Author | Date | Retrieved at | Evidence file path |
| --- | --- | --- | --- | --- | --- | --- |
| SOURCE-YYYY-MM-DD-01 | App review | https://example.com | [name] | YYYY-MM-DD | YYYY-MM-DD HH:MM | evidence/SOURCE-YYYY-MM-DD-01.png |

### 2) Dynamic metrics rule
Counts that change (ratings, rankings, installs) must include:
- “as-of” timestamp
- “approximate” label (if not exact)

### 3) Internal corpus rule
If you cite internal research:
- Include **file path + record/row ID** (or line/entry ID).

### 4) External-source mix rule (for market/policy/competitive research)
When using external web sources in decision dossier or deep dive mode:
- minimum **8 total sources**
- minimum **4 independent/non-owned sources**
- minimum **2 counterevidence items** that could invalidate your primary read

If below thresholds, return `RED FLAG: DATA THIN` and do not present gate-grade conclusions.

⸻

## Tooling Playbook

| Goal | Preferred Tools | Notes |
|------|-----------------|-------|
| Landscape scan | `web_search`, FireCrawl | FireCrawl has weak privacy—never send PII |
| Fact verification | Browser MCP | Use for exact metrics, tables. Keep sessions short. |
| Video capture | `r.jina.ai` or transcript panels | Returns plain text for timestamps |
| Document capture | `curl` download → local parsing | Reference page numbers |

**Tool selection heuristics:**
- Start broad with search APIs; only open browser when you need page-level fidelity
- Prefer batch pulls over repeated remote calls
- Keep a running source log (tool, URL, date, credibility)
- If blocked by bot protection, **pause and request a manual capture** rather than using rehosts.
- If a listed tool is unavailable, continue with local/browser fallback and explicitly log the constraint in `Limits` or a red flag.

**Fallback mapping (portable defaults):**
- Search API unavailable → direct web queries + manual source logging
- Browser automation unavailable → manual navigation + captured URLs/screenshots
- Transcript extractors unavailable → manual timestamps/snippets from accessible transcripts
- Firecrawl/MCP unavailable → use native web fetch + local parsing and note reduced coverage

⸻

## Synthesis Patterns

- **Confidence scoring:** State priors, evidence, and remaining unknowns
- **Facts vs interpretation split:** Keep `Evidence (facts)` separate from `Interpretation (inference)` in final output.
- **Comparative tables:** Columns for evidence, resource needs, advantages, risks
- **Narrative capsules:** ≤5 sentences per option, highlighting applicability and disqualifiers
- **Experiment backlogs:** For uncertain paths, define hypothesis, signal, timeline, go/no-go

⸻

## Quality Checklist

- [ ] Decision or question restated at top of working notes
- [ ] Research Kickoff Gate completed (or explicit delta from existing lock)
- [ ] Research mode selected (`quick scan` | `decision dossier` | `deep dive`)
- [ ] Existing internal research reviewed before new searches
- [ ] Tool choices justified (discovery vs verification)
- [ ] Sources logged with URL + date + credibility tag
- [ ] Evidence Log added for non-permalink sources (with local artifact)
- [ ] Dynamic metrics labeled with retrieval timestamp
- [ ] Internal corpus citations include file path + record/row ID
- [ ] Consequential claims include claim_type + confidence + allowed_use
- [ ] Counterevidence section included (>=2 in dossier/deep-dive mode)
- [ ] Privacy guardrails respected (no PII/IP to external services)
- [ ] Interim syntheses captured (not just raw links)
- [ ] Final deliverables match project prompt structure

⸻

## Closing

Research is a means to decision, not an end in itself. The goal is to collapse uncertainty fast enough to act.

- If you're still researching after the decision is clear, you're procrastinating.
- If a harness could answer it faster, build the harness.
- More sources ≠ more confidence. Know when to stop.

⸻

## Default Deliverable Template (self-serve)

Start of deliverable:
- Research mode:
- Decision gate:
- Evidence summary (3 bullets):
- Evidence (facts):
- Interpretation (inference):
- Evidence Log (only if any non-permalink sources):
- Claim ledger (claim_type/confidence/allowed_use for consequential claims):
- Counterevidence (min 2 for dossier/deep dive):
- Implications (what changes now):
- Limits:
- Quality footer (sources_total, independent_sources, counterevidence_count, unresolved_unknowns):

If blocked, use one explicit stop state:
- `RED FLAG: DATA THIN`
- `RED FLAG: ACCESS BLOCKED`
- `RED FLAG: TIMEBOX EXPIRED`
