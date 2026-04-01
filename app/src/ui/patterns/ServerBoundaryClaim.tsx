import { useState } from 'react'
import { IonIcon } from '@ionic/react'
import { shieldCheckmarkOutline } from 'ionicons/icons'
import AppSheet from '../primitives/AppSheet'
import AppText from '../primitives/AppText'
import './server-boundary-claim.css'

type ServerBoundaryClaimProps = {
  claim?: string
  learnMoreLabel?: string
  learnMoreTitle?: string
  learnMoreBody?: React.ReactNode
}

const defaultClaim = 'Requests go from your Gmail account, not through Scrappy Kin servers.'

export default function ServerBoundaryClaim({
  claim = defaultClaim,
  learnMoreLabel,
  learnMoreTitle,
  learnMoreBody,
}: ServerBoundaryClaimProps) {
  const [open, setOpen] = useState(false)
  const showLearnMore = Boolean(learnMoreLabel && learnMoreTitle && learnMoreBody)

  return (
    <>
      <div className="server-boundary-claim" role="note">
        <IonIcon
          aria-hidden="true"
          className="server-boundary-claim__icon"
          icon={shieldCheckmarkOutline}
        />
        <div className="server-boundary-claim__copy">
          <AppText intent="supporting">{claim}</AppText>
          {showLearnMore ? (
            <button
              type="button"
              className="server-boundary-claim__link"
              onClick={() => setOpen(true)}
            >
              {learnMoreLabel}
            </button>
          ) : null}
        </div>
      </div>
      {showLearnMore ? (
        <AppSheet title={learnMoreTitle!} open={open} onDismiss={() => setOpen(false)}>
          {learnMoreBody}
        </AppSheet>
      ) : null}
    </>
  )
}
