import type { ReactNode } from 'react'
import './typography.css'

type HeadingIntent = 'hero' | 'lead' | 'section'

type AppHeadingProps = {
  intent: HeadingIntent
  children: ReactNode
}

const headingMap: Record<HeadingIntent, { tag: 'h1' | 'h2' | 'h3'; classes: string }> = {
  hero: { tag: 'h1', classes: 't-3xl lh-3xl w-600 ls-tight text-primary' },
  lead: { tag: 'h2', classes: 't-lg lh-lg w-400 text-primary' },
  section: { tag: 'h3', classes: 't-xl lh-xl w-600 text-primary' },
}

export default function AppHeading({ intent, children }: AppHeadingProps) {
  const { tag: Tag, classes } = headingMap[intent]
  return <Tag className={`app-heading ${classes}`}>{children}</Tag>
}
