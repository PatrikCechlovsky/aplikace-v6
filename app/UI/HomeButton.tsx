/*
 * FILE: app/UI/HomeButton.tsx
 * PURPOSE: Logo / název aplikace – kliknutím návrat na dashboard
 */

'use client'

import { getIcon } from '@/app/UI/icons'

type Props = {
  disabled?: boolean
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
      <span className="home-button__icon">{getIcon('home')}</span>
      <span className="home-button__text">Pronajímatel v6</span>
    </button>
  )
}
