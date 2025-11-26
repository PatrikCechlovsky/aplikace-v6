// app/UI/HomeActions.tsx
'use client'

type Props = {
  disabled?: boolean
  onLogout?: () => void
}

export default function HomeActions({ disabled = false, onLogout }: Props) {
  return (
    <div className={`home-actions ${disabled ? 'is-disabled' : ''}`}>
      <span className="home-actions__user">Páťa</span>
      <button className="home-actions__icon" title="Hledat" disabled={disabled}>
        🔍
      </button>
      <button className="home-actions__icon" title="Upozornění" disabled={disabled}>
        🔔
      </button>
      <button className="home-actions__icon" title="Profil" disabled={disabled}>
        👤
      </button>
      <button
        className="home-actions__logout"
        disabled={disabled}
        onClick={disabled ? undefined : onLogout}
      >
        Odhlásit
      </button>
    </div>
  )
}
