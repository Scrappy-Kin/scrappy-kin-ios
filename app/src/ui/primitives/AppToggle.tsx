import { IonToggle } from '@ionic/react'
import { useId } from 'react'
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
  const descriptionId = useId()

  return (
    <div className={`app-toggle${disabled ? ' app-toggle--disabled' : ''}`}>
      <div className="app-toggle__content">
        <AppText intent="body" emphasis tone={isDanger ? 'danger' : 'default'}>
          {label}
        </AppText>
        {description ? (
          <div id={descriptionId}>
            <AppText intent="supporting" tone={isDanger ? 'danger' : 'default'}>
              {description}
            </AppText>
          </div>
        ) : null}
      </div>
      <IonToggle
        checked={checked}
        disabled={disabled}
        onIonChange={(event) => onChange(event.detail.checked)}
        aria-label={label}
        aria-describedby={description ? descriptionId : undefined}
      />
    </div>
  )
}
