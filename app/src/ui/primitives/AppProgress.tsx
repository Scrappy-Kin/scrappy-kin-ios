import { IonProgressBar } from '@ionic/react'
import AppText from './AppText'
import './progress.css'

type AppProgressProps = {
  current: number
  total: number
  label?: string
  tone?: 'default' | 'success'
}

export default function AppProgress({
  current,
  total,
  label,
  tone = 'default',
}: AppProgressProps) {
  const value = total > 0 ? Math.min(current / total, 1) : 0

  return (
    <div className={`app-progress app-progress--${tone}`}>
      {label ? <AppText intent="label">{label}</AppText> : null}
      <IonProgressBar value={value} />
    </div>
  )
}
