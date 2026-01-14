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
      'You stay in control. Your data stays on your device or in your Gmail account.',
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
      'Your data stays on your device or in your email account.',
      'No PII ever touches our servers.',
      'We are open source and auditable.',
    ],
  },
  {
    id: 'how-it-works',
    title: 'How it works',
    body: [
      'Connect your Gmail account.',
      'Review the email template.',
      'Pick brokers.',
      'Send requests and track progress.',
    ],
  },
]
