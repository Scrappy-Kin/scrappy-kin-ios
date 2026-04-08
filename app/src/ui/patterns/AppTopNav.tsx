import type { ReactNode } from 'react'
import AppProgress from '../primitives/AppProgress'
import AppText from '../primitives/AppText'
import BackNavigationButton from './BackNavigationButton'
import './app-top-nav.css'

type AppTopNavProps = {
  backHref?: string | null
  onBack?: () => void
  backDisabled?: boolean
  label?: string
  action?: ReactNode
  progressCurrent?: number
  progressTotal?: number
  sticky?: boolean
}

export default function AppTopNav({
  backHref,
  onBack,
  backDisabled = false,
  label,
  action,
  progressCurrent,
  progressTotal,
  sticky = false,
}: AppTopNavProps) {
  const showBack = Boolean(onBack || backHref || backDisabled)
  const showProgress =
    typeof progressCurrent === 'number' &&
    typeof progressTotal === 'number' &&
    progressTotal > 0

  return (
    <div className={`app-top-nav${sticky ? ' app-top-nav--sticky' : ''}`}>
      <div className="app-top-nav__row">
        {showBack ? (
          <BackNavigationButton
            fallbackHref={backHref}
            onBack={onBack}
            disabled={backDisabled}
          />
        ) : (
          <span />
        )}
        {label ? <AppText intent="label">{label}</AppText> : null}
        {action ?? <span />}
      </div>
      {showProgress ? <AppProgress current={progressCurrent} total={progressTotal} /> : null}
    </div>
  )
}
