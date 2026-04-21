import { checkmarkCircle } from 'ionicons/icons'
import AppIcon from './AppIcon'
import AppText from './AppText'
import './bullet-row.css'

type AppBulletRowProps = {
  label: string
  subtext?: string
}

export default function AppBulletRow({ label, subtext }: AppBulletRowProps) {
  return (
    <div className="app-bullet-row">
      <AppIcon icon={checkmarkCircle} size="sm" tone="primary" ariaLabel="Included" />
      <div className="app-bullet-row__copy">
        <AppText intent="body" emphasis>
          {label}
        </AppText>
        {subtext ? <AppText intent="supporting">{subtext}</AppText> : null}
      </div>
    </div>
  )
}
