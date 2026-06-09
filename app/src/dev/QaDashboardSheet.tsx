import { useSyncExternalStore } from 'react'
import AppList from '../ui/primitives/AppList'
import AppListRow from '../ui/primitives/AppListRow'
import AppSheet from '../ui/primitives/AppSheet'
import {
  getQaOverride,
  setQaOverride,
  subscribeQaOverride,
} from '../services/qaOverrideStore'
import type { DashboardStateId } from '../services/roundState'

type QaDashboardSheetProps = {
  open: boolean
  onDismiss: () => void
}

type Preset = {
  id: DashboardStateId | null
  label: string
  description: string
}

const PRESETS: Preset[] = [
  {
    id: null,
    label: 'Real state',
    description: 'Derive from actual device data.',
  },
  {
    id: 'free_remaining_locked',
    label: 'Free remaining locked',
    description: 'Free round done; paid brokers locked behind subscription.',
  },
  {
    id: 'active_no_local_history',
    label: 'Active, no local history',
    description: 'Subscription restored after local app history is gone.',
  },
  {
    id: 'all_caught_up',
    label: 'All caught up',
    description: 'Active access, nothing to send, show cooldown date.',
  },
  {
    id: 'next_round_ready',
    label: 'Next round ready',
    description: 'Active access, eligible brokers available.',
  },
  {
    id: 'gmail_disconnected',
    label: 'Gmail disconnected',
    description: 'Active subscription but Gmail not connected.',
  },
  {
    id: 'entitlement_expired',
    label: 'Entitlement expired / locked',
    description: 'No active entitlement.',
  },
]

export default function QaDashboardSheet({ open, onDismiss }: QaDashboardSheetProps) {
  const activeOverride = useSyncExternalStore(subscribeQaOverride, getQaOverride, getQaOverride)

  function handleSelect(id: DashboardStateId | null) {
    setQaOverride(id)
    onDismiss()
  }

  return (
    <AppSheet title="Dashboard state presets" open={open} onDismiss={onDismiss}>
      <AppList header="Select a preset">
        {PRESETS.map((preset) => (
          <AppListRow
            key={preset.id ?? '__real__'}
            title={preset.label}
            description={preset.description}
            right={activeOverride === preset.id ? <span>✓</span> : undefined}
            onClick={() => handleSelect(preset.id)}
          />
        ))}
      </AppList>
    </AppSheet>
  )
}
