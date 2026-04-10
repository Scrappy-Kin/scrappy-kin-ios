import { chevronBack } from 'ionicons/icons'
import { useContext } from 'react'
import { useHistory } from 'react-router-dom'
import { NavContext } from '@ionic/react'
import type { ReactNode } from 'react'
import AppProgress from '../primitives/AppProgress'
import AppText from '../primitives/AppText'
import AppIconButton from '../primitives/AppIconButton'
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
  const history = useHistory()
  const navContext = useContext(NavContext)
  const showBack = Boolean(onBack || backHref || backDisabled)
  const showProgress =
    typeof progressCurrent === 'number' &&
    typeof progressTotal === 'number' &&
    progressTotal > 0

  function handleBack() {
    if (onBack) {
      onBack()
      return
    }

    const resolvedFallbackHref = backHref ?? '/home'
    const ionicBackTarget = navContext.routeInfo?.pushedByRoute ?? null

    if (navContext.hasIonicRouter() && ionicBackTarget) {
      navContext.goBack()
      return
    }

    if (!navContext.hasIonicRouter() && window.history.length > 1) {
      history.goBack()
      return
    }

    history.replace(resolvedFallbackHref)
  }

  return (
    <div className={`app-top-nav${sticky ? ' app-top-nav--sticky' : ''}`}>
      <div className="app-top-nav__row">
        <div className="app-top-nav__slot app-top-nav__slot--leading">
          {showBack ? (
            <AppIconButton
              icon={chevronBack}
              ariaLabel="Back"
              size="lg"
              onClick={handleBack}
              disabled={backDisabled}
            />
          ) : null}
        </div>
        <div className="app-top-nav__label-wrap">
          {label ? <AppText intent="label">{label}</AppText> : null}
        </div>
        <div className="app-top-nav__slot app-top-nav__slot--trailing">
          {action ?? null}
        </div>
      </div>
      {showProgress ? <AppProgress current={progressCurrent} total={progressTotal} /> : null}
    </div>
  )
}
