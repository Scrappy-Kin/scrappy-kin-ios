---
name: firecrawl-efficiency
description: Credit-aware Firecrawl workflow for search, map, scrape, crawl, extract, agent, and browser flows. Use when gathering web data and you need to minimize credits, avoid tool misuse, and keep outputs reproducible.
---

# Firecrawl Efficiency

Use this skill for Firecrawl-heavy research and extraction tasks where quality and cost control both matter.

## Activation Cues
Use this skill when requests include:
- "use firecrawl"
- "scrape", "crawl", "extract", "map", "agent", "browser sandbox"
- "research latest web info" with structured output needs
- concerns about credits, speed, retries, or flaky web workflows

## Core Rules
1. Start with the cheapest endpoint that can answer the question.
2. Separate discovery from extraction.
3. Prefer structured extraction over full-page blobs when specific fields are requested.
4. Escalate to `/agent` only after simpler routes fail.
5. Keep an explicit run log (inputs, endpoint sequence, output files, limits, errors).

## Mandatory Endpoint Router
1. Unknown sites or broad topic: start with `/search` (without scraping by default).
2. Known site, unknown page: use `/map` with `search` to find likely URLs.
3. Known URL, single page: use `/scrape`.
4. Known URL list: use batch scrape.
5. Whole section needed: use `/crawl` with strict bounds.
6. Complex multi-site synthesis or hidden pages: use `/agent` with cost cap.
7. Interaction-only content (clicks, logins, pagination): use Browser Sandbox.

## Browser Sandbox Tools (explicit)
Use these tools when Browser Sandbox is selected:
- `firecrawl_browser_create`: start a persistent browser session (CDP-backed).
- `firecrawl_browser_execute`: run `bash`/`python`/`node` in that session to open pages, click/type, and extract content.
- `firecrawl_browser_list`: inspect active sessions.
- `firecrawl_browser_delete`: close session when done.

Default browser flow:
1. Create one session.
2. Execute browser actions/extraction in that same session.
3. Keep extraction deterministic (log selectors/commands used).
4. Delete session at end.

Use Browser Sandbox for dynamic auth flows, click-driven pagination, and JS-rendered content that `/scrape` + `waitFor/actions` cannot reliably capture.

## Default Credit Guardrails
- `/search`: `limit <= 5` for first pass; avoid scrapeOptions initially.
- `/map`: `limit <= 100`; provide focused `search` query.
- `/scrape`: request only required `formats`; use JSON format for field extraction.
- `/crawl`: require `includePaths`/`excludePaths`; start with `limit <= 100`, `maxDiscoveryDepth <= 2`.
- `/agent`: set `maxCredits` explicitly; start with `spark-1-mini` unless accuracy risk demands `spark-1-pro`.
- Re-runs: use caching (`maxAge`) unless strict freshness is required.

## Async Discipline
For crawl/extract/agent jobs:
1. Start once.
2. Poll status; do not relaunch duplicate jobs while one is active.
3. If failed, diagnose cause and change input before retrying.

## Common Failure Modes and Fixes
- Schema/422 errors: validate payload shape against current endpoint docs before retry.
- Tool naming mismatch in MCP environments: trust runtime tool list over stale examples.
- Oversized payload/token issues: reduce limits, narrow paths, or switch from crawl to map+scrape.
- JS-heavy misses: add scrape `waitFor`/`actions`; escalate to Browser Sandbox when needed.
- Rate-limit bursts: batch intentionally; reduce concurrency and add backoff.

## Built-In Search vs Firecrawl
Use built-in model web search when:
- you need a quick, cited answer with minimal orchestration.

Use Firecrawl when:
- you need deterministic extraction,
- structured schema output,
- domain-constrained mapping/crawling,
- repeatable pipelines over the same sources,
- interactive pages that require browser actions.

## Output Contract
Return this structure in the final response:
- Decision gate
- Endpoint sequence used
- Parameters and limits used
- Artifacts produced
- Credits/time summary (if available)
- Facts extracted
- Inferences made
- Limitations and next best step

If blocked, return one explicit stop state:
- `RED FLAG: ACCESS BLOCKED`
- `RED FLAG: DATA THIN`
- `RED FLAG: COST CAP HIT`

## Version
Last updated: 2026-02-21
Status: locked
