import type { ReactNode } from 'react'
import './typography.css'

type HeadingVariant = 'h1' | 'h2' | 'h3'

type AppHeadingProps = {
  variant: HeadingVariant
  children: ReactNode
}

const headingClassMap: Record<HeadingVariant, string> = {
  h1: 'type-hero',
  h2: 'type-lead',
  h3: 'type-section-heading',
}

export default function AppHeading({ variant, children }: AppHeadingProps) {
  const Tag = variant
  return <Tag className={`app-heading ${headingClassMap[variant]}`}>{children}</Tag>
}
