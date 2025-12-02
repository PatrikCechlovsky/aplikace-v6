'use client'
// app/UI/AppIcon.tsx
import React from 'react'
import { ICONS, IconKey } from '@/app/UI/icons'

type AppIconProps = {
  name: IconKey
  className?: string
  /**
   * jestli chceš jiný text než výchozí český název
   */
  titleOverride?: string
}

export function AppIcon({ name, className, titleOverride }: AppIconProps) {
  const def = ICONS[name]

  if (!def) {
    return (
      <span
        className={className}
        title={`Neznámá ikona: ${name}`}
        aria-label={`Neznámá ikona: ${name}`}
      >
        ❓
      </span>
    )
  }

  return (
    <span
      className={className ?? 'app-icon'}
      title={titleOverride ?? def.nameCZ}
      aria-label={titleOverride ?? def.nameCZ}
      role="img"
    >
      {def.emoji}
    </span>
  )
}
