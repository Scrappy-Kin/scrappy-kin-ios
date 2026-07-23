import { IonContent, IonPage } from '@ionic/react'
import { imagesOutline } from 'ionicons/icons'
import { useEffect, useMemo, useState } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import AppButton from '../primitives/AppButton'
import AppIcon from '../primitives/AppIcon'
import AppText from '../primitives/AppText'
import './harness.css'

type ReviewState = {
  id: string
  title: string
  route: string
  description: string
  seedsLocalState?: boolean
}

const reviewStates: ReviewState[] = [
  {
    id: 'flow-intro',
    title: 'Flow: intro',
    route: '/capture/flow-intro?qa=1',
    description: 'Longform onboarding intro, trust stance, and disclosure entry points.',
    seedsLocalState: true,
  },
  {
    id: 'flow-starter-set',
    title: 'Flow: starter set',
    route: '/capture/flow-starter-set?qa=1',
    description: 'The fixed taster round that replaces onboarding broker selection.',
    seedsLocalState: true,
  },
  {
    id: 'flow-request-review',
    title: 'Flow: email review',
    route: '/capture/flow-request-review?qa=1',
    description: 'Template, inline fields, and the editable opt-out email artifact.',
    seedsLocalState: true,
  },
  {
    id: 'flow-gmail-send',
    title: 'Flow: Gmail connect',
    route: '/capture/flow-gmail-send?qa=1',
    description: 'Send-only consent explanation before Google auth.',
    seedsLocalState: true,
  },
  {
    id: 'flow-final-review',
    title: 'Flow: final review',
    route: '/capture/flow-final-review?qa=1',
    description: 'Connected Gmail, broker summary, and final send checkpoint.',
    seedsLocalState: true,
  },
  {
    id: 'flow-beat-sent',
    title: 'Flow: beat 1',
    route: '/capture/flow-beat-sent?qa=1',
    description: 'Post-send confirmation before the subscription offer.',
    seedsLocalState: true,
  },
  {
    id: 'flow-beat-subscribe',
    title: 'Flow: beat 2',
    route: '/capture/flow-beat-subscribe?qa=1',
    description: 'Subscription offer, restore path, and later dismissal.',
    seedsLocalState: true,
  },
  {
    id: 'review-batch',
    title: 'App: review round',
    route: '/capture/review-batch?qa=1',
    description: 'Post-onboarding round review and send flow from Home.',
    seedsLocalState: true,
  },
  {
    id: 'batch-size',
    title: 'App: batch size',
    route: '/capture/batch-size?qa=1',
    description: 'Choose how many opt-out emails to send in each group.',
    seedsLocalState: true,
  },
  {
    id: 'email-wording',
    title: 'App: email wording',
    route: '/capture/email-wording?qa=1',
    description: 'Standalone editor for the opt-out email wording.',
    seedsLocalState: true,
  },
  {
    id: 'sent-emails',
    title: 'App: sent emails',
    route: '/capture/sent-emails?qa=1',
    description: 'Local sent email history recorded on this device.',
    seedsLocalState: true,
  },
  {
    id: 'home-unsubscribed',
    title: 'Home: unsubscribed',
    route: '/capture/home-unsubscribed?qa=1',
    description: 'Dashboard card after the free taster when subscription is inactive.',
    seedsLocalState: true,
  },
  {
    id: 'home-subscribed',
    title: 'Home: subscribed',
    route: '/capture/home-subscribed?qa=1',
    description: 'Dashboard card after the free taster when subscription is active.',
    seedsLocalState: true,
  },
  {
    id: 'home-active-no-local-history',
    title: 'Home: active, no local history',
    route: '/capture/home-active-no-local-history?qa=1',
    description: 'Fresh install or deleted local data with active Apple subscription.',
    seedsLocalState: true,
  },
  {
    id: 'settings',
    title: 'Settings',
    route: '/capture/settings?qa=1',
    description: 'Top-level Settings entry point for profile, Gmail, subscription, privacy, diagnostics, and support.',
    seedsLocalState: true,
  },
  {
    id: 'gmail-connection',
    title: 'Settings: Gmail connection',
    route: '/capture/gmail-connection?qa=1',
    description: 'Standalone Gmail connection management screen.',
    seedsLocalState: true,
  },
  {
    id: 'settings-subscription',
    title: 'Settings: subscription',
    route: '/capture/settings-subscription?qa=1',
    description: 'Top-level subscription management with restore and Apple billing copy.',
    seedsLocalState: true,
  },
  {
    id: 'settings-profile',
    title: 'Settings: profile',
    route: '/capture/settings-profile?qa=1',
    description: 'Editable personal details used in broker opt-out emails.',
    seedsLocalState: true,
  },
  {
    id: 'settings-privacy',
    title: 'Settings: privacy',
    route: '/capture/settings-privacy?qa=1',
    description: 'On-device data and deletion controls.',
    seedsLocalState: true,
  },
  {
    id: 'settings-diagnostics',
    title: 'Settings: diagnostics',
    route: '/capture/settings-diagnostics?qa=1',
    description: 'Local diagnostics capture, export, and wipe actions.',
    seedsLocalState: true,
  },
  {
    id: 'settings-support',
    title: 'Settings: support',
    route: '/capture/settings-support?qa=1',
    description: 'Help, legal links, support email, and build metadata on one surface.',
    seedsLocalState: true,
  },
]

