// FILE: app/UI/HomeActions.tsx
'use client'

type Props = {
  disabled?: boolean
  onLogout?: () => void
  displayName?: string | null
  /**
   * Nouzové tlačítko – vynucené přepnutí layoutu zpět na sidebar.
   * Není povinné, AppShell ho může předat jen pro testování.
   */
  onForceSidebar?: () => void
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
  onForceSidebar,
}: Props) {
  const name = displayName || 'Uživatel'

  return (
    <div className={`home-actions ${disabled ? 'is-disabled' : ''}`}>
      {/* Jméno / alias uživatele */}
      <span className="home-actions__user" title={name}>
        {name}
      </span>

      {/* Akční tlačítka (profil, hledat, upozornění) */}
      {HOME_ACTIONS.map((action) => (
        <button
          key={action.id}
          className="home-actions__icon"
          disabled={disabled}
          type="button"
        >
          <span className="home-actions__icon-emoji" aria-hidden="true">
            {action.icon}
          </span>
          <span className="home-actions__label">{action.label}</span>
        </button>
      ))}

      {/* Nouzové tlačítko pro přepnutí layoutu zpět na sidebar */}
      {onForceSidebar && (
        <button
          className="home-actions__icon"
          disabled={disabled}
          type="button"
          title="Přepnout zobrazení zpět na sidebar"
          onClick={disabled ? undefined : onForceSidebar}
        >
          <span className="home-actions__icon-emoji" aria-hidden="true">
            📋
          </span>
          <span className="home-actions__label">Sidebar</span>
        </button>
      )}

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
