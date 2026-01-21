import { IonToggle } from '@ionic/react'
import AppText from './AppText'
import './toggle.css'

type AppToggleProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
  disabled?: boolean
  tone?: 'neutral' | 'primary' | 'danger'
}

export default function AppToggle({
  label,
  checked,
  onChange,
  description,
  disabled = false,
  tone = 'neutral',
}: AppToggleProps) {
  const isDanger = tone === 'danger'

  return (
    <div className={`app-toggle${disabled ? ' app-toggle--disabled' : ''}`}>
      <div className="app-toggle__content">
        <AppText intent="body" emphasis tone={isDanger ? 'danger' : 'default'}>
          {label}
        </AppText>
        {description ? (
          <AppText intent="supporting" tone={isDanger ? 'danger' : 'default'}>
            {description}
          </AppText>
        ) : null}
      </div>
      <IonToggle
        checked={checked}
        disabled={disabled}
        onIonChange={(event) => onChange(event.detail.checked)}
      />
    </div>
  )
}
