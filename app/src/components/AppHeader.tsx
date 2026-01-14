import { IonHeader, IonTitle, IonToolbar } from '@ionic/react'

type AppHeaderProps = {
  title: string
}

export default function AppHeader({ title }: AppHeaderProps) {
  return (
    <IonHeader>
      <IonToolbar className="app-header">
        <IonTitle>{title}</IonTitle>
      </IonToolbar>
    </IonHeader>
  )
}
