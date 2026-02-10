// FILE: app/modules/060-smlouva/tiles/ContractsTile.tsx
// PURPOSE: List + detail smluv (060) s vazbami na jednotky a nájemníky
// URL state:
// - t=contracts-list (list + detail)
// - id + vm (detail: read/edit/create)
// - am=1 (attachments manager)

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ListView, { type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import type { DetailSectionId } from '@/app/UI/DetailView'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs } from '@/app/lib/services/viewPrefs'
import AttachmentsManagerFrame, { type AttachmentsManagerApi, type AttachmentsManagerUiState } from '@/app/UI/attachments/AttachmentsManagerFrame'
import { getContractDetail, listContracts, type ContractsListRow } from '@/app/lib/services/contracts'
import { formatDate } from '@/app/lib/formatters/formatDateTime'
import ContractDetailFrame, { type UiContract as DetailUiContract } from '../forms/ContractDetailFrame'
import { CONTRACTS_BASE_COLUMNS } from '../contractsColumns'
import {
  getAttachmentsManagerActions,
  mapAttachmentsViewMode,
  getHasSelection,
  getIsDirty,
  shouldCloseAttachmentsPanel,
} from '@/app/lib/attachments/attachmentsManagerUtils'

import '@/app/styles/components/TileLayout.css'

const logger = createLogger('060 ContractsTile')

type ContractsTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: ((id: CommonActionId) => void) | null) => void
}

type LocalViewMode = ViewMode | 'list' | 'attachments-manager'

const VIEW_KEY = '060.contracts.list'

type UiContractRow = {
  id: string
  contractNumber: string
  status: string
  tenantName: string
  unitName: string
  propertyName: string
  validFrom: string | null
  validTo: string | null
  paymentState: string
  isArchived: boolean
}

function mapRowToUi(row: ContractsListRow): UiContractRow {
  return {
    id: row.id,
    contractNumber: row.cislo_smlouvy || '—',
    status: row.stav || '—',
    tenantName: row.tenant_name || '—',
    unitName: row.unit_name || '—',
    propertyName: row.property_name || '—',
    validFrom: row.datum_zacatek || null,
    validTo: row.doba_neurcita ? null : row.datum_konec || null,
    paymentState: row.stav_plateb_smlouvy || '—',
    isArchived: !!row.is_archived,
  }
}

function toRow(c: UiContractRow): ListViewRow<UiContractRow> {
  return {
    id: c.id,
    data: {
      contractNumber: c.contractNumber,
      status: c.status,
      tenantName: c.tenantName,
      unitName: c.unitName,
      propertyName: c.propertyName,
      validFrom: formatDate(c.validFrom),
      validTo: c.validTo ? formatDate(c.validTo) : '—',
      paymentState: c.paymentState,
    },
    className: c.isArchived ? 'row--archived' : undefined,
    raw: c,
  }
}

function normalizeString(v: any): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getSortValue(c: UiContractRow, key: string): string | number {
  switch (key) {
    case 'contractNumber':
      return normalizeString(c.contractNumber)
    case 'status':
      return normalizeString(c.status)
    case 'tenantName':
      return normalizeString(c.tenantName)
    case 'unitName':
      return normalizeString(c.unitName)
    case 'propertyName':
      return normalizeString(c.propertyName)
    case 'validFrom':
      return c.validFrom ? new Date(c.validFrom).getTime() : 0
    case 'validTo':
      return c.validTo ? new Date(c.validTo).getTime() : 0
    case 'paymentState':
      return normalizeString(c.paymentState)
    default:
      return ''
  }
}

