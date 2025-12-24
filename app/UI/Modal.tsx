'use client'

// FILE: app/UI/Modal.tsx
// PURPOSE: Jednoduchý modal overlay pro znovupoužitelné panely (např. Přílohy přes 📎).

import React, { useCallback, useEffect, useRef } from 'react'

export type ModalProps = {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  const handleBackdropClick = useCallback(() => {
    onClose()
  }, [onClose])

  const handleCloseClick = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) closeBtnRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className="ui-modal" role="dialog" aria-modal="true" aria-label={title ?? 'Dialog'}>
      <div className="ui-modal__backdrop" onClick={handleBackdropClick} />

      <div className="ui-modal__panel">
        <div className="ui-modal__header">
          <div className="ui-modal__title">{title ?? ''}</div>
          <button ref={closeBtnRef} className="ui-modal__close" onClick={handleCloseClick} type="button">
            ✕
          </button>
        </div>

        <div className="ui-modal__body">{children}</div>
      </div>
    </div>
  )
}
