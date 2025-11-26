// app/layout.tsx

import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pronajímatel v6',
  description: 'Správa nájmů',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  )
}
