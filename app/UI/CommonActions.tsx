/*
 * FILE: app/UI/CommonActions.tsx
 * PURPOSE: Horní lišta akcí – ikony + text až při hover, zarovnání vpravo
 */

'use client'

import React from 'react'
import { getIcon } from './icons'

type ActionKey = 'detail' | 'edit' | 'attach' | 'archive' | 'delete'

export type CommonAction = {
  key: ActionKey
  label: string
  iconKey: Parameters<typeof getIcon>[0]
  onClick?: () => void
  disabled?: boolean
}

type Props = {
  disabled?: boolean
  actions?: CommonAction[]
}

const DEFAULT_ACTIONS: CommonAction[] = [
  { key: 'detail', label: 'Detail', iconKey: 'detail' },
  { key: 'edit', label: 'Upravit', iconKey: 'edit' },
  { key: 'attach', label: 'Přílohy', iconKey: 'attach' },
  { key: 'archive', label: 'Archivovat', iconKey: 'archive' },
  { key: 'delete', label: 'Smazat', iconKey: 'delete' },
]

export default function CommonActions({ disabled = false, actions }: Props) {
  const list = actions ?? DEFAULT_ACTIONS

  return (
    <div className={`common-actions ${disabled ? 'is-disabled' : ''}`}>
      {list.map((action) => (
        <button
          key={action.key}
          type="button"
          className="common-actions__btn"
          disabled={disabled || action.disabled}
          onClick={action.onClick}
        >
          <span className="common-actions__icon">
            {getIcon(action.iconKey)}
          </span>
          <span className="common-actions__label">{action.label}</span>
        </button>
      ))}
    </div>
  )
}
