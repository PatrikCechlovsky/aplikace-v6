// app/UI/HomeButton.tsx
'use client'

type Props = {
  disabled?: boolean
}

export default function HomeButton({ disabled = false }: Props) {
  return (
    <div className={`home-button ${disabled ? 'is-disabled' : ''}`}>
      <span className="home-button__icon">🏠</span>
      <span className="home-button__text">Pronajímatel v6</span>
    </div>
  )
}
