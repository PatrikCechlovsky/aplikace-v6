// FILE: app/UI/Toast.tsx
// PURPOSE: Toast notification system - replaces alert() calls

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import '@/app/styles/components/Toast.css'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastAction {
  label: string
  onClick: () => void
  primary?: boolean
}

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  action?: ToastAction
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number, action?: ToastAction) => void
  showSuccess: (message: string, duration?: number, action?: ToastAction) => void
  showError: (message: string, duration?: number, action?: ToastAction) => void
  showWarning: (message: string, duration?: number, action?: ToastAction) => void
  showInfo: (message: string, duration?: number, action?: ToastAction) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 5000, action?: ToastAction) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      const toast: Toast = { id, message, type, duration, action }

      setToasts((prev) => [...prev, toast])

      // Pokud má toast akci, neukončuj ho automaticky (nebo po delší době)
      const autoCloseDuration = action ? (duration || 10000) : duration
      if (autoCloseDuration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, autoCloseDuration)
      }
    },
    [removeToast]
  )

  const showSuccess = useCallback(
    (message: string, duration?: number, action?: ToastAction) => showToast(message, 'success', duration, action),
    [showToast]
  )

  const showError = useCallback(
    (message: string, duration?: number, action?: ToastAction) => showToast(message, 'error', duration, action),
    [showToast]
  )

  const showWarning = useCallback(
    (message: string, duration?: number, action?: ToastAction) => showToast(message, 'warning', duration, action),
    [showToast]
  )

  const showInfo = useCallback(
    (message: string, duration?: number, action?: ToastAction) => showToast(message, 'info', duration, action),
    [showToast]
  )

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation
  }

  const handleAction = () => {
    toast.action?.onClick()
    handleClose()
  }

  return (
    <div
      className={`toast toast--${toast.type} ${isVisible ? 'toast--visible' : ''}`}
      role="alert"
    >
      <div className="toast__content">
        <div className="toast__message-wrapper">
          <span className="toast__message">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className={`toast__action ${toast.action.primary ? 'toast__action--primary' : ''}`}
              onClick={handleAction}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          className="toast__close"
          onClick={handleClose}
          aria-label="Zavřít"
        >
          ×
        </button>
      </div>
    </div>
  )
}

