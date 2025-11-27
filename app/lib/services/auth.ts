/*
 * FILE: app/lib/services/auth.ts
 * PURPOSE: Obecné auth funkce (login, logout, registrace, reset, MFA scaffold)
 */

import { supabase } from '../supabaseClient'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'

/**
 * Přihlášení uživatele pomocí emailu a hesla.
 */
export async function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  })
}

/**
 * Odhlášení aktuálního uživatele.
 */
export async function logout() {
  return supabase.auth.signOut()
}

/**
 * Registrace nového uživatele + uložení jména do user_metadata.full_name
 */
export async function register(email: string, password: string, fullName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
}

/**
 * Odeslání e-mailu pro reset hesla.
 * redirectTo = URL, kam Supabase přesměruje po kliknutí na link v e-mailu.
 * (např. https://aplikace-v6.vercel.app/reset-hesla)
 */
export async function resetPassword(email: string, redirectTo: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
}

/**
 * Získání aktuální session z klienta (pro použití v client komponentách).
 */
export async function getCurrentSession() {
  return supabase.auth.getSession()
}

/**
 * Posluchač změn auth stavu (přihlášení, odhlášení, refresh tokenu).
 * Vrací objekt se subscription, který je potřeba v useEffect() odregistrovat.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange(callback)
}

/* ------------------------------------------------------------------
 * MFA (TOTP) – 2F scaffold
 *
 * Tyto funkce používají Supabase MFA API:
 * - enroll: vygeneruje TOTP secret + QR kód
 * - challenge: připraví challenge pro ověření kódu
 * - verify: ověří zadaný TOTP kód uživatelem
 *
 * UI pro to uděláme v dalším kroku (např. v modulu 020 Můj účet).
 * ------------------------------------------------------------------ */

/**
 * Zahájení enrolmentu TOTP faktoru (pro Authenticator app).
 * Vrací QR kód + secret, které zobrazíš uživateli.
 */
export async function enrollTotpFactor() {
  // Pozn.: MFA musí být povolené v Supabase Dashboardu (Auth → MFA).
  // Docs: https://supabase.com/docs/guides/auth/auth-mfa/totp
  // @ts-ignore – typy MFA můžou být v různých verzích supabase-js
  return supabase.auth.mfa.enroll({
    factorType: 'totp',
  })
}

/**
 * Vytvoří challenge pro TOTP faktor (připraví ověření kódu).
 */
export async function challengeTotpFactor(factorId: string) {
  // @ts-ignore – typy MFA můžou být v různých verzích supabase-js
  return supabase.auth.mfa.challenge({
    factorId,
  })
}

/**
 * Ověření MFA TOTP challenge – uživatel zadá kód z Authenticatoru.
 */
export async function verifyTotpChallenge(params: {
  factorId: string
  challengeId: string
  code: string
}) {
  const { factorId, challengeId, code } = params
  // @ts-ignore – typy MFA můžou být v různých verzích supabase-js
  return supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  })
}
