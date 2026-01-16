# UI Primitives

The harness is production UI shown in isolation.

## Typography utilities (MVP)
- `type-hero`
- `type-lead`
- `type-section-heading`
- `type-body`
- `type-body-strong`
- `type-caption`
- `type-caption-tight`

## Final primitive list + prop signatures (Ionic-friendly)

The goal is: screens speak only in App*, and every App* either wraps Ion* or composes other App*.

Shared types (use everywhere)

```ts
export type Tone = "neutral" | "primary" | "danger";
export type Density = "default" | "compact";
export type Size = "sm" | "md" | "lg";

export type DisclosureMode = "inline" | "sheet"; // aligns with your trust best practices
```

Primitives (App*)

1) Typography

```ts
export type TextVariant = "body" | "caption" | "label" | "muted";
export type HeadingVariant = "h1" | "h2" | "h3";

// Mapping to type utilities:
// h1 -> type-hero, h2 -> type-lead, h3 -> type-section-heading
// label -> type-caption-tight, muted -> type-caption + tone="muted"

export interface AppTextProps {
  variant?: TextVariant;
  tone?: "default" | "muted" | "danger";
  truncate?: boolean;
  children: React.ReactNode;
}

export interface AppHeadingProps {
  variant: HeadingVariant;
  children: React.ReactNode;
}
```

2) Button

```ts
export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export interface AppButtonProps {
  variant?: ButtonVariant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  children: React.ReactNode;
}
// Mapping: primary -> solid, secondary -> outline, destructive -> danger, ghost -> clear
```

3) Surface + Card (prevents “random boxes everywhere”)

```ts
export interface AppSurfaceProps {
  inset?: boolean;
  padding?: Density;
  children: React.ReactNode;
}

export interface AppCardProps {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}
```

4) List + ListRow (critical for iOS trust apps)

```ts
export interface AppListProps {
  header?: string;
  inset?: boolean;
  children: React.ReactNode;
}

export interface AppListRowProps {
  title: string;
  description?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  tone?: Tone;
  disabled?: boolean;
}
```

5) Inputs

```ts
export interface AppInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
  helpText?: string;
}

export interface AppTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
  helpText?: string;
}
```

6) Toggle (switch + label + help) — avoids misaligned switches

```ts
export interface AppToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  tone?: Tone;
}
```

7) Notice / Callout (info/warn/error)

```ts
export type NoticeVariant = "info" | "warning" | "error" | "success";

export interface AppNoticeProps {
  variant: NoticeVariant;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}
```

8) Accordion / Disclosure (inline depth)

```ts
export interface AppDisclosureProps {
  label: string;               // e.g. "Why?"
  collapsedSummary: React.ReactNode; // must stand alone
  children: React.ReactNode;
  defaultOpen?: boolean;
}
```

9) Bottom Sheet (depth only, no decisions)

```ts
export interface AppSheetProps {
  title: string;
  open: boolean;
  onDismiss: () => void;
  children: React.ReactNode; // reading only
}
```

10) Progress (stepper/progress indicator)

```ts
export interface AppProgressProps {
  current: number;
  total: number;
  label?: string;
}
```

11) Toast (thin wrapper; standard durations)

```ts
export type ToastVariant = "neutral" | "success" | "error";

export interface AppToastProps {
  open: boolean;
  onDismiss: () => void;
  variant?: ToastVariant;
  message: string;
  durationMs?: number; // default chosen centrally
}
```

12) Icon (so Ionicon usage stays consistent)

```ts
export interface AppIconProps {
  name: string;   // maps to ionicons
  size?: Size;
  tone?: Tone;
  ariaLabel?: string;
}
```

## Patterns (trust blocks)

Patterns are where your "Progressive, On-Demand Depth" system lives.

A) InlineTrustClaim (short claim + optional expansion)

```ts
export interface InlineTrustClaimProps {
  claim: string;                 // plain language, complete when collapsed
  details?: React.ReactNode;     // proof / evidence
  linkLabel?: string;            // default "Why?"
}
```

B) ReadMoreSheetLink (micro-link -> sheet)

```ts
export interface ReadMoreSheetLinkProps {
  label: string;           // "What’s this?" / "Why?"
  sheetTitle: string;
  sheetBody: React.ReactNode;
}
```

C) InspectableArtifact (template/scope/preview object view)

```ts
export interface InspectableArtifactProps {
  title: string;                   // "Email we will send"
  summary?: string;                // 1–2 lines
  viewLabel?: string;              // "View"
  artifact: React.ReactNode;        // the actual object first
  explanation?: React.ReactNode;    // secondary
}
```

D) TrustHubSection (settings/about library)

```ts
export interface TrustHubSectionProps {
  title: string;
  items: Array<{ title: string; description?: string; onClick: () => void }>;
}
```
