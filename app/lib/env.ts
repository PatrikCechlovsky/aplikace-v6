// FILE: app/lib/env.ts
// PURPOSE: Environment variables validation and type-safe access

const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const

const optionalEnvVars = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  APP_BASE_URL: process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  SENTRY_DSN: process.env.SENTRY_DSN,
} as const

/**
 * Validates required environment variables
 * Throws error if any required variable is missing
 */
export function validateEnv(): void {
  const missing: string[] = []

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value.trim() === '') {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env.local file. See .env.example for reference.`
    )
  }
}

/**
 * Get environment variable value (type-safe)
 */
export const env = {
  // Required
  NEXT_PUBLIC_SUPABASE_URL: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  
  // Optional
  SUPABASE_SERVICE_ROLE_KEY: optionalEnvVars.SUPABASE_SERVICE_ROLE_KEY,
  APP_BASE_URL: optionalEnvVars.APP_BASE_URL,
  NODE_ENV: optionalEnvVars.NODE_ENV,
  SENTRY_DSN: optionalEnvVars.SENTRY_DSN,
  
  // Computed
  isDevelopment: optionalEnvVars.NODE_ENV === 'development',
  isProduction: optionalEnvVars.NODE_ENV === 'production',
} as const

// Validate on module load (only in server-side or build time)
if (typeof window === 'undefined') {
  try {
    validateEnv()
  } catch (error) {
    // In development, show helpful error
    if (env.isDevelopment) {
      console.error('❌ Environment validation failed:', error)
      console.error('💡 Make sure you have .env.local file with required variables')
    }
    // In production, throw to fail fast
    if (env.isProduction) {
      throw error
    }
  }
}

