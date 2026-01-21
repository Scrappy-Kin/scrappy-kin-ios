# UI Primitives — App* Catalog

Purpose: define the primitive components and their intent-driven props.

TL;DR
- Screens speak only in App*.
- Primitives own intent; utilities stay descriptive.
- Every primitive state is visible in the harness.

## Scope and relationship
- Token definitions live in `docs/ui/ui-tokens.md`.
- System hierarchy lives in `docs/ui/ui-system.md`.
- Pattern catalog lives in `docs/ui/ui-patterns.md`.

## Shared types

```ts
export type Tone = "neutral" | "primary" | "danger";
export type Density = "default" | "compact";
export type Size = "sm" | "md" | "lg";
```

## Primitives

### Typography

```ts
export type TextIntent = "body" | "supporting" | "caption" | "label";
export type HeadingIntent = "hero" | "lead" | "section";

export interface AppTextProps {
  intent?: TextIntent;
  emphasis?: boolean;
  tone?: "default" | "danger";
  truncate?: boolean;
  children: React.ReactNode;
}

export interface AppHeadingProps {
  intent: HeadingIntent;
  children: React.ReactNode;
}
```

### Button

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

### Surface + Card

```ts
export interface AppSurfaceProps {
  padding?: Density;
  children: React.ReactNode;
}

export interface AppCardProps {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}
```

### List + ListRow

```ts
export interface AppListProps {
  header?: string;
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

### Inputs

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

### Toggle

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

### Notice / Callout

```ts
export type NoticeVariant = "info" | "warning" | "error" | "success";

export interface AppNoticeProps {
  variant: NoticeVariant;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}
```

### Disclosure

```ts
export interface AppDisclosureProps {
  label: string;
  collapsedSummary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}
```

### Bottom Sheet

```ts
export interface AppSheetProps {
  title: string;
  open: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}
```

### Progress

```ts
export interface AppProgressProps {
  current: number;
  total: number;
  label?: string;
}
```

### Toast

```ts
export type ToastVariant = "neutral" | "success" | "error";

export interface AppToastProps {
  open: boolean;
  onDismiss: () => void;
  variant?: ToastVariant;
  message: string;
  durationMs?: number;
}
```

### Icon

```ts
export interface AppIconProps {
  icon: string;
  size?: Size;
  tone?: Tone;
  ariaLabel?: string;
}
```
