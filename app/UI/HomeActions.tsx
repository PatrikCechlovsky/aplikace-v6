// FILE: app/UI/HomeActions.tsx
'use client'

type Props = {
  disabled?: boolean
  onLogout?: () => void
  displayName?: string | null
}

type HomeActionConfig = {
  id: 'profile' | 'search' | 'notifications'
  icon: string
  label: string
}

const HOME_ACTIONS: HomeActionConfig[] = [
  { id: 'profile', icon: '👤', label: 'Profil' },
  { id: 'search', icon: '🔍', label: 'Hledat' },
  { id: 'notifications', icon: '🔔', label: 'Upozornění' },
]

export default function HomeActions({
  disabled = false,
  onLogout,
  displayName,
}: Props) {
  const name = displayName || 'Uživatel'

  return (
    <div className={`home-actions ${disabled ? 'is-disabled' : ''}`}>
      {/* Jméno / alias uživatele */}
      <span className="home-actions__user" title={name}>
        {name}
      </span>

      {/* Akční tlačítka */}
      {HOME_ACTIONS.map((action) => (
        <button
          key={action.id}
          className="home-actions__icon"
          disabled={disabled}
          type="button"
        >
          {/* Ikona – tu skryjeme v text režimu */}
          <span className="home-actions__icon-emoji" aria-hidden="true">
            {action.icon}
          </span>

          {/* Text – ten budeme v text režimu ukazovat vždy */}
          <span className="home-actions__label">{action.label}</span>
        </button>
      ))}

      {/* Odhlášení – klasické textové tlačítko */}
      <button
        className="home-actions__logout"
        disabled={disabled}
        onClick={disabled ? undefined : onLogout}
        type="button"
      >
        Odhlásit
      </button>
    </div>
  )
}
