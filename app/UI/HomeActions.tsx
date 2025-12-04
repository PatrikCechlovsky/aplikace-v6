// app/UI/HomeActions.tsx
'use client'

type Props = {
  disabled?: boolean
  onLogout?: () => void
  displayName?: string | null
}

export default function HomeActions({
  disabled = false,
  onLogout,
  displayName,
}: Props) {
  const name = displayName || 'Uživatel'

  return (
    <div className={`home-actions ${disabled ? 'is-disabled' : ''}`}>
      {/* Vlevo zobrazíme alias / display_name */}
      <span className="home-actions__user" title={name}>
        {name}
      </span>

      {/* Profil */}
      <button
        className="home-actions__icon"
        title="Profil"
        disabled={disabled}
      >
        👤
      </button>

      {/* Hledat */}
      <button
        className="home-actions__icon"
        title="Hledat"
        disabled={disabled}
      >
        🔍
      </button>

      {/* Upozornění */}
      <button
        className="home-actions__icon"
        title="Upozornění"
        disabled={disabled}
      >
        🔔
      </button>

      {/* Odhlášení */}
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
