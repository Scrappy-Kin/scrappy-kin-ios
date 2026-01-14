import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useEffect, useState } from 'react'
import { getSelectedBrokerIds, loadBrokers, setSelectedBrokerIds, type Broker } from '../services/brokerStore'

export default function Brokers() {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    loadBrokers().then(setBrokers)
    getSelectedBrokerIds().then(setSelected)
  }, [])

  async function toggleBroker(id: string, checked: boolean) {
    const next = checked ? [...selected, id] : selected.filter((item) => item !== id)
    setSelected(next)
    await setSelectedBrokerIds(next)
  }

  async function selectAll() {
    const ids = brokers.map((broker) => broker.id)
    setSelected(ids)
    await setSelectedBrokerIds(ids)
  }

  async function clearAll() {
    setSelected([])
    await setSelectedBrokerIds([])
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Brokers</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="page-content">
        <IonText color="medium">
          <p>{brokers.length} brokers available.</p>
        </IonText>
        <div className="broker-actions">
          <IonButton size="small" onClick={selectAll}>
            Select all
          </IonButton>
          <IonButton size="small" fill="outline" onClick={clearAll}>
            Clear
          </IonButton>
        </div>
        <IonList>
          {brokers.map((broker) => (
            <IonItem key={broker.id}>
              <IonCheckbox
                slot="start"
                checked={selected.includes(broker.id)}
                onIonChange={(event) => toggleBroker(broker.id, event.detail.checked)}
              />
              <IonLabel>
                <h2>{broker.name}</h2>
                <p>{broker.tier ?? 'unclassified'}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  )
}
