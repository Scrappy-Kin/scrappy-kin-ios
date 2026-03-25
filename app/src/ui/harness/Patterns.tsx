import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import AppButton from '../primitives/AppButton'
import AppCard from '../primitives/AppCard'
import AppHeading from '../primitives/AppHeading'
import AppList from '../primitives/AppList'
import AppListRow from '../primitives/AppListRow'
import AppText from '../primitives/AppText'
import ArtifactPanel from '../patterns/ArtifactPanel'
import InlineTrustClaim from '../patterns/InlineTrustClaim'
import ReadMoreSheetLink from '../patterns/ReadMoreSheetLink'
import InspectableArtifact from '../patterns/InspectableArtifact'
import FlowStepHeader from '../patterns/FlowStepHeader'
import ReviewAssetCard from '../patterns/ReviewAssetCard'
import ServerBoundaryClaim from '../patterns/ServerBoundaryClaim'
import './harness.css'

export default function Patterns() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="app-header">
          <IonTitle>Patterns</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="app-content">
        <div className="app-shell">
          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">Patterns</div>
            <AppHeading intent="section">InlineTrustClaim</AppHeading>
            <InlineTrustClaim
              claim="We only request send-only Gmail access."
              details={
                <div className="app-stack">
                  <AppText intent="body">You can verify this in the Google consent screen.</AppText>
                  <AppText intent="supporting">We never access your inbox or read messages.</AppText>
                </div>
              }
            />
          </section>

          <section className="app-section">
            <AppHeading intent="section">ReadMoreSheetLink</AppHeading>
            <div className="app-stack">
              <AppText intent="body">Need more context?</AppText>
              <ReadMoreSheetLink
                label="Read why we ask"
                sheetTitle="Why we ask"
                sheetBody={
                  <div className="app-stack">
                    <AppText intent="body">
                      We ask for the minimum access required to send broker requests.
                    </AppText>
                    <AppText intent="supporting">
                      You can review the exact email before sending.
                    </AppText>
                  </div>
                }
              />
            </div>
          </section>

          <section className="app-section">
            <AppHeading intent="section">InspectableArtifact</AppHeading>
            <InspectableArtifact
              title="Email we will send"
              summary="Preview the exact content before you send."
              artifact={
                <AppText intent="caption">
                  Subject: Data deletion request
                </AppText>
              }
              viewTitle="Email preview"
              viewContent={
                <div className="app-stack">
                  <AppText intent="body">Subject: Data deletion request</AppText>
                  <AppText intent="supporting">
                    Body: Please delete my data and confirm when complete.
                  </AppText>
                </div>
              }
              explanation={
                <>
                  <AppText intent="body">We show the artifact first.</AppText>
                  <AppText intent="supporting">Explanation is secondary context.</AppText>
                </>
              }
            />
          </section>

          <section className="app-section">
            <AppHeading intent="section">FlowStepHeader</AppHeading>
            <FlowStepHeader
              current={2}
              total={6}
              label="Step 2 of 6"
              onBack={() => {}}
            />
          </section>

          <section className="app-section">
            <AppHeading intent="section">ServerBoundaryClaim</AppHeading>
            <ServerBoundaryClaim />
          </section>

          <section className="app-section">
            <AppHeading intent="section">ReviewAssetCard</AppHeading>
            <ReviewAssetCard
              title="2 brokers selected"
              action={<span className="app-link">Edit</span>}
            >
              <AppText intent="body">Review or change the broker list before you send.</AppText>
            </ReviewAssetCard>
          </section>

          <section className="app-section">
            <AppHeading intent="section">Screen Composition</AppHeading>
            <div className="app-section-shell">
              <AppText intent="body">Plain section shell with support copy and one primary action.</AppText>
              <ReadMoreSheetLink
                label="Why this wording works"
                sheetTitle="Why this wording works"
                sheetBody={
                  <div className="app-stack">
                    <AppText intent="body">
                      Use specific disclosure labels and keep the collapsed state meaningful on its own.
                    </AppText>
                  </div>
                }
              />
              <ArtifactPanel>
                <AppText intent="label">Artifact panel</AppText>
                <AppText intent="body">Subject: Personal Data Deletion Request [SK-ABC123]</AppText>
                <AppText intent="supporting">
                  Plain-text content and embedded form fields belong inside the artifact surface.
                </AppText>
              </ArtifactPanel>
              <AppButton>Primary action</AppButton>
              <ServerBoundaryClaim />
            </div>

            <AppList header="List-based settings section">
              <AppListRow title="Disconnect Gmail" />
              <AppListRow title="Delete all local data" tone="danger" />
            </AppList>

            <AppCard title="Status summary">
              <AppText intent="supporting">Cards are for bounded objects, not default page wrappers.</AppText>
              <AppText intent="supporting">Sent: 2 · Failed: 0 · Pending: 0</AppText>
            </AppCard>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
