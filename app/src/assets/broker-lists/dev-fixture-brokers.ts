import type { Broker } from '../../services/brokerStore'

export const devFixtureBrokers: Broker[] = [
  {
    id: 'broker-happy-path',
    name: 'Fixture Broker One',
    domain: 'scrappykin.com',
    contactEmail: 'testbot+broker-fixture_one@scrappykin.com',
    tier: 'mega',
    childCompanies: ['Fixture Broker One'],
  },
  {
    id: 'broker-needs-retry',
    name: 'Fixture Broker Two',
    domain: 'scrappykin.com',
    contactEmail: 'testbot+broker-fixture_two@scrappykin.com',
    tier: 'mega',
    childCompanies: ['Fixture Broker Two'],
  },
  {
    id: 'broker-already-sent',
    name: 'Fixture Broker Three',
    domain: 'scrappykin.com',
    contactEmail: 'testbot+broker-fixture_three@scrappykin.com',
    tier: 'mega',
    childCompanies: ['Fixture Broker Three'],
  },
  {
    id: 'broker-long-name',
    name: 'Very Long Broker Name For Layout Testing',
    domain: 'scrappykin.com',
    contactEmail: 'testbot+broker-long_name@scrappykin.com',
    tier: 'mega',
    childCompanies: ['Very Long Broker Name For Layout Testing'],
  },
  {
    id: 'broker-second-happy-path',
    name: 'Fixture Broker Four',
    domain: 'scrappykin.com',
    contactEmail: 'testbot+broker-fixture_four@scrappykin.com',
    tier: 'mega',
    childCompanies: ['Fixture Broker Four'],
  },
]
