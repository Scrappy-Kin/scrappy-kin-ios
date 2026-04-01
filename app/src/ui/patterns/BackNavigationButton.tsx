import { chevronBack } from 'ionicons/icons'
import { useContext } from 'react'
import { useHistory } from 'react-router-dom'
import { NavContext } from '@ionic/react'
import AppIconButton from '../primitives/AppIconButton'

type BackNavigationButtonProps = {
  fallbackHref?: string | null
  onBack?: () => void
  disabled?: boolean
}

export default function BackNavigationButton({
  fallbackHref = '/home',
  onBack,
  disabled = false,
}: BackNavigationButtonProps) {
  const history = useHistory()
  const navContext = useContext(NavContext)
  const resolvedFallbackHref = fallbackHref ?? '/home'

  function handleBack() {
    if (onBack) {
      onBack()
      return
    }

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
    <AppIconButton
      icon={chevronBack}
      ariaLabel="Back"
      size="lg"
      onClick={handleBack}
      disabled={disabled}
    />
  )
}
