/*
 * FILE: app/layout.tsx
 * PURPOSE: Kořenový layout aplikace – načtení globálních stylů a aplikace motivu (theme)
 */

import './globals.css'
import type { Metadata } from 'next'
import { uiConfig } from './lib/uiConfig'
import ErrorBoundary from './UI/ErrorBoundary'
import { ToastProvider } from './UI/Toast'

export const metadata: Metadata = {
  title: {
    default: 'Pronajímatel v6',
    template: '%s | Pronajímatel v6',
  },
  description: 'Profesionální aplikace pro správu nemovitostí, jednotek, nájemníků, smluv, plateb a dokumentů. Moderní modulární systém pro pronajímatelé.',
  keywords: ['pronajímatel', 'správa nemovitostí', 'nájem', 'smlouvy', 'platby', 'nemovitosti', 'správa bytů'],
  authors: [{ name: 'Patrik Cechlovsky' }],
  creator: 'Patrik Cechlovsky',
  publisher: 'Patrik Cechlovsky',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    url: '/',
    siteName: 'Pronajímatel v6',
    title: 'Pronajímatel v6 - Správa nemovitostí a nájmů',
    description: 'Profesionální aplikace pro správu nemovitostí, jednotek, nájemníků, smluv, plateb a dokumentů.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pronajímatel v6 - Správa nemovitostí a nájmů',
    description: 'Profesionální aplikace pro správu nemovitostí, jednotek, nájemníků, smluv, plateb a dokumentů.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const bodyClass = `theme-${uiConfig.theme}`

  return (
    <html lang="cs">
      <body className={bodyClass}>
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
