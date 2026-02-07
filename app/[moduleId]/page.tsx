/*
 * FILE: app/modules/[moduleId]/page.tsx
 * PURPOSE: Stránka pro konkrétní modul – spouští AppShell s initialModuleId
 */

import AppShell from '@/app/AppShell'

type ModulePageProps = {
  params: {
    moduleId: string
  }
}

export default function ModulePage({ params }: ModulePageProps) {
  return <AppShell initialModuleId={params.moduleId} />
}
