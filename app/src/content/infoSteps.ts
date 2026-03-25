export type InfoStep = {
  id: string
  title: string
  body: string[]
}

export const phaseAInfoSteps: InfoStep[] = [
  {
    id: 'intro',
    title: "Hi I'm Jon",
    body: [
      'I run a one-person company. I think privacy matters, so I built this to help you exercise your privacy rights.',
      'You stay in control. The app keeps your info and Gmail connection on your device.',
    ],
  },
  {
    id: 'broker-rationale',
    title: 'How did we pick these brokers?',
    body: [
      'After testing with data brokers and reading regulations, this is the minimum data needed to find and opt you out.',
      'We keep the list small and verified so the experience is predictable.',
    ],
  },
  {
    id: 'privacy-stance',
    title: 'Privacy stance',
    body: [
      'Your info and Gmail connection stay on your device.',
      'Requests go from your Gmail account, not through Scrappy Kin servers.',
      'We only request send-only Gmail access. No inbox access.',
    ],
  },
  {
    id: 'how-it-works',
    title: 'How it works',
    body: [
      'Pick brokers.',
      'Review the request and fill in only the minimum details needed.',
      'Connect Gmail for send-only access.',
      'Send selected requests and track progress.',
    ],
  },
]
