// app/UI/CommonActions.tsx
'use client'

export default function CommonActions() {
  return (
    <div className="common-actions">
      <button className="common-actions__btn">Upravit</button>
      <button className="common-actions__btn">Příloha</button>
      <button className="common-actions__btn common-actions__btn--secondary">
        Archivovat
      </button>
    </div>
  )
}
