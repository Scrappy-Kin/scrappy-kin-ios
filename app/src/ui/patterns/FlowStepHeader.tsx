import { chevronBack } from 'ionicons/icons'
import AppIconButton from '../primitives/AppIconButton'
import AppProgress from '../primitives/AppProgress'
import AppText from '../primitives/AppText'
import './flow-step-header.css'

type FlowStepHeaderProps = {
  current: number
  total: number
  onBack?: () => void
  backDisabled?: boolean
  label?: string
}

export default function FlowStepHeader({
  current,
  total,
  onBack,
  backDisabled = false,
  label,
}: FlowStepHeaderProps) {
  const showBack = Boolean(onBack) || backDisabled

  return (
    <div className="flow-step-header">
      <div className="flow-step-header__row">
        {showBack ? (
          <AppIconButton
            icon={chevronBack}
            ariaLabel="Back"
            size="lg"
            onClick={onBack}
            disabled={backDisabled}
          />
        ) : (
          <span />
        )}
        {label ? <AppText intent="label">{label}</AppText> : null}
      </div>
      <AppProgress current={current} total={total} />
    </div>
  )
}
