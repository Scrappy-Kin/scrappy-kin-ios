import { IonModal } from '@ionic/react'
import type { ReactNode } from 'react'
import AppHeading from './AppHeading'
import './sheet.css'

type AppSheetProps = {
  title: string
  open: boolean
  onDismiss: () => void
  children: ReactNode
}

export default function AppSheet({ title, open, onDismiss, children }: AppSheetProps) {
  return (
    <IonModal
      isOpen={open}
      onDidDismiss={onDismiss}
      initialBreakpoint={0.5}
      breakpoints={[0, 0.5, 0.9]}
      className="app-sheet"
    >
      <div className="app-sheet__content">
        <AppHeading intent="section">{title}</AppHeading>
        {children}
      </div>
    </IonModal>
  )
}
