import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonPage,
  IonText,
} from '@ionic/react'
import { useEffect, useMemo, useState } from 'react'
import {
  getSelectedBrokerIds,
  loadBrokers,
  setSelectedBrokerIds,
  type Broker,
} from '../services/brokerStore'
import AppHeader from '../components/AppHeader'

const TIER_ORDER = ['mega', 'medium', 'small', 'other'] as const

const TIER_LABELS: Record<string, string> = {
  mega: 'Mega brokers',
  medium: 'Medium brokers',
  small: 'Small brokers',
  other: 'Other brokers',
}

export default function Brokers() {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [selected, setSelected] = useState<string[]>([])

  const grouped = useMemo(() => {
    const groups: Record<string, Broker[]> = {
      mega: [],
      medium: [],
      small: [],
      other: [],
    }
    brokers.forEach((broker) => {
      const tier =
        broker.tier && TIER_ORDER.includes(broker.tier as (typeof TIER_ORDER)[number])
          ? broker.tier
          : 'other'
      groups[tier].push(broker)
    })
    Object.values(groups).forEach((group) => group.sort((a, b) => a.name.localeCompare(b.name)))
    return groups
  }, [brokers])

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
      <AppHeader title="Brokers" />
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
          {TIER_ORDER.map((tier) =>
            grouped[tier].length > 0 ? (
              <div key={tier}>
                <IonItemDivider>{TIER_LABELS[tier]}</IonItemDivider>
                {grouped[tier].map((broker) => (
                  <IonItem key={broker.id}>
                    <IonCheckbox
                      slot="start"
                      checked={selected.includes(broker.id)}
                      onIonChange={(event) => toggleBroker(broker.id, event.detail.checked)}
                    />
                    <IonLabel>
                      <h2>{broker.name}</h2>
                      {broker.childCompanies && broker.childCompanies.length > 0 && (
                        <p>Includes: {broker.childCompanies.join(', ')}</p>
                      )}
                    </IonLabel>
                  </IonItem>
                ))}
              </div>
            ) : null,
          )}
        </IonList>
      </IonContent>
    </IonPage>
  )
}
