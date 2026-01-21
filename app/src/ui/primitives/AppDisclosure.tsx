import { IonIcon } from '@ionic/react'
import type { ReactNode } from 'react'
import { chevronDown } from 'ionicons/icons'
import AppText from './AppText'
import './disclosure.css'

type AppDisclosureProps = {
  label: string
  collapsedSummary: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}

export default function AppDisclosure({
  label,
  collapsedSummary,
  children,
  defaultOpen = false,
}: AppDisclosureProps) {
  return (
    <details className="app-disclosure" open={defaultOpen}>
      <summary className="app-disclosure__summary">
        <div>
          <AppText intent="label">{label}</AppText>
          <AppText intent="supporting">{collapsedSummary}</AppText>
        </div>
        <IonIcon aria-hidden="true" className="app-disclosure__chevron" icon={chevronDown} />
      </summary>
      <div className="app-disclosure__content">{children}</div>
    </details>
  )
}
