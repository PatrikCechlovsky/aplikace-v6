/*
 * FILE: app/page.tsx
 * PURPOSE: Root stránka – spouští AppShell bez předvoleného modulu (dashboard)
 */

import AppShell from '@/app/AppShell'

export default function HomePage() {
  return <AppShell />
}
