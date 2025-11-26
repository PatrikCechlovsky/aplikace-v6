// app/UI/HomeActions.tsx
'use client'

export default function HomeActions() {
  return (
    <div className="home-actions">
      <span className="home-actions__user">Páťa</span>
      <button className="home-actions__icon" title="Hledat">🔍</button>
      <button className="home-actions__icon" title="Upozornění">🔔</button>
      <button className="home-actions__icon" title="Profil">👤</button>
      <button className="home-actions__logout">Odhlásit</button>
    </div>
  )
}
