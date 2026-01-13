import {
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react'

const placeholderBrokers = [
  { id: 'mega-1', name: 'Mega Broker One', tier: 'mega' },
  { id: 'mega-2', name: 'Mega Broker Two', tier: 'mega' },
  { id: 'mid-1', name: 'Mid Broker One', tier: 'medium' },
]

export default function Brokers() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Brokers</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="page-content">
        <IonList>
          {placeholderBrokers.map((broker) => (
            <IonItem key={broker.id}>
              <IonCheckbox slot="start" />
              <IonLabel>
                <h2>{broker.name}</h2>
                <p>{broker.tier} tier</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  )
}
