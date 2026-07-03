import AppLabelRow from './AppLabelRow'
import './section-label.css'

type AppSectionLabelProps = {
  children: string
  accessibilityLabel?: string
}

export default function AppSectionLabel({
  children,
  accessibilityLabel,
}: AppSectionLabelProps) {
  return (
    <AppLabelRow
      className="app-section-label"
      accessibilityLabel={accessibilityLabel}
      touchTarget
    >
      {children}
    </AppLabelRow>
  )
}
