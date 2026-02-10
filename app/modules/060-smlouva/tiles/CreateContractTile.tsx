// FILE: app/modules/060-smlouva/tiles/CreateContractTile.tsx
// PURPOSE: Tile pro vytvoření nové smlouvy (přímý create mode)
// NOTES: Jednoduchý wrapper okolo ContractDetailFrame

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { useToast } from '@/app/UI/Toast'
import ContractDetailFrame, { type UiContract as DetailUiContract } from '../forms/ContractDetailFrame'

import '@/app/styles/components/TileLayout.css'

type Props = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

function createEmptyContract(): DetailUiContract {
  return {
    id: 'new',
    cisloSmlouvy: '',
    stav: '',
    landlordId: null,
    tenantId: null,
    landlordAccountId: null,
    tenantAccountId: null,
    landlordDelegateId: null,
    tenantDelegateId: null,
    pocetUzivatelu: null,
    propertyId: null,
    unitId: null,
    pomerPlochyKNemovitosti: null,
    datumPodpisu: null,
    datumZacatek: '',
    datumKonec: null,
    dobaNeurcita: false,
    najemVyse: null,
    periodicitaNajmu: '',
    denPlatby: '',
    kaucePotreba: false,
    kauceCastka: null,
    pozadovanyDatumKauce: null,
    stavKauce: '',
    stavNajmu: '',
    stavPlatebSmlouvy: '',
    poznamky: '',
    isArchived: false,
    createdAt: null,
    createdBy: null,
    updatedAt: null,
    updatedBy: null,
  }
}

export default function CreateContractTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: Props) {
  const toast = useToast()
  const router = useRouter()
  const [detailContract] = useState<DetailUiContract>(() => createEmptyContract())
  const [isDirty, setIsDirty] = useState(false)
  const submitRef = useRef<null | (() => Promise<DetailUiContract | null>)>(null)

  useEffect(() => {
    if (!onRegisterCommonActions || !onRegisterCommonActionsState) return

    onRegisterCommonActions(['save', 'close'])
    onRegisterCommonActionsState({
      viewMode: 'create',
      hasSelection: false,
      isDirty,
    })
  }, [isDirty])

  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      if (id === 'close') {
        if (isDirty) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }
        router.push('/060-smlouva?t=contracts-list')
        return
      }

      if (id === 'save') {
        if (submitRef.current) {
          const saved = await submitRef.current()
          if (saved) {
            toast.showSuccess('Smlouva byla úspěšně vytvořena')
            router.push(`/060-smlouva?t=contracts-list&id=${saved.id}&vm=read`)
          }
        }
      }
    })
  }, [isDirty, router, toast])

  return (
    <ContractDetailFrame
      contract={detailContract}
      viewMode="create"
      onRegisterSubmit={(fn) => (submitRef.current = fn)}
      onDirtyChange={setIsDirty}
      onSaved={(saved) => {
        setIsDirty(false)
        router.push(`/060-smlouva?t=contracts-list&id=${saved.id}&vm=read`)
      }}
    />
  )
}
