// app/UI/HomeButton.tsx
'use client'

import { getIcon } from './icons'

type Props = {
  disabled?: boolean
  onClick?: () => void
}

export default function HomeButton({ disabled = false, onClick }: Props) {
  return (
    <button
      className={`home-button ${disabled ? 'is-disabled' : ''}`}
      disabled={disabled}
      onClick={onClick}
      title="Zpět na dashboard"
    >
      <span className="home-button__icon">
        {getIcon('home')}
      </span>
      <span className="home-button__text">Pronajímatel v6</span>
    </button>
  )
}