function createEmptyContract(): DetailUiContract {
  return {
    id: 'new',
    cisloSmlouvy: '',
    stav: '',
    landlordId: null,
    tenantId: null,
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

export default function ContractsTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: ContractsTileProps) {
  const toast = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams?.toString() ?? ''

  const [contracts, setContracts] = useState<UiContractRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterInput, setFilterInput] = useState('')
  const [filterText, setFilterText] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setFilterText(filterInput), 400)
    return () => clearTimeout(timer)
  }, [filterInput])

  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailContract, setDetailContract] = useState<DetailUiContract | null>(null)
  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')
  const [isDirty, setIsDirty] = useState(false)
  const submitRef = useRef<null | (() => Promise<DetailUiContract | null>)>(null)

  const [attachmentsManagerContractId, setAttachmentsManagerContractId] = useState<string | null>(null)
  const [attachmentsManagerUi, setAttachmentsManagerUi] = useState<AttachmentsManagerUiState>({
    hasSelection: false,
    isDirty: false,
    mode: 'list',
  })
  const attachmentsManagerApiRef = useRef<AttachmentsManagerApi | null>(null)

  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })
  const [colsOpen, setColsOpen] = useState(false)
  const DEFAULT_SORT: ListViewSortState = useMemo(() => ({ key: 'validFrom', dir: 'desc' }), [])
  const [sort, setSort] = useState<ListViewSortState>(DEFAULT_SORT)

  const columns = useMemo(() => applyColumnPrefs(CONTRACTS_BASE_COLUMNS, colPrefs), [colPrefs])

  useEffect(() => {
    async function loadPrefs() {
      const prefs = await loadViewPrefs(VIEW_KEY, {
        colWidths: {},
        colOrder: [],
        colHidden: [],
        sort: DEFAULT_SORT,
      })
      if (prefs) {
        setColPrefs({
          colWidths: prefs.colWidths || {},
          colOrder: prefs.colOrder || [],
          colHidden: prefs.colHidden || [],
        })
        if (prefs.sort) setSort(prefs.sort)
      }
    }
    void loadPrefs()
  }, [DEFAULT_SORT])

  useEffect(() => {
    async function persist() {
      await saveViewPrefs(VIEW_KEY, {
        colWidths: colPrefs.colWidths ?? {},
        colOrder: colPrefs.colOrder ?? [],
        colHidden: colPrefs.colHidden ?? [],
        sort,
      })
    }
    void persist()
  }, [sort, colPrefs])

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const rows = await listContracts({ includeArchived: showArchived, searchText: filterText })
        if (!mounted) return
        setContracts(rows.map(mapRowToUi))
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message ?? 'Chyba při načítání smluv')
        logger.error('listContracts failed', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [showArchived, filterText])

  const filteredContracts = useMemo(() => {
    const q = normalizeString(filterText)
    if (!q) return contracts

    return contracts.filter((c) => {
      const hay = [c.contractNumber, c.status, c.tenantName, c.unitName, c.propertyName, c.paymentState]
        .join(' ')
      return normalizeString(hay).includes(q)
    })
  }, [contracts, filterText])

  const sortedContracts = useMemo(() => {
    if (!sort) return filteredContracts
    const { key, dir } = sort
    const sorted = [...filteredContracts].sort((a, b) => {
      const va = getSortValue(a, key)
      const vb = getSortValue(b, key)
      if (va < vb) return dir === 'asc' ? -1 : 1
      if (va > vb) return dir === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredContracts, sort])

  const rows = useMemo(() => sortedContracts.map(toRow), [sortedContracts])

  useEffect(() => {
    if (!searchParams) return

    const id = searchParams.get('id')?.trim() ?? null
    const vm = (searchParams.get('vm')?.trim() || 'list') as LocalViewMode
    const am = searchParams.get('am')

    if (am === '1' && id) {
      setViewMode('attachments-manager')
      setAttachmentsManagerContractId(id)
      return
    }

    if (!id) return

    setSelectedId(id)
    setViewMode(vm)
  }, [searchKey, searchParams])

  useEffect(() => {
    if (!onRegisterCommonActions || !onRegisterCommonActionsState) return

    const actions: CommonActionId[] = []

    if (viewMode === 'attachments-manager') {
      const mode = attachmentsManagerUi.mode ?? 'list'
      actions.push(...getAttachmentsManagerActions(mode, !!attachmentsManagerUi.hasSelection))
    } else if (viewMode === 'list') {
      actions.push('add')
      if (selectedId) actions.push('view', 'edit', 'attachments')
      actions.push('close')
    } else if (viewMode === 'edit' || viewMode === 'create') {
      actions.push('save')
      if (viewMode === 'edit') actions.push('attachments')
      actions.push('close')
    } else if (viewMode === 'read') {
      actions.push('edit', 'attachments', 'close')
    }

    onRegisterCommonActions(actions)

    const mappedViewMode = mapAttachmentsViewMode(viewMode as any, attachmentsManagerUi.mode ?? 'list')
    const mappedHasSelection = getHasSelection(viewMode as any, selectedId, attachmentsManagerUi)
    const mappedIsDirty = getIsDirty(viewMode as any, isDirty, attachmentsManagerUi)

    onRegisterCommonActionsState({
      viewMode: mappedViewMode,
      hasSelection: mappedHasSelection,
      isDirty: mappedIsDirty,
    })
  }, [viewMode, selectedId, isDirty, attachmentsManagerUi.mode, attachmentsManagerUi.hasSelection, attachmentsManagerUi.isDirty])

  const closeToList = useCallback(() => {
    setDetailContract(null)
    setDetailInitialSectionId('detail')
    submitRef.current = null
    setIsDirty(false)
    setViewMode('list')
    setSelectedId(null)
    setAttachmentsManagerContractId(null)
    router.push(`${pathname}?t=contracts-list`)
  }, [router, pathname])

  const closeListToModule = useCallback(() => {
    router.push('/')
  }, [router])

  const openDetail = useCallback(
    async (c: UiContractRow, vm: 'read' | 'edit', sectionId: DetailSectionId = 'detail') => {
      try {
        const detail = await getContractDetail(c.id)
        const d = detail.contract
        const resolved: DetailUiContract = {
          id: d.id,
          cisloSmlouvy: d.cislo_smlouvy,
          stav: d.stav,
          landlordId: d.landlord_id,
          tenantId: d.tenant_id,
          pocetUzivatelu: d.pocet_uzivatelu,
          propertyId: d.property_id,
          unitId: d.unit_id,
          pomerPlochyKNemovitosti: d.pomer_plochy_k_nemovitosti,
          datumPodpisu: d.datum_podpisu,
          datumZacatek: d.datum_zacatek,
          datumKonec: d.datum_konec,
          dobaNeurcita: d.doba_neurcita,
          najemVyse: d.najem_vyse,
          periodicitaNajmu: d.periodicita_najmu,
          denPlatby: d.den_platby,
          kaucePotreba: d.kauce_potreba,
          kauceCastka: d.kauce_castka,
          pozadovanyDatumKauce: d.pozadovany_datum_kauce,
          stavKauce: d.stav_kauce,
          stavNajmu: d.stav_najmu,
          stavPlatebSmlouvy: d.stav_plateb_smlouvy,
          poznamky: d.poznamky,
          isArchived: d.is_archived,
          createdAt: d.created_at,
          createdBy: d.created_by,
          updatedAt: d.updated_at,
          updatedBy: d.updated_by,
        }

        setDetailContract(resolved)
        setDetailInitialSectionId(sectionId)
        setViewMode(vm)
      } catch (err: any) {
        logger.error('getContractDetail failed', err)
        toast.showError(err?.message ?? 'Chyba při načítání smlouvy')
      }
    },
    [toast]
  )

  const openCreate = useCallback(() => {
    setDetailContract(createEmptyContract())
    setDetailInitialSectionId('detail')
    setViewMode('create')
    setIsDirty(false)
  }, [])

  useEffect(() => {
    if (!onRegisterCommonActionHandler) return

    onRegisterCommonActionHandler(async (id: CommonActionId) => {
      if (viewMode === 'attachments-manager') {
        const api = attachmentsManagerApiRef.current

        if (id === 'add') {
          api?.add?.()
          return
        }
        if (id === 'view' || id === 'detail') {
          api?.view?.()
          return
        }
        if (id === 'edit') {
          api?.edit?.()
          return
        }
        if (id === 'save') {
          api?.save?.()
          return
        }
        if (id === 'attachmentsNewVersion') {
          api?.newVersion?.()
          return
        }
        if (id === 'close') {
          const mode = attachmentsManagerUi.mode ?? 'list'
          if (shouldCloseAttachmentsPanel(mode)) {
            api?.close?.()
            return
          }

          const backId = attachmentsManagerContractId ?? detailContract?.id ?? selectedId
          if (!backId) {
            closeToList()
            return
          }

          setDetailInitialSectionId('attachments')
          const backRow = contracts.find((c) => c.id === backId)
          if (backRow) {
            await openDetail(backRow, 'read', 'attachments')
            return
          }

          setViewMode('read')
          setSelectedId(backId)
          router.push(`${pathname}?t=contracts-list&id=${backId}&vm=read`)
          return
        }

        return
      }

      if (id === 'close') {
        if (viewMode === 'list') {
          closeListToModule()
          return
        }
        if (isDirty) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }
        closeToList()
        return
      }

      if (id === 'add') {
        openCreate()
        return
      }

      if (id === 'view' && selectedId) {
        const row = contracts.find((c) => c.id === selectedId)
        if (row) await openDetail(row, 'read')
        return
      }

      if (id === 'edit' && selectedId) {
        const row = contracts.find((c) => c.id === selectedId)
        if (row) await openDetail(row, 'edit')
        return
      }

      if (id === 'attachments' && selectedId) {
        setAttachmentsManagerContractId(selectedId)
        setViewMode('attachments-manager')
        return
      }

      if (id === 'save') {
        if (submitRef.current) {
          const saved = await submitRef.current()
          if (saved) {
            toast.showSuccess('Smlouva byla uložena')
            closeToList()
          }
        }
      }
    })
  }, [
    onRegisterCommonActionHandler,
    viewMode,
    isDirty,
    selectedId,
    contracts,
    closeListToModule,
    closeToList,
    openCreate,
    openDetail,
    attachmentsManagerUi,
    toast,
  ])

  if (loading && viewMode === 'list') {
    return <SkeletonTable />
  }

  if (error && viewMode === 'list') {
    return <div className="tile-layout__error">{error}</div>
  }

  if (viewMode === 'attachments-manager' && attachmentsManagerContractId) {
    return (
      <AttachmentsManagerFrame
        entityType="contracts"
        entityId={attachmentsManagerContractId}
        entityLabel={detailContract?.cisloSmlouvy ?? null}
        canManage={true}
        onRegisterManagerApi={(api) => (attachmentsManagerApiRef.current = api)}
        onManagerStateChange={setAttachmentsManagerUi}
      />
    )
  }

  if (detailContract && (viewMode === 'read' || viewMode === 'edit' || viewMode === 'create')) {
    return (
      <ContractDetailFrame
        key={`${detailContract.id}-${viewMode}`}
        contract={detailContract}
        viewMode={viewMode}
        initialSectionId={detailInitialSectionId}
        onActiveSectionChange={setDetailInitialSectionId}
        onRegisterSubmit={(fn) => (submitRef.current = fn)}
        onDirtyChange={setIsDirty}
        onSaved={(saved) => {
          setDetailContract(saved)
          setIsDirty(false)
          setSelectedId(saved.id)
          router.push(`${pathname}?t=contracts-list&id=${saved.id}&vm=read`)
        }}
      />
    )
  }

  return (
    <div className="tile-layout">
      <div className="tile-layout__header">
        <h1 className="tile-layout__title">Smlouvy</h1>
        <p className="tile-layout__description">Přehled nájemních smluv a jejich vazeb na jednotky.</p>
      </div>

      <div className="tile-layout__content">
        <ListView
          columns={columns}
          rows={rows}
          filterValue={filterInput}
          onFilterChange={setFilterInput}
          filterPlaceholder="Hledat podle čísla smlouvy, nájemníka, jednotky..."
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          emptyText="Žádné smlouvy nejsou k dispozici."
          selectedId={selectedId}
          onRowClick={(row) => setSelectedId(String(row.id))}
          onRowDoubleClick={(row) => {
            const found = contracts.find((c) => c.id === row.id)
            if (found) {
              void openDetail(found, 'read')
            }
          }}
          sort={sort}
          onSortChange={setSort}
          onColumnResize={(key, widthPx) =>
            setColPrefs((prev) => ({
              ...prev,
              colWidths: { ...prev.colWidths, [key]: widthPx },
            }))
          }
          onColumnSettings={() => setColsOpen(true)}
        />

        <ListViewColumnsDrawer
          open={colsOpen}
          onClose={() => setColsOpen(false)}
          columns={CONTRACTS_BASE_COLUMNS}
          fixedFirstKey="contractNumber"
          requiredKeys={['contractNumber']}
          value={{
            order: colPrefs.colOrder ?? [],
            hidden: colPrefs.colHidden ?? [],
          }}
          sortBy={sort ?? undefined}
          onChange={(next) =>
            setColPrefs((p) => ({
              ...p,
              colOrder: next.order,
              colHidden: next.hidden,
            }))
          }
          onSortChange={(newSort) => setSort(newSort)}
          onReset={() => {
            setColPrefs({ colWidths: {}, colOrder: [], colHidden: [] })
            setSort(DEFAULT_SORT)
          }}
        />
      </div>
    </div>
  )
}
