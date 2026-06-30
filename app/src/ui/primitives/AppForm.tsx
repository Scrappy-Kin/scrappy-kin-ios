import type { FormEvent, ReactNode } from 'react'
import './form.css'

type AppFormProps = {
  children: ReactNode
  className?: string
  onSubmit?: () => void
}

export default function AppForm({ children, className, onSubmit }: AppFormProps) {
  const classes = ['app-form', className].filter(Boolean).join(' ')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit?.()
  }

  return (
    <form className={classes} noValidate onSubmit={handleSubmit}>
      {children}
    </form>
  )
}
