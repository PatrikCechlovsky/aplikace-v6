// FILE: app/modules/070-sluzby/tiles/ServiceCatalogCreateTile.tsx
// PURPOSE: Rychlé vytvoření nové služby v katalogu
// NOTES: Otevírá katalog služeb rovnou v režimu vytvoření

'use client'

import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import ServiceCatalogTile from './ServiceCatalogTile'

type ServiceCatalogCreateTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
}

export default function ServiceCatalogCreateTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: ServiceCatalogCreateTileProps) {
  return (
    <ServiceCatalogTile
      initialMode="create"
      onRegisterCommonActions={onRegisterCommonActions}
      onRegisterCommonActionsState={onRegisterCommonActionsState}
      onRegisterCommonActionHandler={onRegisterCommonActionHandler}
    />
  )
}
