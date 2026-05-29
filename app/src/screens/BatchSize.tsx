import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import {
  DEFAULT_ROUND_SIZE,
  filterSelectableBrokers,
  getSelectedBrokerIds,
  getSelectedRoundSize,
  getSentBrokerIds,
  loadBrokers,
  setSelectedBrokerIds,
  setSelectedRoundSize,
  type Broker,
} from '../services/brokerStore'
import { readReturnTo } from '../services/navigation'
import { getQueue } from '../services/queueStore'
import AppButton from '../ui/primitives/AppButton'
import AppHeading from '../ui/primitives/AppHeading'
import AppText from '../ui/primitives/AppText'
import AppTopNav from '../ui/patterns/AppTopNav'
import './batch-size.css'

type RoundSizeOptionId = 'quiet' | 'steady' | 'fast' | 'all'

type RoundSizeOption = {
  id: RoundSizeOptionId
  label: string
  size: number
  description: string
}

function getGroupCount(remainingCount: number, groupSize: number) {
  if (remainingCount <= 0) return 0
  return Math.ceil(remainingCount / groupSize)
}

function formatGroupCount(count: number) {
  return `${count} ${count === 1 ? 'group' : 'groups'}`
}

function buildOptions(remainingCount: number): RoundSizeOption[] {
  const quietGroupCount = getGroupCount(remainingCount, 3)
  const steadyGroupCount = getGroupCount(remainingCount, DEFAULT_ROUND_SIZE)
  const fastGroupCount = getGroupCount(remainingCount, 10)
  const allAtOnceCount = remainingCount

  return [
    {
      id: 'quiet',
      label: 'Quiet',
      size: Math.min(3, remainingCount),
      description: `Up to 3 emails at a time. ${formatGroupCount(quietGroupCount)} to finish.`,
    },
    {
      id: 'steady',
      label: 'Steady',
      size: Math.min(DEFAULT_ROUND_SIZE, remainingCount),
      description: `Up to ${DEFAULT_ROUND_SIZE} emails at a time. ${formatGroupCount(steadyGroupCount)} to finish.`,
    },
    {
      id: 'fast',
      label: 'Fast',
      size: Math.min(10, remainingCount),
      description: `Up to 10 emails at a time. ${formatGroupCount(fastGroupCount)} to finish.`,
    },
    {
      id: 'all',
      label: 'All at once',
      size: allAtOnceCount,
      description: `Send all ${allAtOnceCount} emails in one group.`,
    },
  ]
}

function resolveInitialOptionId(selectedCount: number, remainingCount: number): RoundSizeOptionId {
  if (selectedCount <= 0) return 'steady'
  if (selectedCount >= remainingCount) return 'all'
  if (selectedCount <= 3) return 'quiet'
  if (selectedCount <= DEFAULT_ROUND_SIZE) return 'steady'
  return 'fast'
}

function RoundSizeOptionButton({
  option,
  selected,
  onSelect,
}: {
  option: RoundSizeOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`batch-size-option ${selected ? 'batch-size-option--selected' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <AppText intent="body" emphasis className="batch-size-option__label">
        {option.label}
      </AppText>
      <AppText intent="body" className="batch-size-option__description">
        {option.description}
      </AppText>
    </button>
  )
}

export default function BatchSize() {
  const history = useHistory()
  const location = useLocation()
  const returnTo = readReturnTo(location.search) ?? '/review-batch'
  const [isReady, setIsReady] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [remainingBrokers, setRemainingBrokers] = useState<Broker[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<RoundSizeOptionId>('steady')

  async function refreshState() {
    const [brokers, queue, selectedBrokerIds, selectedRoundSize] = await Promise.all([
      loadBrokers(),
      getQueue(),
      getSelectedBrokerIds(),
      getSelectedRoundSize(),
    ])
    const nextRemainingBrokers = filterSelectableBrokers(brokers, queue)
    const selectableIds = new Set(nextRemainingBrokers.map((broker) => broker.id))
    const selectedCount = selectedBrokerIds.filter((id) => selectableIds.has(id)).length

    setSentCount(getSentBrokerIds(queue).length)
    setRemainingBrokers(nextRemainingBrokers)
    setSelectedOptionId(
      resolveInitialOptionId(
        selectedCount > 0 && selectedCount !== nextRemainingBrokers.length
          ? selectedCount
          : selectedRoundSize,
        nextRemainingBrokers.length,
      ),
    )
    setIsReady(true)
  }

  useIonViewWillEnter(() => {
    setIsReady(false)
    void refreshState()
  })

  const remainingCount = remainingBrokers.length
  const options = buildOptions(remainingCount)
  const selectedOption = options.find((option) => option.id === selectedOptionId) ?? options[1]

  async function handleSave() {
    const nextSelectedIds = remainingBrokers
      .slice(0, selectedOption.size)
      .map((broker) => broker.id)
    await Promise.all([
      setSelectedBrokerIds(nextSelectedIds),
      setSelectedRoundSize(selectedOption.size),
    ])
    history.replace(returnTo)
  }

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav backHref={returnTo} />
          <AppHeading intent="section" level={1}>
            Choose how many emails to send at a time.
          </AppHeading>
          {isReady ? (
            <section className="app-section-shell">
              <div
                className="batch-size-counts"
                role="text"
                aria-label={`${sentCount} sent, ${remainingCount} remaining`}
              >
                <div className="batch-size-counts__numbers" aria-hidden="true">
                  <strong>{sentCount}</strong>
                  <span className="batch-size-counts__divider">/</span>
                  <strong>{remainingCount}</strong>
                </div>
                <div className="batch-size-counts__labels" aria-hidden="true">
                  <AppText intent="body">Sent</AppText>
                  <span />
                  <AppText intent="body">Remaining</AppText>
                </div>
              </div>
              <AppText intent="body">
                Most data brokers reply within a few days. Sending fewer emails at a time can make
                their replies easier to manage.
              </AppText>
              <AppText intent="body">
                Go smaller for a quieter inbox, or larger to move faster.
              </AppText>
              <section className="app-card batch-size-picker" aria-label="Round size options">
                {options.map((option) => (
                  <RoundSizeOptionButton
                    key={option.id}
                    option={option}
                    selected={option.id === selectedOptionId}
                    onSelect={() => setSelectedOptionId(option.id)}
                  />
                ))}
              </section>
              <AppButton fullWidth onClick={handleSave} disabled={remainingCount === 0}>
                Save
              </AppButton>
            </section>
          ) : null}
          {!isReady ? (
            <section className="app-section-shell">
              <AppText intent="supporting">Loading round options...</AppText>
            </section>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  )
}
