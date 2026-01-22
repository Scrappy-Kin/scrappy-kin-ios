import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import AppHeading from '../primitives/AppHeading'
import AppText from '../primitives/AppText'
import InlineTrustClaim from '../patterns/InlineTrustClaim'
import ReadMoreSheetLink from '../patterns/ReadMoreSheetLink'
import InspectableArtifact from '../patterns/InspectableArtifact'
import FlowStepHeader from '../patterns/FlowStepHeader'
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
        </div>
      </IonContent>
    </IonPage>
  )
}
