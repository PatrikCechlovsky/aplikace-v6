// app/UI/HomeButton.tsx
'use client'

import { getIcon } from '@/app/UI/icons'

type Props = {
  disabled?: boolean
  /** Klik na „logo“ – parent (page.tsx) řeší návrat na Dashboard */
  onClick?: () => void
}

export default function HomeButton({ disabled = false, onClick }: Props) {
  return (
    <button
      type="button"
      className={`home-button ${disabled ? 'is-disabled' : ''}`}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      title="Zpět na dashboard"
    >
      <span className="home-button__icon">
        {getIcon('home')}
      </span>
      <span className="home-button__text">Pronajímatel v6</span>
    </button>
  )
}