const legacyStateAliases: Record<string, string> = {
  'flow-data-brokers': 'flow-intro',
  'flow-privacy-terms': 'flow-intro',
}

function readRequestedState(search: string) {
  const params = new URLSearchParams(search)
  const requestedState = params.get('state')
  const resolvedStateId = requestedState ? (legacyStateAliases[requestedState] ?? requestedState) : null
  const selectedState = reviewStates.find((state) => state.id === resolvedStateId) ?? reviewStates[0]

  return {
    route: selectedState?.route ?? '/home',
    stateId: selectedState?.id ?? null,
  }
}

export default function ReviewBoard() {
  const history = useHistory()
  const location = useLocation()
  const [previewNonce, setPreviewNonce] = useState(0)
  const { route: selectedRoute, stateId: selectedStateId } = useMemo(
    () => readRequestedState(location.search),
    [location.search],
  )

  useEffect(() => {
    const requestedState = new URLSearchParams(location.search).get('state')
    if (selectedStateId && requestedState !== selectedStateId) {
      history.replace(`${location.pathname}?state=${encodeURIComponent(selectedStateId)}`)
    }
  }, [history, location.pathname, location.search, selectedStateId])

  const selectedState = useMemo(
    () => reviewStates.find((state) => state.route === selectedRoute) ?? reviewStates[0],
    [selectedRoute],
  )
  const previewUrl = useMemo(() => {
    const separator = selectedRoute.includes('?') ? '&' : '?'
    return `${selectedRoute}${separator}reviewNonce=${previewNonce}`
  }, [previewNonce, selectedRoute])
  const selectedIndex = useMemo(
    () => Math.max(0, reviewStates.findIndex((state) => state.route === selectedRoute)),
    [selectedRoute],
  )

  const handleSelectState = (route: string) => {
    setPreviewNonce((current) => current + 1)
    const selected = reviewStates.find((state) => state.route === route)
    const nextSearch = selected ? `?state=${encodeURIComponent(selected.id)}` : ''
    history.replace(`${location.pathname}${nextSearch}`)
  }

  const handleStep = (direction: -1 | 1) => {
    const nextIndex = selectedIndex + direction
    if (nextIndex < 0 || nextIndex >= reviewStates.length) return
    handleSelectState(reviewStates[nextIndex].route)
  }

  return (
    <IonPage>
      <IonContent className="app-content" fullscreen>
        <div className="review-board-shell">
          <div className="review-board-preview-shell">
            <iframe
              key={previewUrl}
              title={selectedState?.title ?? 'Review preview'}
              className="review-board-preview"
              src={previewUrl}
            />
          </div>

          <section className="review-board-footer">
            <div className="review-board-footer__summary">
              <div className="review-board-footer__summary-copy">
                <AppText intent="body" emphasis>
                  {selectedState?.title ?? 'Preview'}
                </AppText>
                <AppText intent="supporting">
                  {selectedIndex + 1} of {reviewStates.length}
                </AppText>
              </div>
              <Link
                className="review-board-footer__icon-link"
                to="/ui-harness/screenshots"
                aria-label="Open screenshot gallery"
                title="Open screenshot gallery"
              >
                <AppIcon icon={imagesOutline} size="sm" />
              </Link>
            </div>

            <div className="review-board-footer__controls">
              <label className="review-board-select">
                <span className="review-board-select__label">State</span>
                <select
                  className="review-board-select__control"
                  value={selectedRoute}
                  onChange={(event) => handleSelectState(event.target.value)}
                >
                  {reviewStates.map((state) => (
                    <option key={state.route} value={state.route}>
                      {state.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="review-board-footer__actions">
                <AppButton
                  size="sm"
                  variant="ghost"
                  disabled={selectedIndex === 0}
                  onClick={() => handleStep(-1)}
                >
                  Prev
                </AppButton>
                <AppButton
                  size="sm"
                  variant="ghost"
                  disabled={selectedIndex === reviewStates.length - 1}
                  onClick={() => handleStep(1)}
                >
                  Next
                </AppButton>
                <AppButton
                  size="sm"
                  variant="secondary"
                  onClick={() => setPreviewNonce((current) => current + 1)}
                >
                  Reload
                </AppButton>
                <a className="app-link" href={selectedRoute} target="_blank" rel="noreferrer">
                  Open full page
                </a>
              </div>
            </div>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
