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
      {/* Vlevo zobrazíme alias / display_name */}
      <span className="home-actions__user" title={name}>
        {name}
      </span>

      {/* Ikonová / textová tlačítka vpravo */}
      {HOME_ACTIONS.map((action) => (
        <button
          key={action.id}
          className="home-actions__icon"
          disabled={disabled}
          // title záměrně NEpoužíváme – text řešíme vizuálně
          type="button"
        >
          <span className="home-actions__icon-emoji" aria-hidden="true">
            {action.icon}
          </span>
          <span className="home-actions__label">{action.label}</span>
        </button>
      ))}

      {/* Odhlášení – už textové tlačítko, to necháme tak jak je */}
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
