import { useIonViewDidEnter, useIonViewWillLeave } from '@ionic/react'
import { useEffect, useState } from 'react'
import { discardReviewOpportunity, requestDashboardReview } from '../../services/reviewPrompt'

export function useDashboardReview(ready: boolean) {
  const [entered, setEntered] = useState(false)
  const [preview, setPreview] = useState(false)
  useIonViewDidEnter(() => setEntered(true))
  useIonViewWillLeave(() => {
    discardReviewOpportunity()
    setEntered(false)
    setPreview(false)
  })

  useEffect(() => {
    if (!ready || !entered) return
    let cancelled = false
    const stillReady = () => !cancelled && !document.hidden && window.location.pathname === '/home'
    // A brief idle window after Ionic entry, not a deadline on a transient success screen.
    // This is not proof that VoiceOver finished speaking; native QA remains required.
    const timer = window.setTimeout(() => {
      void requestDashboardReview(stillReady).then((result) => {
        if (stillReady() && result === 'preview') setPreview(true)
      })
    }, 2000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [entered, ready])

  return preview
}
