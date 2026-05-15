'use client'

// FILE: app/modules/070-sluzby/tiles/ServiceCatalogTypeTile.tsx
// PURPOSE: Wrapper pro ServiceCatalogTile s filtrem podle typu služby
// NOTES: Načítá service_types z generic_types a filtruje katalog podle category_id

import React, { useEffect, useState } from 'react'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import { listActiveByCategory } from '@/app/modules/900-nastaveni/services/genericTypes'
import createLogger from '@/app/lib/logger'
import ServiceCatalogTile from './ServiceCatalogTile'

const logger = createLogger('070 ServiceCatalogTypeTile')

type Props = {
  serviceTypeCode: string
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
}

export default function ServiceCatalogTypeTile({ serviceTypeCode, ...props }: Props) {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categoryLabel, setCategoryLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadType() {
      try {
        setLoading(true)
        const types = await listActiveByCategory('service_types')
        const match = types.find((t) => t.code === serviceTypeCode)
        if (!mounted) return
        setCategoryId(match?.id ?? null)
        setCategoryLabel(match?.name ?? serviceTypeCode)
      } catch (err) {
        logger.error('Načtení service_types selhalo', err)
        if (mounted) {
          setCategoryId(null)
          setCategoryLabel(serviceTypeCode)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadType()

    return () => {
      mounted = false
    }
  }, [serviceTypeCode])

  if (loading) {
    return (
      <div className="tile-layout">
        <div className="tile-layout__header">
          <h1 className="tile-layout__title">📋 Katalog služeb</h1>
        </div>
        <div className="tile-layout__content">Načítání…</div>
      </div>
    )
  }

  return (
    <ServiceCatalogTile
      {...props}
      categoryIdFilter={categoryId}
      categoryLabel={categoryLabel}
    />
  )
}
