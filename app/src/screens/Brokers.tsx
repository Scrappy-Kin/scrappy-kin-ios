import { IonContent, IonPage } from '@ionic/react'
import { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import BrokerSelectionPanel from '../components/BrokerSelectionPanel'
import { readReturnTo } from '../services/navigation'
import { getQueue } from '../services/queueStore'
import { getTaskEditBehavior } from '../services/taskRoutes'
import {
  filterSelectableBrokers,
  getSelectedBrokerIds,
  loadBrokers,
  setSelectedBrokerIds,
  type Broker,
} from '../services/brokerStore'
import AppButton from '../ui/primitives/AppButton'
import AppHeading from '../ui/primitives/AppHeading'
import AppText from '../ui/primitives/AppText'
import AppTopNav from '../ui/patterns/AppTopNav'
import SettingsShortcut from '../ui/patterns/SettingsShortcut'

export default function Brokers() {
  const history = useHistory()
  const location = useLocation()
  const returnTo = readReturnTo(location.search)
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [failedBrokerIds, setFailedBrokerIds] = useState<string[]>([])
  const editBehavior = getTaskEditBehavior('edit_brokers_for_batch')
  const isReviewBatchContext = Boolean(returnTo && returnTo.startsWith('/review-batch'))
  const reviewBatchParentHref = (() => {
    if (!returnTo || !returnTo.startsWith('/review-batch')) return '/home'
    const [, search = ''] = returnTo.split('?')
    return readReturnTo(search ? `?${search}` : '') ?? '/home'
  })()

  useEffect(() => {
    Promise.all([loadBrokers(), getSelectedBrokerIds(), getQueue()]).then(([allBrokers, selectedIds, queue]) => {
      const selectableBrokers = filterSelectableBrokers(allBrokers, queue)
      const selectableBrokerIds = new Set(selectableBrokers.map((broker) => broker.id))
      const filteredSelectedIds = selectedIds.filter((id) => selectableBrokerIds.has(id))

      setBrokers(selectableBrokers)
      setSelected(filteredSelectedIds)
      setFailedBrokerIds(queue.filter((item) => item.status === 'failed').map((item) => item.brokerId))
      if (filteredSelectedIds.length !== selectedIds.length) {
        void setSelectedBrokerIds(filteredSelectedIds)
      }
    })
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
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav
            backHref={selected.length === 0 && isReviewBatchContext ? reviewBatchParentHref : returnTo ?? '/home'}
            onBack={
              selected.length === 0 && isReviewBatchContext
                ? () => history.replace(reviewBatchParentHref)
                : undefined
            }
            action={<SettingsShortcut />}
          />
          <AppHeading intent="section">Brokers</AppHeading>
          {returnTo && editBehavior === 'autosave' ? (
            <AppText intent="supporting">Changes save automatically.</AppText>
          ) : null}
          <BrokerSelectionPanel
            brokers={brokers}
            selectedIds={selected}
            failedBrokerIds={failedBrokerIds}
            onToggle={toggleBroker}
            onSelectAll={selectAll}
            onClearAll={clearAll}
          />
          {isReviewBatchContext ? (
            <AppButton
              fullWidth
              disabled={selected.length === 0}
              onClick={() => history.push(returnTo!)}
            >
              Review email
            </AppButton>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  )
}
