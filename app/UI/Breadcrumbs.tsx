// app/UI/Breadcrumbs.tsx
'use client'

type Props = {
  disabled?: boolean
}

export default function Breadcrumbs({ disabled = false }: Props) {
  return (
    <div className={`breadcrumbs ${disabled ? 'is-disabled' : ''}`}>
      Domů › Modul › Přehled › Detail
    </div>
  )
}
