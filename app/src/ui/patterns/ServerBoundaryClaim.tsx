import { IonIcon } from '@ionic/react'
import { shieldCheckmarkOutline } from 'ionicons/icons'
import AppText from '../primitives/AppText'
import './server-boundary-claim.css'

type ServerBoundaryClaimProps = {
  claim?: string
}

const defaultClaim = 'Requests go from your Gmail account, not through Scrappy Kin servers.'

export default function ServerBoundaryClaim({
  claim = defaultClaim,
}: ServerBoundaryClaimProps) {
  return (
    <div className="server-boundary-claim" role="note">
      <IonIcon aria-hidden="true" className="server-boundary-claim__icon" icon={shieldCheckmarkOutline} />
      <AppText intent="supporting">{claim}</AppText>
    </div>
  )
}
