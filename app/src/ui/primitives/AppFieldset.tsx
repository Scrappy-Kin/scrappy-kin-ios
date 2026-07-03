import { useId, type ReactNode } from 'react'
import AppText from './AppText'
import './form.css'

type AppFieldsetProps = {
  legend: string
  description?: string
  children: ReactNode
  className?: string
}

export default function AppFieldset({
  legend,
  description,
  children,
  className,
}: AppFieldsetProps) {
  const generatedId = useId()
  const descriptionId = description ? `${generatedId}-description` : undefined
  const classes = ['app-fieldset', className].filter(Boolean).join(' ')

  return (
    <fieldset className={classes} aria-describedby={descriptionId}>
      <legend className="app-fieldset__legend">
        <AppText intent="label">
          {legend}
        </AppText>
      </legend>
      {description ? (
        <>
          <span className="app-sr-only" id={descriptionId}>
            {description}
          </span>
          <div className="app-fieldset__description" aria-hidden="true">
            <AppText intent="caption">{description}</AppText>
          </div>
        </>
      ) : null}
      <div className="app-fieldset__content">{children}</div>
    </fieldset>
  )
}
