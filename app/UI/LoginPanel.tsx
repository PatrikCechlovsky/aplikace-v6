// app/UI/LoginPanel.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabaseClient'

export default function LoginPanel() {
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string|null>(null)

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Přihlášení proběhlo úspěšně.")
      window.location.reload()
    }
  }

  async function handleReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Odkaz pro změnu hesla byl odeslán.")
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded shadow-sm p-6">

      {mode === 'login' ? (
        <>
          <h2 className="text-xl font-semibold mb-4">Přihlášení</h2>

          <div className="space-y-3 text-sm">
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              placeholder="E-mail"
              onChange={e => setEmail(e.target.value)}
            />

            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder="Heslo"
              onChange={e => setPassword(e.target.value)}
            />

            <button
              onClick={handleLogin}
              className="w-full mt-2 bg-blue-600 text-white py-2 rounded"
            >
              Přihlásit se
            </button>

            <button
              onClick={() => setMode('reset')}
              className="text-xs underline mt-2"
            >
              Zapomenuté / změna hesla
            </button>
          </div>

          {message && <p className="text-red-600 text-sm mt-3">{message}</p>}
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Změna hesla</h2>

          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            placeholder="E-mail"
            onChange={e => setEmail(e.target.value)}
          />

          <button
            onClick={handleReset}
            className="w-full mt-3 bg-blue-600 text-white py-2 rounded"
          >
            Poslat odkaz pro změnu hesla
          </button>

          <button
            onClick={() => setMode('login')}
            className="w-full mt-4 border py-2 rounded text-sm"
          >
            ← Zpět
          </button>

          {message && <p className="text-red-600 text-sm mt-3">{message}</p>}
        </>
      )}
    </div>
  )
}
