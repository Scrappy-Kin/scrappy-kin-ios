import type { ReactNode } from 'react'
import './surface.css'

type SurfacePadding = 'default' | 'compact'

type AppSurfaceProps = {
  padding?: SurfacePadding
  children: ReactNode
}

export default function AppSurface({ padding = 'default', children }: AppSurfaceProps) {
  const classes = ['app-surface', padding === 'compact' ? 'app-surface--compact' : null]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}
