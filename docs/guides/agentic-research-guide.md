<!-- 
AUTO-SYNCED FILE — DO NOT EDIT HERE.

Canonical source of truth:
- Package: @your-scope/agentic-guides
- Repo:    <FILL IN GITHUB URL LATER>

Any edits must be made in the canonical repo and propagated via the sync script.
-->

# Agentic Research Guide

## Purpose

Provide reusable guardrails so agents can run high-signal research loops with minimal drift, safe tooling practices, and decision-ready outputs. Pair this guide with project-specific prompts for context and deliverables.

⸻

## ⚡ Three Non-Negotiables

1. **Decision-first** — Start from the question the research must resolve, not "gather information"
2. **Know when to stop** — If a harness can prove it in 10 minutes, stop researching and start testing
3. **Privacy-first** — Strip PII/IP before sending to external tools; assume they're compromised

⸻

## Core Principles

- **Stage realism:** Tailor examples to operating reality (team size, budget, ARR stage). Flag aspirational exemplars and extract only transferable mechanics.
- **Evidence discipline:** Every claim links to a source (URL + access date + credibility note). Cross-verify critical facts; label anything tentative.
- **Leverage per hour:** Time is the scarcest resource. Favor workflows that batch, template, or delegate well to agentic support.

⸻

## 🔄 The Research Loop

1. **Clarify intent** – Restate the research question, decision gate, and deliverables before exploring.
2. **Audit existing knowledge** – Skim internal docs and prior findings. Only expand scope when you hit a gap.
3. **Map hypotheses** – List candidate explanations or strategies to evaluate; note priors if provided.
4. **Plan tool usage** – Choose discovery vs verification tools up front (see Tooling Playbook).
5. **Collect evidence** – Gather data in focused bursts, logging sources and quick takeaways.
6. **Synthesize early** – Summarize findings after each burst; update confidence and open questions.
7. **Know when to stop** – If your hypothesis can be validated by running code, switch to the Operating Guide. More sources won't resolve what a harness can prove.
8. **Package outputs** – Deliver concise summaries, tables, and appendices aligned with the project prompt. *(see Documentation Guide for structure)*

⸻

## Tooling Playbook

| Goal | Preferred Tools | Notes |
|------|-----------------|-------|
| Landscape scan / discovery | `web_search`, FireCrawl | FireCrawl has weak privacy terms—never send PII or unpublished IP. Default to `web_search` for sensitive topics. |
| Fact verification | Browser MCP (`browser_navigate`, `browser_snapshot`) | Use for exact metrics, tables, or confirming details. Keep sessions short. |
| Video capture | `https://r.jina.ai/https://youtube.com/...` or transcript panels | Returns plain text for timestamps and quotes. |
| Document capture | `curl` download → local parsing | Store under `market_research/.../sources/`. Reference page numbers. |

**Tool selection heuristics:**
- Start broad with search APIs; only open browser when you need page-level fidelity
- Prefer batch pulls (download once, parse locally) over repeated remote calls
- Keep a running source log (tool, URL, date, credibility)
- If a tool fails, document and fall back rather than retrying indefinitely

⸻

## Synthesis Patterns

- **Confidence scoring:** State priors, evidence, and remaining unknowns. Use project's preferred method (e.g., Bayesian update).
- **Comparative tables:** Columns for evidence, resource needs, advantages, risks, and confidence.
- **Narrative capsules:** ≤5 sentences per option, highlighting applicability and disqualifiers.
- **Experiment backlogs:** For uncertain paths, define hypothesis, signal, timeline, and go/no-go criteria.

⸻

## Quality Checklist

- [ ] Decision or question restated at top of working notes
- [ ] Existing internal research reviewed before new searches
- [ ] Tool choices justified (discovery vs verification)
- [ ] Sources logged with URL + date + credibility tag
- [ ] Privacy guardrails respected (no PII/IP to external services)
- [ ] Interim syntheses captured (not just raw links)
- [ ] Final deliverables match project prompt structure

⸻

## Closing

Research is a means to decision, not an end in itself. The goal is to collapse uncertainty fast enough to act.

- If you're still researching after the decision is clear, you're procrastinating.
- If a harness could answer it faster, build the harness.
- More sources ≠ more confidence. Know when to stop.
