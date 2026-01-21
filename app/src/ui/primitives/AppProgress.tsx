import { IonProgressBar } from '@ionic/react'
import AppText from './AppText'
import './progress.css'

type AppProgressProps = {
  current: number
  total: number
  label?: string
}

export default function AppProgress({ current, total, label }: AppProgressProps) {
  const value = total > 0 ? Math.min(current / total, 1) : 0

  return (
    <div className="app-progress">
      {label ? <AppText intent="label">{label}</AppText> : null}
      <IonProgressBar value={value} />
    </div>
  )
}
