import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupIonicReact } from '@ionic/react'
import App from './App.tsx'
import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'
import './theme/tokens.css'
import './theme/typography.css'
import './theme/utilities.css'
import './styles/theme.css'
import './index.css'

type ScrappyBootWindow = Window & {
  __scrappyBoot?: {
    mark: (stage: string, detail?: string) => void
  }
}

function markBoot(stage: string, detail?: string) {
  if (!__BOOT_DIAGNOSTICS_ENABLED__) {
    return
  }

  ;(window as ScrappyBootWindow).__scrappyBoot?.mark(stage, detail)
}

setupIonicReact({
  swipeBackEnabled: true,
})

markBoot('main-loaded')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

markBoot('react-render-requested')
