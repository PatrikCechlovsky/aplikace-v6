// app/UI/LoginPanel.tsx
'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Mode = 'login' | 'register' | 'reset'

export default function LoginPanel() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const clearMessages = () => {
    setMessage(null)
    setError(null)
  }

  const handleLogin = async () => {
    clearMessages()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      setMessage('Přihlášení proběhlo úspěšně.')
    } catch (err: any) {
      setError(err.message ?? 'Nepodařilo se přihlásit.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    clearMessages()

    if (!email || !password || !password2 || !fullName) {
      setError('Vyplň prosím všechna povinná pole.')
      return
    }
    if (password !== password2) {
      setError('Hesla se neshodují.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) throw error
      setMessage('Účet byl vytvořen. Zkontroluj prosím e-mail (potvrzení).')
    } catch (err: any) {
      setError(err.message ?? 'Registrace se nepodařila.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    clearMessages()

    if (!email) {
      setError('Zadej e-mail pro reset hesla.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // nastav stejnou URL i v Supabase Auth → Redirect URLs
        redirectTo: 'https://aplikace-v6.vercel.app',
      })
      if (error) throw error
      setMessage('Odeslali jsme ti e-mail s odkazem pro nastavení nového hesla.')
    } catch (err: any) {
      setError(err.message ?? 'Reset hesla se nepodařil.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'login') await handleLogin()
    if (mode === 'register') await handleRegister()
    if (mode === 'reset') await handleReset()
  }

  return (
    <div className="login-panel">
      <div className="login-panel__tabs">
        <button
          type="button"
          className={`login-panel__tab ${mode === 'login' ? 'login-panel__tab--active' : ''}`}
          onClick={() => {
            setMode('login')
            clearMessages()
          }}
        >
          Přihlášení
        </button>
        <button
          type="button"
          className={`login-panel__tab ${mode === 'register' ? 'login-panel__tab--active' : ''}`}
          onClick={() => {
            setMode('register')
            clearMessages()
          }}
        >
          Registrace
        </button>
        <button
          type="button"
          className={`login-panel__tab ${mode === 'reset' ? 'login-panel__tab--active' : ''}`}
          onClick={() => {
            setMode('reset')
            clearMessages()
          }}
        >
          Zapomenuté heslo
        </button>
      </div>

      <form onSubmit={onSubmit} className="login-panel__form">
        {mode === 'register' && (
          <div className="login-panel__field">
            <label>Jméno a příjmení *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        )}

        <div className="login-panel__field">
          <label>E-mail *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {mode !== 'reset' && (
          <div className="login-panel__field">
            <label>Heslo *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        {mode === 'register' && (
          <div className="login-panel__field">
            <label>Heslo znovu *</label>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </div>
        )}

        {error && <div className="login-panel__error">{error}</div>}
        {message && <div className="login-panel__message">{message}</div>}

        <button type="submit" className="login-panel__submit" disabled={loading}>
          {loading
            ? 'Probíhá...'
            : mode === 'login'
            ? 'Přihlásit se'
            : mode === 'register'
            ? 'Vytvořit účet'
            : 'Odeslat reset hesla'}
        </button>
      </form>
    </div>
  )
}
