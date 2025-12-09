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
/* Režim zobrazení ikon – přepíná se class na .layout
   .icons-mode-icons – výchozí (ikony + text)
   .icons-mode-text  – textový režim (ikony skryté) */

.layout.icons-mode-text .sidebar__icon,
.layout.icons-mode-text .sidebar__subicon,
.layout.icons-mode-text .breadcrumbs__icon,
.layout.icons-mode-text .common-actions__icon,
.layout.icons-mode-text .home-button__icon {
  display: none;
}

/* V textovém režimu necháme popisky tlačítek vždy plně viditelné */
.layout.icons-mode-text .common-actions__label {
  opacity: 1;
  max-width: none;
}
