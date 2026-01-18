'use client'

/**
 * Input pole s historií hodnot
 * Zobrazuje posledních 5 hodnot, které uživatel do tohoto pole zadal
 */

import React, { useEffect, useId, useState } from 'react'
import { loadFieldHistory, saveFieldHistory } from '../lib/formHistory'

export type InputWithHistoryProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'list' | 'onChange' | 'onBlur'
> & {
  /** Unikátní ID pole pro historii (např. "user.email", "user.phone") */
  historyId: string
  /** Callback při změně hodnoty */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Callback při ztrátě focusu (když se hodnota uloží do historie) */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  /** Zda ukládat hodnotu do historie při blur (default: true) */
  saveOnBlur?: boolean
}

export default function InputWithHistory({
  historyId,
  onChange,
  onBlur,
  saveOnBlur = true,
  value,
  ...inputProps
}: InputWithHistoryProps) {
  const [history, setHistory] = useState<string[]>([])
  const listId = useId()

  // Načteme historii při mount (jen pokud není readOnly)
  useEffect(() => {
    if (inputProps.readOnly) {
      setHistory([])
      return
    }
    const loaded = loadFieldHistory(historyId)
    setHistory(loaded)
  }, [historyId, inputProps.readOnly])

  // Uložíme hodnotu do historie při blur (jen pokud není readOnly)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!inputProps.readOnly && saveOnBlur && e.target.value) {
      saveFieldHistory(historyId, e.target.value)
      // Aktualizujeme historii pro zobrazení
      const updated = loadFieldHistory(historyId)
      setHistory(updated)
    }
    onBlur?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
  }

  return (
    <>
      <input
        {...inputProps}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        list={history.length > 0 ? listId : undefined}
      />
      {history.length > 0 && (
        <datalist id={listId}>
          {history.map((item, index) => (
            <option key={index} value={item} />
          ))}
        </datalist>
      )}
    </>
  )
}

