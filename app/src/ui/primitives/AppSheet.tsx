import { IonModal } from '@ionic/react'
import { useId, type ReactNode } from 'react'
import AppHeading from './AppHeading'
import './sheet.css'

type AppSheetProps = {
  title: string
  open: boolean
  onDismiss: () => void
  children: ReactNode
}

export default function AppSheet({ title, open, onDismiss, children }: AppSheetProps) {
  const titleId = useId()

  return (
    <IonModal
      isOpen={open}
      onDidDismiss={onDismiss}
      aria-labelledby={titleId}
      initialBreakpoint={0.5}
      breakpoints={[0, 0.5, 0.9]}
      handle={false}
      className="app-sheet"
    >
      <div className="app-sheet__content">
        <AppHeading intent="section" id={titleId}>{title}</AppHeading>
        {children}
      </div>
    </IonModal>
  )
}
