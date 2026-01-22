import {
  IonContent,
  IonPage,
} from '@ionic/react'
import { useEffect, useMemo, useState } from 'react'
import {
  getSelectedBrokerIds,
  loadBrokers,
  setSelectedBrokerIds,
  type Broker,
} from '../services/brokerStore'
import AppHeader from '../components/AppHeader'
import AppCheckbox from '../ui/primitives/AppCheckbox'
import AppButton from '../ui/primitives/AppButton'
import AppList from '../ui/primitives/AppList'
import AppListRow from '../ui/primitives/AppListRow'
import AppText from '../ui/primitives/AppText'

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
        <AppText intent="supporting">{brokers.length} brokers available.</AppText>
        <div className="broker-actions">
          <AppButton size="sm" onClick={selectAll}>
            Select all
          </AppButton>
          <AppButton size="sm" variant="secondary" onClick={clearAll}>
            Clear
          </AppButton>
        </div>
        {TIER_ORDER.map((tier) =>
          grouped[tier].length > 0 ? (
            <AppList header={TIER_LABELS[tier]} key={tier}>
              {grouped[tier].map((broker) => (
                <AppListRow
                  key={broker.id}
                  title={broker.name}
                  description={
                    broker.childCompanies && broker.childCompanies.length > 0
                      ? `Includes: ${broker.childCompanies.join(', ')}`
                      : undefined
                  }
                  left={
                    <AppCheckbox
                      checked={selected.includes(broker.id)}
                      onChange={(checked) => toggleBroker(broker.id, checked)}
                    />
                  }
                />
              ))}
            </AppList>
          ) : null,
        )}
      </IonContent>
    </IonPage>
  )
}
