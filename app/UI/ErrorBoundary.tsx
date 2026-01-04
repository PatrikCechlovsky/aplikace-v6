// FILE: app/UI/ErrorBoundary.tsx
// PURPOSE: Error Boundary component to catch React errors and display user-friendly error messages

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import '@/app/styles/components/ErrorBoundary.css'
import createLogger from '@/app/lib/logger'

const logger = createLogger('ErrorBoundary')

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to logger
    logger.error('ErrorBoundary caught an error', error, errorInfo)

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // In production, you might want to send this to an error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <h2>Něco se pokazilo</h2>
            <p>Omlouváme se, došlo k neočekávané chybě.</p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary__details">
                <summary>Technické detaily (pouze v development režimu)</summary>
                <pre className="error-boundary__error">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="error-boundary__button"
            >
              Zkusit znovu
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="error-boundary__button error-boundary__button--secondary"
            >
              Vrátit se na hlavní stránku
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

