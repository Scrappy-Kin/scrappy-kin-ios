import { IonCheckbox } from '@ionic/react'
import './checkbox.css'

type AppCheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export default function AppCheckbox({ checked, onChange, disabled = false }: AppCheckboxProps) {
  return (
    <IonCheckbox
      className="app-checkbox"
      checked={checked}
      disabled={disabled}
      onIonChange={(event) => onChange(event.detail.checked)}
    />
  )
}
