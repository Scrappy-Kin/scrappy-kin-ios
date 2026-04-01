import { close } from 'ionicons/icons'
import AppIcon from './AppIcon'
import './chip.css'

type AppChipProps = {
  label: string
  badge?: string
  onRemove?: () => void
}

export default function AppChip({ label, badge, onRemove }: AppChipProps) {
  return (
    <div className="app-chip">
      <span className="app-chip__label">{label}</span>
      {badge ? <span className="app-chip__badge">{badge}</span> : null}
      {onRemove ? (
        <button type="button" className="app-chip__remove" aria-label={`Remove ${label}`} onClick={onRemove}>
          <AppIcon icon={close} size="sm" tone="primary" />
        </button>
      ) : null}
    </div>
  )
}
