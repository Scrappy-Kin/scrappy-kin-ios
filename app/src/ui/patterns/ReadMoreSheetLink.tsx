import { useState } from 'react'
import AppSheet from '../primitives/AppSheet'
import './read-more-sheet-link.css'

type ReadMoreSheetLinkProps = {
  label: string
  sheetTitle: string
  sheetBody: React.ReactNode
}

export default function ReadMoreSheetLink({ label, sheetTitle, sheetBody }: ReadMoreSheetLinkProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className="read-more-sheet-link" onClick={() => setOpen(true)}>
        {label}
      </button>
      <AppSheet title={sheetTitle} open={open} onDismiss={() => setOpen(false)}>
        {sheetBody}
      </AppSheet>
    </>
  )
}
