import type { UserProfile, UserProfileErrors, UserProfileField } from '../../services/userProfile'
import AppFieldset from '../primitives/AppFieldset'
import AppInput from '../primitives/AppInput'

type ProfileFieldsProps = {
  profile: UserProfile
  errors: UserProfileErrors
  onChange: (next: Partial<UserProfile>) => void
  onBlurField: (field: UserProfileField) => void
  onComplete?: () => void
}

function normalizePartialZip(value: string) {
  return value.replace(/\D/g, '').slice(0, 4)
}

export default function ProfileFields({
  profile,
  errors,
  onChange,
  onBlurField,
  onComplete,
}: ProfileFieldsProps) {
  return (
    <AppFieldset legend="Identity for lookup">
      <AppInput
        label="Full name"
        fieldId="fullName"
        required
        value={profile.fullName}
        onChange={(value) => onChange({ fullName: value })}
        onBlur={() => onBlurField('fullName')}
        autoComplete="name"
        error={errors.fullName}
        enterKeyHint="next"
      />
      <AppInput
        label="Email"
        fieldId="email"
        required
        value={profile.email}
        onChange={(value) => onChange({ email: value })}
        type="email"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="email"
        spellCheck={false}
        onBlur={() => onBlurField('email')}
        error={errors.email}
        enterKeyHint="next"
      />
      <AppInput
        label="City"
        fieldId="city"
        required
        value={profile.city}
        onChange={(value) => onChange({ city: value })}
        onBlur={() => onBlurField('city')}
        autoComplete="address-level2"
        error={errors.city}
        enterKeyHint="next"
      />
      <AppInput
        label="State"
        fieldId="state"
        value={profile.state}
        onChange={(value) => onChange({ state: value.toUpperCase() })}
        autoCapitalize="characters"
        autoComplete="address-level1"
        placeholder="CA"
        enterKeyHint="next"
      />
      <AppInput
        label="Zip Code (first 4 digits)"
        fieldId="partialZip"
        value={profile.partialZip}
        onChange={(value) => onChange({ partialZip: normalizePartialZip(value) })}
        inputMode="numeric"
        maxLength={4}
        placeholder="1234"
        enterKeyHint="done"
        onDone={onComplete}
      />
    </AppFieldset>
  )
}
