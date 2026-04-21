import { IonContent, IonPage } from '@ionic/react'
import { useMemo, useState } from 'react'
import AppButton from '../primitives/AppButton'
import AppText from '../primitives/AppText'
import './harness.css'

type ReviewState = {
  title: string
  route: string
  description: string
  seedsLocalState?: boolean
}

const reviewStates: ReviewState[] = [
  {
    title: 'Flow: intro',
    route: '/capture/flow-intro?qa=1',
    description: 'Trust framing and the first guided setup step.',
    seedsLocalState: true,
  },
  {
    title: 'Flow: starter set',
    route: '/capture/flow-starter-set?qa=1',
    description: 'The fixed taster round that replaces onboarding broker selection.',
    seedsLocalState: true,
  },
  {
    title: 'Flow: email review',
    route: '/capture/flow-request-review?qa=1',
    description: 'Template, inline fields, and the editable opt-out email artifact.',
    seedsLocalState: true,
  },
  {
    title: 'Flow: Gmail connect',
    route: '/capture/flow-gmail-send?qa=1',
    description: 'Send-only consent explanation before Google auth.',
    seedsLocalState: true,
  },
  {
    title: 'Flow: final review',
    route: '/capture/flow-final-review?qa=1',
    description: 'Connected Gmail, broker summary, and final send checkpoint.',
    seedsLocalState: true,
  },
  {
    title: 'Flow: beat 1',
    route: '/capture/flow-beat-sent?qa=1',
    description: 'Post-send confirmation before the subscription offer.',
    seedsLocalState: true,
  },
  {
    title: 'Flow: beat 2',
    route: '/capture/flow-beat-subscribe?qa=1',
    description: 'Subscription offer, restore path, and later dismissal.',
    seedsLocalState: true,
  },
  {
    title: 'App: review batch',
    route: '/capture/review-batch?qa=1',
    description: 'Post-onboarding batch review and send flow from Home.',
    seedsLocalState: true,
  },
  {
    title: 'Home: unsubscribed',
    route: '/capture/home-unsubscribed?qa=1',
    description: 'Dashboard card after the free taster when subscription is inactive.',
    seedsLocalState: true,
  },
  {
    title: 'Home: subscribed',
    route: '/capture/home-subscribed?qa=1',
    description: 'Dashboard card after the free taster when subscription is active.',
    seedsLocalState: true,
  },
  {
    title: 'Brokers: review next batch',
    route: '/capture/brokers?qa=1',
    description: 'The same broker selector reused later from the dashboard flow.',
    seedsLocalState: true,
  },
  {
    title: 'Settings',
    route: '/capture/settings?qa=1',
    description: 'Profile, diagnostics, disconnect, and local-data controls.',
    seedsLocalState: true,
  },
  {
    title: 'Settings: subscription',
    route: '/capture/settings-subscription?qa=1',
    description: 'Top-level subscription management with restore and Apple billing copy.',
    seedsLocalState: true,
  },
]

export default function ReviewBoard() {
  const [selectedRoute, setSelectedRoute] = useState(reviewStates[0]?.route ?? '/home')
  const [previewNonce, setPreviewNonce] = useState(0)

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
    setSelectedRoute(route)
    setPreviewNonce((current) => current + 1)
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
              <AppText intent="body" emphasis>
                {selectedState?.title ?? 'Preview'}
              </AppText>
              <AppText intent="supporting">
                {selectedIndex + 1} of {reviewStates.length}
              </AppText>
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
