/*
 * FILE: app/lib/services/auth.ts
 * PURPOSE: Obecné auth funkce (login, logout, registrace, reset hesla)
 */

import { supabase } from '../supabaseClient'

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function register(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  return { data, error }
}

export async function resetPassword(email: string, redirectTo: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
  return { data, error }
}
