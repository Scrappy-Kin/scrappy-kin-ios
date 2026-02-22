---
name: health-check
description: On-demand code health audit. Run when codebase smells, fix what fits in your time budget, move on without guilt.
---

# Project Health Check Protocol

On-demand code health audit. Run when it smells, fix what fits, move on.

⸻

## ⚡ Worth It? (30-second sniff test)

Before diving in, ask:
- Has it been >2 weeks since last check AND code has changed significantly?
- Are you hitting friction in normal work (slow, confusing, fragile)?
- Do you have ≥30 min of focused time?

**If any answer is "no" → skip it, go do a hobby project.**

⸻

## 🔄 The Check Loop

### 1. Automated Scans (5 min)

Run these, note anything flagged:

```bash
npm run lint              # style/errors
npm audit                 # security  
npx madge --circular src/ # circular deps
npx depcheck              # unused deps
```

Don't fix yet—just collect signals.

### 2. Discovery Prompts (10 min)

Surface issues from multiple angles:

- **1-3 low-hanging fruit** — quick wins, <15 min each
- **1-2 medium effort / high impact** — worth a focused session
- **1-3 high-risk areas** — tech debt, security, fragility
- **1-2 surprising observations** — things that don't fit the pattern

Also check against Refactoring Guide criteria:
- Files >500 lines?
- Functions >50 lines?
- Import depth >3 levels?
- Dead code lingering?
- Magic numbers or hardcoded values?

### 3. Rank by Impact ÷ Effort (5 min)

Simple scoring:

| Issue | Impact (1-3) | Effort (1-3) | Score (I÷E) |
|-------|--------------|--------------|-------------|
| Example: extract 80-line function | 2 | 1 | 2.0 |
| Example: refactor auth flow | 3 | 3 | 1.0 |

Sort by score descending. High impact + low effort = do first.

### 4. Execute Top X (remaining time)

Pick top items that fit your time budget. Fix them using Operating Guide loop:

1. Build a harness
2. Validate the fix
3. Apply minimal change *(structural? see Refactoring Guide)*
4. Delete temp work
5. Done

**No backlog.** If you didn't finish it, it wasn't worth finishing today.

⸻

## Closing

This is weeding, not landscaping. 

- Run when it smells
- Fix what fits in the time you have
- Move on without guilt

The goal isn't a perfect codebase—it's a codebase that doesn't slow you down.
