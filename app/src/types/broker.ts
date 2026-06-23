export type Broker = {
  id: string
  name: string
  domain?: string
  contactEmail: string
  tier?: string
  childCompanies?: string[]
  inTop30?: boolean
  verifiedResolutions?: number
  starterOrder?: number
}
