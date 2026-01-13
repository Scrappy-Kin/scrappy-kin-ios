<!-- 
AUTO-SYNCED FILE — DO NOT EDIT HERE.

Canonical source of truth:
- Package: @your-scope/agentic-guides
- Repo:    <FILL IN GITHUB URL LATER>

Any edits must be made in the canonical repo and propagated via the sync script.
-->

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
- **Import depth >3 levels** (`../../../`) → Agents get lost in hierarchy
- **Dead code exists** → Confuses agents about what's actually used

### ❌ Leave Alone When:
- **It works and agents can navigate it** → Don't fix what isn't broken
- **You want to "make it more flexible"** → Flexibility = unpredictability for agents
- **You're tempted to "future-proof"** → Solve today's problems, not tomorrow's
- **It's "not following best practices"** → Agent-friendly > academically correct

⸻

## The Five Critical Tests

Before any refactor, ask:

### 1. The "Grep Test"
Can an agent find what it needs with simple search?

✅ `grep "generateResume"` → finds one clear function  
❌ `grep "generate"` → finds 15 wrapper methods and interfaces

### 2. The "Obvious Location Test" 
Is there only one obvious place to put new code?

✅ Theme changes go in `theme.ts`  
❌ Theme changes could go in `config/`, `styles/`, `theme/`, or `design-system/`

### 3. The "15-Minute Human Test"
Can a human understand the change in 15 minutes?

✅ "Moved user validation logic from controller to service"  
❌ "Implemented abstract factory pattern with dependency injection"

### 4. The "Agent Onboarding Test"
Can you explain the codebase to an agent in 3 sentences?

✅ "Generate resumes with `generateResume()`. Services are in `services/`."  
❌ "First understand the service registry, then the dependency injection container..."

### 5. The "Rollback Test"
Can you undo the change in 5 minutes?

✅ Delete a file, update 2 imports  
❌ Remove framework, update 20 files, reconfigure build system

**If any test fails → Stop and find a simpler approach.**

⸻

## What Good vs Bad Looks Like

### File Organization

✅ **Flat & Obvious:**
```
services/
├── hiring-evaluation.ts
├── keyword-analysis.ts  
└── document-generation.ts
```

❌ **Deep & Abstract:**
```
src/core/services/providers/implementations/hiring/evaluation-service-impl.ts
```

### Function Design

✅ **Specific & Predictable:**
```typescript
export function generateResume(candidateData: CandidateData): ResumeDocument
```

❌ **Generic & Flexible:**
```typescript
export function process<T>(data: T, config: ProcessConfig): ProcessResult<T>
```

### Import Patterns

✅ **Direct:**
```typescript
import { generateResume } from '../services/document-generation';
```

❌ **Indirect:**
```typescript
const service = ServiceRegistry.getInstance().get('documentGeneration');
```

⸻

## Practical Refactoring Patterns

### Pattern 1: Extract Long Functions
**When:** Function >50 lines  
**How:** Break into smaller, named functions in same file

```typescript
// Before: 80-line function
function processApplication(data: ApplicationData) { /* ... 80 lines */ }

// After: Clear, trackable steps
function processApplication(data: ApplicationData) {
  const validated = validateApplicationData(data);
  const keywords = extractKeywords(validated);
  return generateResume(validated, keywords);
}
```

### Pattern 2: Delete Dead Code
**When:** Files/functions not used anywhere  
**How:** Search for references, delete if none found

### Pattern 3: Consolidate Duplicates
**When:** Same logic in multiple places  
**How:** Extract to single location, import from there

⸻

## 🚨 Red Flags That Signal Over-Engineering

**Immediate stop signals:**
- Creating interfaces for things that will never be swapped
- Building "reusable" components for single use cases
- Adding configuration for things that never change
- Creating abstractions to "future-proof" the code
- Building frameworks when simple functions would work

**Language red flags:**
- "This will make it easier to..."
- "We need this for consistency..."
- "This follows best practices..."
- "Let's make this more flexible..."
- "We should abstract this..."

**Risk asymmetry blindness:** Treating code aesthetics as equivalent to functional reliability. Verbose code that works is cheaper than elegant code that breaks production.

⸻

## Closing Principle

**Test:** After refactoring, could you drop a fresh agent into the codebase and have it successfully complete a task in the area you just changed?

If yes → Good refactoring  
If no → Over-engineering

*(After refactoring, validate with a harness per Operating Guide)*

**Remember:** The best code is boring, obvious, and predictable. Agents (and humans) love boring code.
