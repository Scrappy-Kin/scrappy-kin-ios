import type { ReactNode } from 'react'
import AppSurface from '../primitives/AppSurface'
import './artifact-panel.css'

type ArtifactPanelProps = {
  children: ReactNode
  padding?: 'default' | 'compact'
}

export default function ArtifactPanel({
  children,
  padding = 'default',
}: ArtifactPanelProps) {
  return (
    <AppSurface padding={padding}>
      <div className="artifact-panel__content">{children}</div>
    </AppSurface>
  )
}
