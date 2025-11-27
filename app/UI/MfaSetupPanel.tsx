/*
 * FILE: app/UI/MfaSetupPanel.tsx
 * PURPOSE: UI pro nastavení a ověření TOTP MFA (2-fázové ověření)
 */

'use client'

import { useState } from 'react'
import {
  enrollTotpFactor,
  challengeTotpFactor,
  verifyTotpChallenge,
} from '../lib/services/auth'

type Step = 'intro' | 'enrolled' | 'readyToVerify' | 'verified' | 'error'

export default function MfaSetupPanel() {
  const [step, setStep] = useState<Step>('intro')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState<string>('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const clearMessages = () => {
    setMessage(null)
    setError(null)
  }

  const handleEnroll = async () => {
    clearMessages()
    setLoading(true)
    try {
      const { data, error } = await enrollTotpFactor()
      if (error) throw error

      // data strukturu bereme jako any, protože se může lišit verzí sdk
      const factor: any = data
      setFactorId(factor.id ?? null)
      setQrCode(factor.totp?.qr_code ?? null)
      setSecret(factor.totp?.secret ?? null)

      setStep('enrolled')
      setMessage(
        'MFA faktor vytvořen. Naskenuj QR kód ve své Authenticator aplikaci a poté pokračuj krokem 2.',
      )
    } catch (err: any) {
      console.error(err)
      setError(err.message ?? 'Nepodařilo se vytvořit MFA faktor.')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const handlePrepareVerify = async () => {
    if (!factorId) {
      setError('Chybí ID faktoru, nejprve spusť registraci.')
      return
    }
    clearMessages()
    setLoading(true)
    try {
      const { data, error } = await challengeTotpFactor(factorId)
      if (error) throw error

      const challenge: any = data
      setChallengeId(challenge.id ?? null)
      setStep('readyToVerify')
      setMessage('Zadej 6místný kód z Authenticator aplikace.')
    } catch (err: any) {
      console.error(err)
      setError(err.message ?? 'Nepodařilo se vytvořit challenge pro MFA.')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!factorId || !challengeId) {
      setError('Chybí data pro ověření. Zkus znovu vytvořit challenge.')
      return
    }
    if (!code) {
      setError('Zadej ověřovací kód.')
      return
    }

    clearMessages()
    setLoading(true)
    try {
      const { error } = await verifyTotpChallenge({
        factorId,
        challengeId,
        code,
      })
      if (error) throw error

      setStep('verified')
      setMessage('MFA je úspěšně nastavené a ověřené.')
    } catch (err: any) {
      console.error(err)
      setError(err.message ?? 'Ověření MFA kódu se nezdařilo.')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-panel" style={{ marginTop: 24 }}>
      <h2 style={{ marginBottom: 8, fontSize: 16 }}>Nastavení 2-fázového ověření (MFA)</h2>
      <p style={{ fontSize: 13, marginBottom: 12 }}>
        Tato část slouží k nastavení TOTP (Google Authenticator, Microsoft Authenticator apod.).
      </p>

      <ol style={{ fontSize: 13, paddingLeft: 18, marginBottom: 16 }}>
        <li>Vytvoř MFA faktor a zobraz QR kód.</li>
        <li>Naskenuj QR kód v Authenticator aplikaci.</li>
        <li>Vygeneruj kód a zadej ho pro ověření.</li>
      </ol>

      {message && (
        <div className="login-panel__message" style={{ marginBottom: 8 }}>
          {message}
        </div>
      )}
      {error && (
        <div className="login-panel__error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}

      {/* Krok 1 – vytvoření faktoru + QR kód */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="login-panel__submit"
          disabled={loading}
          onClick={handleEnroll}
        >
          1️⃣ Vytvořit MFA faktor a QR kód
        </button>
      </div>

      {qrCode && (
        <div style={{ marginBottom: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 12, marginBottom: 4 }}>Naskenuj tento QR kód v Authenticatoru:</p>
          {/* QR kód bývá data URL (image/png) */}
          <img
            src={qrCode}
            alt="MFA QR code"
            style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8 }}
          />
        </div>
      )}

      {secret && (
        <p style={{ fontSize: 12, wordBreak: 'break-all', marginBottom: 12 }}>
          Pokud nejde skenovat QR kód, můžeš ručně zadat secret:
          <br />
          <strong>{secret}</strong>
        </p>
      )}

      {/* Krok 2 – challenge */}
      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          className="login-panel__submit"
          disabled={loading || !factorId}
          onClick={handlePrepareVerify}
        >
          2️⃣ Připravit ověření (challenge)
        </button>
      </div>

      {/* Krok 3 – zadání kódu a ověření */}
      <div className="login-panel__field">
        <label>Ověřovací kód z aplikace</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="např. 123456"
        />
      </div>

      <button
        type="button"
        className="login-panel__submit"
        disabled={loading || !factorId || !challengeId}
        onClick={handleVerify}
        style={{ marginTop: 8 }}
      >
        3️⃣ Ověřit MFA kód
      </button>

      {step === 'verified' && (
        <p className="login-panel__message" style={{ marginTop: 10 }}>
          MFA je úspěšně aktivní pro tvůj účet.
        </p>
      )}
    </div>
  )
}
