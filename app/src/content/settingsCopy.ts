export type SettingsHomeRowCopy = {
  title: string
  description: string
  spokenLabelOverride?: {
    label: string
    reason: string
  }
}

export type SettingsDestinationCopy = SettingsHomeRowCopy & {
  screenTitle: string
}

export const SETTINGS_DESTINATIONS = {
  profile: {
    screenTitle: 'Profile',
    title: 'Edit profile',
    description: 'Your name and location used in opt-out emails.',
  },
  subscription: {
    screenTitle: 'Subscription',
    title: 'Manage subscription',
    description: 'Manage your subscription or restore purchases. Apple handles billing.',
  },
  privacy: {
    screenTitle: 'Privacy & local data',
    title: 'Manage local data',
    description: 'See what stays on this device and delete local data.',
  },
  diagnostics: {
    screenTitle: 'Diagnostics & app version',
    title: 'Turn on temporary diagnostics',
    description: 'Turn on local diagnostics, export logs, or check this app version.',
  },
  support: {
    screenTitle: 'Support & policies',
    title: 'Get support and read policies',
    description: 'Help, support email, privacy policy, and terms.',
  },
} as const satisfies Record<string, SettingsDestinationCopy>

export const SETTINGS_HOME_ROWS = {
  emailWording: {
    title: 'Review email wording',
    description: 'Review the message you send to brokers.',
  },
  roundSize: {
    title: 'Choose round size',
    description: 'Choose how many opt-out emails Scrappy Kin sends in each round.',
  },
  gmailConnected: {
    title: 'Manage Gmail connection',
    description: 'Connected with send-only access.',
  },
  gmailDisconnected: {
    title: 'Connect Gmail',
    description: 'Connect the Gmail account Scrappy Kin uses to send emails.',
  },
} as const satisfies Record<string, SettingsHomeRowCopy>
