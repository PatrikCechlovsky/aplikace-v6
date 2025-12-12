/*
 * FILE: app/layout.tsx
 * PURPOSE: Kořenový layout aplikace – načtení globálních stylů a aplikace motivu (theme)
 */

/* ============================
   UI COMPONENT STYLES (disabled)
   Budeme postupně odkomentovávat
=============================== */

/*
import './styles/components/AppIcon.css'
import './styles/components/Breadcrumbs.css'
import './styles/components/CommonActions.css'
import './styles/components/ConfigListWithForm.css'
import './styles/components/DetailView.css'
import './styles/components/EntityDetailFrame.css'
import './styles/components/EntityList.css'
import './styles/components/GenericTypeTile.css'
import './styles/components/HomeActions.css'
import './styles/components/HomeButton.css'
import './styles/components/ListView.css'
import './styles/components/LoginPanel.css'
import './styles/components/MfaSetupPanel.css'
import './styles/components/RelationListWithDetail.css'
import './styles/components/Sidebar.css'
import './styles/components/Tabs.css'
import './styles/components/TopMenu.css'
import './styles/components/AppShell.css'
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
