import type { ReactNode } from 'react'
import { add } from 'ionicons/icons'
import { getBrokerDescription, type Broker } from '../services/brokerStore'
import AppChip from '../ui/primitives/AppChip'
import AppIcon from '../ui/primitives/AppIcon'
import AppText from '../ui/primitives/AppText'
import './broker-selection-panel.css'

const TIER_ORDER = ['mega', 'medium', 'small', 'other'] as const

const TIER_LABELS: Record<string, string> = {
  mega: 'Mega brokers',
  medium: 'Medium brokers',
  small: 'Small brokers',
  other: 'Other brokers',
}

type BrokerSelectionPanelProps = {
  brokers: Broker[]
  selectedIds: string[]
  failedBrokerIds?: string[]
  onToggle: (id: string, checked: boolean) => void | Promise<void>
  onSelectAll: () => void | Promise<void>
  onClearAll: () => void | Promise<void>
  context?: ReactNode
}

export default function BrokerSelectionPanel({
  brokers,
  selectedIds,
  failedBrokerIds = [],
  onToggle,
  onSelectAll,
  onClearAll,
  context,
}: BrokerSelectionPanelProps) {
  const grouped: Record<string, Broker[]> = {
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
    grouped[tier].push(broker)
  })

  Object.values(grouped).forEach((group) => group.sort((a, b) => a.name.localeCompare(b.name)))

  const failedSet = new Set(failedBrokerIds)
  const selectedBrokers = brokers.filter((broker) => selectedIds.includes(broker.id))
  const allSelected = brokers.length > 0 && selectedBrokers.length === brokers.length
  const availableGroups = Object.fromEntries(
    Object.entries(grouped).map(([tier, tierBrokers]) => [
      tier,
      tierBrokers.filter((broker) => !selectedIds.includes(broker.id)),
    ]),
  ) as Record<string, Broker[]>

  return (
    <section className="app-section-shell">
      {context}

      <section className="broker-selection broker-selection--selected">
        <div className="broker-selection__header">
          <AppText intent="body" emphasis>
            Selected ({selectedBrokers.length})
          </AppText>
          {selectedBrokers.length > 0 ? (
            <button
              type="button"
              className="broker-selection__link broker-selection__link--inverse"
              onClick={() => void onClearAll()}
            >
              Clear all
            </button>
          ) : null}
        </div>

        {selectedBrokers.length === 0 ? (
          <AppText intent="supporting">No brokers selected yet. Tap below to add.</AppText>
        ) : (
          <div className="broker-selection__chips">
            {selectedBrokers.map((broker) => (
              <AppChip
                key={broker.id}
                label={broker.name}
                badge={failedSet.has(broker.id) ? 'Retry' : undefined}
                onRemove={() => void onToggle(broker.id, false)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="broker-selection__available">
        <div className="broker-selection__available-header">
          <AppText intent="label">Available brokers</AppText>
          {selectedBrokers.length < brokers.length ? (
            <button
              type="button"
              className="broker-selection__link"
              onClick={() => void onSelectAll()}
            >
              Select all
            </button>
          ) : null}
        </div>

        {allSelected ? (
          <AppText intent="supporting">All brokers selected.</AppText>
        ) : null}

        {TIER_ORDER.map((tier) =>
          availableGroups[tier].length > 0 ? (
            <section className="broker-selection__group" key={tier}>
              <AppText intent="label">{TIER_LABELS[tier]}</AppText>
              <div className="broker-selection__group-list">
                {availableGroups[tier].map((broker) => (
                  <button
                    key={broker.id}
                    type="button"
                    className="broker-selection__card"
                    onClick={() => void onToggle(broker.id, true)}
                  >
                    <span className="broker-selection__add">
                      <AppIcon icon={add} size="md" tone="primary" />
                    </span>
                    <span className="broker-selection__content">
                      <span className="broker-selection__title-row">
                        <AppText intent="body" emphasis>
                          {broker.name}
                        </AppText>
                        {failedSet.has(broker.id) ? (
                          <span className="broker-selection__badge">Retry</span>
                        ) : null}
                      </span>
                      {getBrokerDescription(broker) ? (
                        <AppText intent="supporting">{getBrokerDescription(broker)}</AppText>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null,
        )}
      </section>
    </section>
  )
}
