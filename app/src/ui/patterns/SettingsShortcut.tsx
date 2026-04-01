import { settingsOutline } from 'ionicons/icons'
import { useHistory, useLocation } from 'react-router-dom'
import { buildSettingsHref, getCurrentRoute } from '../../services/navigation'
import AppIconButton from '../primitives/AppIconButton'

type SettingsShortcutProps = {
  ghost?: boolean
}

export default function SettingsShortcut({ ghost = true }: SettingsShortcutProps) {
  const history = useHistory()
  const location = useLocation()

  return (
    <AppIconButton
      icon={settingsOutline}
      ariaLabel="Settings"
      size="md"
      variant={ghost ? 'ghost' : 'outline'}
      onClick={() => history.push(buildSettingsHref(undefined, getCurrentRoute(location)))}
    />
  )
}
