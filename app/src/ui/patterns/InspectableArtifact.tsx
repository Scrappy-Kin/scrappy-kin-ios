import type { ReactNode } from 'react'
import { useState } from 'react'
import AppButton from '../primitives/AppButton'
import AppCard from '../primitives/AppCard'
import AppSheet from '../primitives/AppSheet'
import AppText from '../primitives/AppText'
import ArtifactPanel from './ArtifactPanel'

type InspectableArtifactProps = {
  title: string
  summary?: string
  viewLabel?: string
  viewTitle?: string
  viewContent?: ReactNode
  artifact: ReactNode
  explanation?: ReactNode
}

export default function InspectableArtifact({
  title,
  summary,
  viewLabel = 'View',
  viewTitle,
  viewContent,
  artifact,
  explanation,
}: InspectableArtifactProps) {
  const [open, setOpen] = useState(false)
  const canView = Boolean(viewContent)

  return (
    <AppCard
      title={title}
      actions={
        canView ? (
          <AppButton size="sm" variant="ghost" onClick={() => setOpen(true)}>
            {viewLabel}
          </AppButton>
        ) : null
      }
    >
      {summary ? <AppText intent="supporting">{summary}</AppText> : null}
      <ArtifactPanel padding="compact">{artifact}</ArtifactPanel>
      {explanation ? <div className="app-stack">{explanation}</div> : null}
      {canView ? (
        <AppSheet
          title={viewTitle ?? title}
          open={open}
          onDismiss={() => setOpen(false)}
        >
          {viewContent}
        </AppSheet>
      ) : null}
    </AppCard>
  )
}
