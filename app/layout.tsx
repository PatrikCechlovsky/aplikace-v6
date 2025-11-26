// FILE: app/layout.tsx

import './globals.css'

export const metadata = {
  title: 'Aplikace v6',
  description: 'Pronajímatel – správa nemovitostí v6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-gray-100">
        {children}
      </body>
    </html>
  )
}
