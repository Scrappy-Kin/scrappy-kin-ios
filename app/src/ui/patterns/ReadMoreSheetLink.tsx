import { useState } from 'react'
import AppButton from '../primitives/AppButton'
import AppSheet from '../primitives/AppSheet'

type ReadMoreSheetLinkProps = {
  label: string
  sheetTitle: string
  sheetBody: React.ReactNode
}

export default function ReadMoreSheetLink({ label, sheetTitle, sheetBody }: ReadMoreSheetLinkProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <AppButton size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {label}
      </AppButton>
      <AppSheet title={sheetTitle} open={open} onDismiss={() => setOpen(false)}>
        {sheetBody}
      </AppSheet>
    </>
  )
}
