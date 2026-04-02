import AppHeading from '../ui/primitives/AppHeading'
import AppText from '../ui/primitives/AppText'
import AppToggle from '../ui/primitives/AppToggle'

type DevDiagnosticsPanelProps = {
  devLogOptIn: boolean
  onChange: (enabled: boolean) => Promise<void>
}

export default function DevDiagnosticsPanel({
  devLogOptIn,
  onChange,
}: DevDiagnosticsPanelProps) {
  return (
    <section className="internal-tools-panel">
      <AppHeading intent="section">Internal only</AppHeading>
      <AppText intent="supporting">
        Debug-only controls for local testing. Not part of the user-facing product.
      </AppText>
      <AppToggle
        label="Enable dev diagnostics"
        description="Only available in Debug builds. Data stays on-device."
        checked={devLogOptIn}
        onChange={onChange}
      />
    </section>
  )
}
