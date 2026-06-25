import AppText from '../../ui/primitives/AppText'
import DisclosureRow from '../../ui/patterns/DisclosureRow'
import ghoulPurseIllustration from '../../assets/illustrations/onboarding-data-ghoul-purse.svg'
import ghoulByeIllustration from '../../assets/illustrations/onboarding-data-ghoul-bye.svg'
import dataRescueIllustration from '../../assets/illustrations/onboarding-data-rescue.svg'

const GOOGLE_APP_ACCESS_URL = 'https://support.google.com/accounts/answer/14012355'
const APP_STORE_PRIVACY_URL = 'https://www.apple.com/legal/privacy/data/en/app-store/'
const SCRAPPY_KIN_SOURCE_URL = 'https://github.com/Scrappy-Kin/scrappy-kin-ios'

export default function OnboardingIntroStep() {
  return (
    <section className="app-section-shell app-stack--loose flow-onboarding-intro">
      <AppText intent="body">But it is.</AppText>

      <AppText intent="body">
        Data brokers collect and resell your name, age, home address, who you&apos;re related to,
        and whatever else they can get their hands on.
      </AppText>

      <img
        className="flow-onboarding-intro__illustration flow-onboarding-intro__illustration--purse"
        src={ghoulPurseIllustration}
        alt=""
        aria-hidden="true"
      />

      <AppText intent="body">
        Data brokers sell that information to marketers, employers, insurers, and anyone else
        who&apos;ll pay. The more they keep, the more they make.
      </AppText>

      <DisclosureRow
        label="What's a data broker?"
      >
        <AppText intent="body">
          Data brokers compile a profile of you from public records, app and website data,
          loyalty programs, social media, and dozens of other sources — usually without you
          knowing.
        </AppText>
        <AppText intent="body">
          A typical profile can include your home addresses (current and past), phone numbers,
          relatives and household members, income range, purchases, religious and political
          leanings, and health interests.
        </AppText>
        <AppText intent="body">
          Buyers include marketers, employers running background checks, landlords screening
          tenants, insurers, lenders, debt collectors, private investigators, and scammers.
          Most people have never heard of the companies holding their profiles.
        </AppText>
      </DisclosureRow>

      <img
        className="flow-onboarding-intro__illustration flow-onboarding-intro__illustration--bye"
        src={ghoulByeIllustration}
        alt=""
        aria-hidden="true"
      />

      <AppText intent="body">
        You can demand brokers delete that information. But every broker uses a different process,
        and not all of them accept a simple email — they bury the steps behind deliberate friction.
      </AppText>

      <DisclosureRow
        label="How does Scrappy Kin pick brokers?"
      >
        <AppText intent="body">
          Scrappy Kin doesn&apos;t take brokers at their word about how they handle deletion
          requests.
        </AppText>
        <AppText intent="body">
          We send the same email the app would send, then tag the response. Four outcomes:
        </AppText>
        <ul className="flow-onboarding-intro__disclosure-list">
          <li>
            <AppText intent="body">Brokers that claim email support.</AppText>
          </li>
          <li>
            <AppText intent="body">Brokers where email actually resulted in deletion.</AppText>
          </li>
          <li>
            <AppText intent="body">
              Brokers that push back into portals, ID checks, or other hurdles.
            </AppText>
          </li>
          <li>
            <AppText intent="body">Brokers that ignore the request entirely.</AppText>
          </li>
        </ul>
        <AppText intent="body">
          Only the second group makes it onto the list.
        </AppText>
        <AppText intent="body">
          The list is short on purpose. Every email is a small exposure of your information to
          one more company. Sending requests to brokers that won&apos;t honor them is exposure
          with no upside.
        </AppText>
        <AppText intent="body">
          A small list of brokers that work beats a long list of brokers that might.
        </AppText>
      </DisclosureRow>

      <img
        className="flow-onboarding-intro__illustration flow-onboarding-intro__illustration--rescue"
        src={dataRescueIllustration}
        alt=""
        aria-hidden="true"
      />

      <AppText intent="body">
        Scrappy Kin shows you which brokers will actually delete your information when you ask.
        You send each request from your own Gmail. Your personal information stays with you, not
        on Scrappy Kin&apos;s servers — no account, no inbox access, and broker replies come back to
        your Gmail.
      </AppText>

      <DisclosureRow
        label="What can Scrappy Kin see?"
      >
        <AppText intent="body">
          Scrappy Kin is built to need as little from you as possible.
        </AppText>
        <AppText intent="body">
          No Scrappy Kin account. There&apos;s no sign-up, no profile, no password. The app runs
          without any identity tied to it.
        </AppText>
        <AppText intent="body">
          Gmail access is send-only. When you connect Gmail, Scrappy Kin requests one specific
          permission — gmail.send — that lets it send emails from your Gmail account. Scrappy
          Kin cannot read your inbox, search your existing emails, see broker replies, or
          modify anything in your account. You can revoke the permission from your Google
          account settings any time.
        </AppText>
        <AppText intent="body">
          Apple handles payment. Subscription payments run through Apple&apos;s In-App Purchase
          system. Apple sees your card details; Scrappy Kin doesn&apos;t. The most Scrappy Kin
          ever sees is a receipt confirming you subscribed, with no personal information
          attached.
        </AppText>
        <AppText intent="body">
          No usage tracking. No analytics, no third-party trackers, no automatic crash
          reporting.
        </AppText>
        <AppText intent="body">
          Open source. The app code is public on GitHub. You don&apos;t have to take our word for
          any of this.
        </AppText>
        <AppText intent="body">Further reading:</AppText>
        <ul className="flow-onboarding-intro__disclosure-list">
          <li>
            <AppText intent="body">
              <a className="app-link" href={GOOGLE_APP_ACCESS_URL} target="_blank" rel="noreferrer">
                How third-party apps access your Google Account data
              </a>
            </AppText>
          </li>
          <li>
            <AppText intent="body">
              <a className="app-link" href={APP_STORE_PRIVACY_URL} target="_blank" rel="noreferrer">
                App Store &amp; Privacy (Apple)
              </a>
            </AppText>
          </li>
          <li>
            <AppText intent="body">
              <a className="app-link" href={SCRAPPY_KIN_SOURCE_URL} target="_blank" rel="noreferrer">
                Scrappy Kin source code
              </a>
            </AppText>
          </li>
        </ul>
        <AppText intent="caption">
          Links open outside the app.
        </AppText>
      </DisclosureRow>

      <AppText intent="body">Your first five removals are free.</AppText>

      <AppText intent="body">No sign-up required.</AppText>
    </section>
  )
}
