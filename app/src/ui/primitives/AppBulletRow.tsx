import { checkmarkCircle } from 'ionicons/icons'
import AppIcon from './AppIcon'
import AppText from './AppText'
import './bullet-row.css'

type AppBulletRowProps = {
  label: string
  subtext?: string
  accessibilityLabel?: string
  icon?: string
  tone?: 'neutral' | 'primary' | 'danger'
}

export default function AppBulletRow({
  label,
  subtext,
  accessibilityLabel,
  icon = checkmarkCircle,
  tone = 'primary',
}: AppBulletRowProps) {
  const spokenLabel = accessibilityLabel ?? (subtext ? `${label}. ${subtext}` : label)

  return (
    <div className="app-bullet-row" aria-label={spokenLabel}>
      <AppIcon icon={icon} size="sm" tone={tone} />
      <div className="app-bullet-row__copy" aria-hidden="true">
        <AppText intent="body" emphasis>
          {label}
        </AppText>
        {subtext ? <AppText intent="supporting">{subtext}</AppText> : null}
      </div>
    </div>
  )
}
