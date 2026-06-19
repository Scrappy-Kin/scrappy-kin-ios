import AppButton from '../primitives/AppButton'
import AppNotice from '../primitives/AppNotice'
import { isQaDeviceSendBlockedMessage } from '../../services/sendSafety'

type SendFailureNoticeProps = {
  message: string
  onReviewGmail: () => void
}

export default function SendFailureNotice({
  message,
  onReviewGmail,
}: SendFailureNoticeProps) {
  const isQaBlocked = isQaDeviceSendBlockedMessage(message)

  return (
    <AppNotice
      variant="error"
      title={isQaBlocked ? 'QA send blocked' : 'Emails didn’t send'}
      actions={
        isQaBlocked ? undefined : (
          <AppButton
            variant="secondary"
            size="sm"
            onClick={onReviewGmail}
          >
            Review Gmail settings
          </AppButton>
        )
      }
    >
      {message}
    </AppNotice>
  )
}
