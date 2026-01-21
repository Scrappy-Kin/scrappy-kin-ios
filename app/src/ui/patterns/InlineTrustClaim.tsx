import type { ReactNode } from 'react'
import AppDisclosure from '../primitives/AppDisclosure'
import AppText from '../primitives/AppText'

type InlineTrustClaimProps = {
  claim: string
  details?: ReactNode
  linkLabel?: string
}

export default function InlineTrustClaim({
  claim,
  details,
  linkLabel = 'Why?',
}: InlineTrustClaimProps) {
  if (!details) {
    return <AppText intent="body">{claim}</AppText>
  }

  return (
    <AppDisclosure label={linkLabel} collapsedSummary={claim}>
      {details}
    </AppDisclosure>
  )
}
