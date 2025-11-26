// app/UI/CommonActions.tsx
'use client'

type Props = {
  disabled?: boolean
}

export default function CommonActions({ disabled = false }: Props) {
  return (
    <div className={`common-actions ${disabled ? 'is-disabled' : ''}`}>
      <button className="common-actions__btn" disabled={disabled}>
        Upravit
      </button>
      <button className="common-actions__btn" disabled={disabled}>
        Příloha
      </button>
      <button
        className="common-actions__btn common-actions__btn--secondary"
        disabled={disabled}
      >
        Archivovat
      </button>
    </div>
  )
}
