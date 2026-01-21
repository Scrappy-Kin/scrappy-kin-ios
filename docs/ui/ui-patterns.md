# UI Patterns — Trust Blocks

Purpose: define compositional trust patterns built from primitives.

TL;DR
- Patterns compose primitives; they never invent styling.
- Patterns are the only place trust UX rules live.
- The harness must show every pattern state.

## Scope and relationship
- System hierarchy lives in `docs/ui/ui-system.md`.
- Token definitions live in `docs/ui/ui-tokens.md`.
- Primitive catalog lives in `docs/ui/ui-primitives.md`.

## Trust patterns

## Behavior rules
- Collapsed state must stand alone; expansion adds proof, not meaning.
- Inline disclosure first; sheets for depth only.
- No full-screen webviews for trust content.
- No tooltips for anything >1 sentence.
- No modal dialogs for trust reading (use sheets).

### InlineTrustClaim

```ts
export interface InlineTrustClaimProps {
  claim: string;
  details?: React.ReactNode;
  linkLabel?: string;
}
```

### ReadMoreSheetLink

```ts
export interface ReadMoreSheetLinkProps {
  label: string;
  sheetTitle: string;
  sheetBody: React.ReactNode;
}
```

### InspectableArtifact

```ts
export interface InspectableArtifactProps {
  title: string;
  summary?: string;
  viewLabel?: string;
  artifact: React.ReactNode;
  explanation?: React.ReactNode;
}
```

### TrustHubSection

```ts
export interface TrustHubSectionProps {
  title: string;
  items: Array<{ title: string; description?: string; onClick: () => void }>;
}
```

## Success tests
- Each pattern is visible on `/ui-harness/patterns`.
- Patterns compose App* only (no direct Ion* usage).
