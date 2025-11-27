/*
 * FILE: app/layout.tsx
 * PURPOSE: Kořenový layout aplikace – načtení globálních stylů a aplikace motivu (theme)
 */

import './globals.css'
import type { Metadata } from 'next'
import { uiConfig } from './lib/uiConfig'

export const metadata: Metadata = {
  title: 'Pronajímatel v6',
  description: 'Správa nájmů',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Třída na <body> ve tvaru theme-light, theme-dark, theme-blue...
  const bodyClass = `theme-${uiConfig.theme}`

  return (
    <html lang="cs">
      <body className={bodyClass}>{children}</body>
    </html>
  )
}
