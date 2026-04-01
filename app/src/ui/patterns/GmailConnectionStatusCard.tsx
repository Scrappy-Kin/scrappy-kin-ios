import type { ReactNode } from 'react'
import AppList from '../primitives/AppList'
import AppListRow from '../primitives/AppListRow'

type GmailConnectionStatusCardProps = {
  connected: boolean
  connectedDescription: string
  disconnectedDescription: string
  connectedActions?: ReactNode
  disconnectedActions?: ReactNode
}

export default function GmailConnectionStatusCard({
  connected,
  connectedDescription,
  disconnectedDescription,
  connectedActions,
  disconnectedActions,
}: GmailConnectionStatusCardProps) {
  return (
    <>
      <AppList header="Connection status">
        <AppListRow
          title={connected ? 'Connected' : 'Not connected'}
          description={connected ? connectedDescription : disconnectedDescription}
          emphasis={false}
        />
      </AppList>
      {connected ? connectedActions : disconnectedActions}
    </>
  )
}
