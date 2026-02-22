---
name: refactoring
description: When and how to refactor code for agent-friendliness. Core rule - subtract complexity, don't add helpful systems.
---

# Agentic Refactoring Guide

## Core Principle

**Good refactoring for AI agents = SUBTRACTION of complexity, not addition of "helpful" systems.**

Agents get lost in complex codebases, but the solution isn't building frameworks—it's making code **boring and predictable**.

> **The Meta-Rule:** If your refactoring makes the code harder for a new agent to understand, you're going in the wrong direction.

⸻

## ⚡ Three Non-Negotiables

1. **Subtract, don't add** — Remove complexity, don't build "helpful" systems
2. **Grep-friendly** — Can an agent find it with simple search?
3. **One obvious location** — No ambiguity about where code belongs

⸻

## When to Refactor vs When to Leave Alone

### ✅ Refactor When:
- **Functions >50 lines** → Agents lose context
- **Files >500 lines** → Too much to scan at once  
- **Duplicate code exists** → Agents update one copy, miss others
- **File names don't match contents** → Agents look in wrong places
- **Import depth >3 levels** → Agents get lost in hierarchy
- **Dead code exists** → Confuses agents about what's actually used

### ❌ Leave Alone When:
- **It works and agents can navigate it** → Don't fix what isn't broken
- **You want to "make it more flexible"** → Flexibility = unpredictability
- **You're tempted to "future-proof"** → Solve today's problems
- **It's "not following best practices"** → Agent-friendly > academically correct

⸻

## The Five Critical Tests

Before any refactor, ask:

### 1. The "Grep Test"
Can an agent find what it needs with simple search?

✅ `grep "generateResume"` → finds one clear function  
❌ `grep "generate"` → finds 15 wrapper methods

### 2. The "Obvious Location Test" 
Is there only one obvious place to put new code?

✅ Theme changes go in `theme.ts`  
❌ Theme changes could go in `config/`, `styles/`, `theme/`, or `design-system/`

### 3. The "15-Minute Human Test"
Can a human understand the change in 15 minutes?

### 4. The "Agent Onboarding Test"
Can you explain the codebase to an agent in 3 sentences?

### 5. The "Rollback Test"
Can you undo the change in 5 minutes?

**If any test fails → Stop and find a simpler approach.**

⸻

## What Good vs Bad Looks Like

**File Organization:**
- ✅ Flat & obvious: `services/hiring-evaluation.ts`
- ❌ Deep & abstract: `src/core/services/providers/implementations/hiring/evaluation-service-impl.ts`

**Function Design:**
- ✅ Specific: `generateResume(candidateData: CandidateData): ResumeDocument`
- ❌ Generic: `process<T>(data: T, config: ProcessConfig): ProcessResult<T>`

⸻

## 🚨 Red Flags That Signal Over-Engineering

**Immediate stop signals:**
- Creating interfaces for things that will never be swapped
- Building "reusable" components for single use cases
- Adding configuration for things that never change
- Creating abstractions to "future-proof" the code

**Language red flags:**
- "This will make it easier to..."
- "We need this for consistency..."
- "Let's make this more flexible..."

⸻

## 🗑️ Delete Deprecated Code — Don't Archive It

**Dead code must be deleted, not commented out or moved to an archive folder.**

Git is your archive. That's what version control is for. Keeping deprecated code around:
- Confuses agents about what's actually in use
- Creates false positives in grep searches
- Adds cognitive load when navigating
- Tempts future developers to resurrect bad patterns

**Before deleting, verify:**
1. Grep for references across the codebase
2. Check if it's imported/called anywhere
3. Run tests to confirm nothing breaks
4. If uncertain, ask — but bias toward deletion

**Don't be cavalier** — make sure it's truly unused. But once confirmed, delete without guilt.

**Anti-pattern:** "Let's keep this around just in case" → No. Git keeps it around. Delete it from HEAD.

⸻

## Closing Principle

**Test:** After refactoring, could you drop a fresh agent into the codebase and have it successfully complete a task in the area you just changed?

If yes → Good refactoring  
If no → Over-engineering

**Remember:** The best code is boring, obvious, and predictable.
