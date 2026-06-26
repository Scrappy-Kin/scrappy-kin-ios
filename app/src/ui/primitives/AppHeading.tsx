import { forwardRef, type ReactNode } from 'react'
import './typography.css'

type HeadingIntent = 'hero' | 'lead' | 'section'
type HeadingLevel = 1 | 2 | 3

type AppHeadingProps = {
  intent: HeadingIntent
  level?: HeadingLevel
  id?: string
  accessibilityLabel?: string
  tabIndex?: number
  children: ReactNode
}

const headingMap: Record<HeadingIntent, { tag: 'h1' | 'h2' | 'h3'; classes: string }> = {
  hero: { tag: 'h1', classes: 't-3xl lh-3xl w-600 ls-tight text-primary' },
  lead: { tag: 'h2', classes: 't-lg lh-lg w-400 text-primary' },
  section: { tag: 'h3', classes: 't-xl lh-xl w-600 text-primary' },
}

const AppHeading = forwardRef<HTMLHeadingElement, AppHeadingProps>(function AppHeading(
  { intent, level, id, accessibilityLabel, tabIndex, children },
  ref,
) {
  const { tag, classes } = headingMap[intent]
  const Tag = level ? (`h${level}` as const) : tag
  return (
    <Tag
      id={id}
      className={`app-heading ${classes}`}
      ref={ref}
      tabIndex={tabIndex}
    >
      {accessibilityLabel ? (
        <span className="app-heading__sr-only">{accessibilityLabel}</span>
      ) : null}
      <span aria-hidden={accessibilityLabel ? 'true' : undefined}>
        {children}
      </span>
    </Tag>
  )
})

export default AppHeading
