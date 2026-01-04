/*
 * FILE: app/layout.tsx
 * PURPOSE: Kořenový layout aplikace – načtení globálních stylů a aplikace motivu (theme)
 */

import './globals.css'
import type { Metadata } from 'next'
import { uiConfig } from './lib/uiConfig'
import ErrorBoundary from './UI/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Pronajímatel v6',
  description: 'Správa nájmů',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const bodyClass = `theme-${uiConfig.theme}`

  return (
    <html lang="cs">
      <body className={bodyClass}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
