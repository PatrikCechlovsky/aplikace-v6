// FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
// PURPOSE: List + detail uživatelů (010) + pozvánky + přílohy.
// URL state:
// - t=users-list (list + detail)
// - t=invite-user (invite screen)
// - t=attachments-manager (attachments manager screen)
// - id + vm (detail: read/edit/create)

'use client'

// =====================
// 1) IMPORTS
// =====================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ListView, { type ListViewColumn, type ListViewRow, type ListViewSortState } from '@/app/UI/ListView'
import type { CommonActionId, ViewMode } from '@/app/UI/CommonActions'
import UserDetailFrame from '@/app/modules/010-sprava-uzivatelu/forms/UserDetailFrame'
import InviteUserFrame from '../forms/InviteUserFrame'
import AttachmentsManagerFrame, { type AttachmentsManagerApi, type AttachmentsManagerUiState } from '@/app/UI/attachments/AttachmentsManagerFrame'
import { listUsers, type UsersListRow } from '@/app/lib/services/users'
import { fetchRoleTypes, type RoleTypeRow } from '@/app/modules/900-nastaveni/services/roleTypes'
import { applyColumnPrefs, loadViewPrefs, saveViewPrefs, type ViewPrefs, type ViewPrefsSortState } from '@/app/lib/services/viewPrefs'
import ListViewColumnsDrawer from '@/app/UI/ListViewColumnsDrawer'
import { SkeletonTable } from '@/app/UI/SkeletonLoader'
import { useToast } from '@/app/UI/Toast'
import '@/app/styles/components/UsersTile.css'

// Type check for CommonActionId - removed unused variable

// =====================
// 2) TYPES
// =====================

type UiUser = {
  id: string
  displayName: string
  email: string
  phone?: string

  titleBefore?: string | null
  firstName?: string | null
  lastName?: string | null

  roleCode?: string | null
  roleLabel: string
  roleOrderIndex?: number | null
  roleColor?: string | null

  createdAt: string
  isArchived?: boolean

  firstLoginAt?: string | null
  lastLoginAt?: string | null

  lastInviteStatus?: string | null
  lastInviteSentAt?: string | null
  lastInviteExpiresAt?: string | null
}

type UsersTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
}

// ✅ lokální režimy (rozšiřujeme CommonActions ViewMode)
type LocalViewMode = ViewMode | 'list' | 'invite' | 'attachments-manager'

// =====================
// 3) HELPERS
// =====================
import createLogger from '@/app/lib/logger'
const logger = createLogger('010 UsersTile')

const VIEW_KEY = '010.users.list'

const BASE_COLUMNS: ListViewColumn[] = [
  { key: 'roleLabel', label: 'Role', width: 160, sortable: true },
  { key: 'displayName', label: 'Zobrazované jméno', width: 220, sortable: true },
  { key: 'lastName', label: 'Příjmení', width: 180, sortable: true },
  { key: 'firstName', label: 'Jméno', width: 160, sortable: true },
  { key: 'titleBefore', label: 'Titul', width: 100, sortable: true },
  { key: 'email', label: 'E-mail', width: 260, sortable: true },
  { key: 'lastLoginAt', label: 'Poslední přihlášení', width: 180, sortable: true },
  { key: 'lastInviteStatus', label: 'Pozvánka', width: 140, sortable: true },
  { key: 'isArchived', label: 'Archivován', width: 120, align: 'center', sortable: true },
]

function normalizeString(v: any): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function numberOrZero(v: any): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function roleCodeToLabel(code: string | null | undefined): string {
  const c = (code ?? '').trim().toLowerCase()
  if (!c) return ''
  if (c === 'admin') return 'Admin'
  if (c === 'user') return 'Uživatel'
  return c
}

type RoleMeta = {
  label: string
  color: string | null
  orderIndex: number | null
}

function buildRoleMetaMap(rows: RoleTypeRow[]): Record<string, RoleMeta> {
  const map: Record<string, RoleMeta> = {}
  for (const r of rows ?? []) {
    const code = String((r as any).code ?? '').trim().toLowerCase()
    if (!code) continue

    const name = String((r as any).name ?? '').trim()
    const color = ((r as any).color ?? null) as string | null
    const orderIndexRaw = (r as any).order_index
    const orderIndex = typeof orderIndexRaw === 'number' && Number.isFinite(orderIndexRaw) ? orderIndexRaw : null

    map[code] = {
      label: name || String((r as any).code ?? code),
      color: color && String(color).trim() ? String(color).trim() : null,
      orderIndex,
    }
  }
  return map
}

function resolveRoleMeta(roleCode: string | null | undefined, map: Record<string, RoleMeta>): RoleMeta {
  const c = String(roleCode ?? '').trim().toLowerCase()
  if (!c) return { label: '', color: null, orderIndex: null }
  return map[c] ?? { label: roleCodeToLabel(c), color: null, orderIndex: null }
}

function formatDateShort(v: any): string {
  const s = String(v ?? '').trim()
  if (!s) return ''
  // ISO -> YYYY-MM-DD (rychlé, bez nových importů)
  if (s.length >= 10) return s.slice(0, 10)
  return s
}

// Removed unused function dateSortValue

function mapRowToUi(row: UsersListRow, roleMap: Record<string, RoleMeta>): UiUser {
  const meta = resolveRoleMeta((row as any).role_code, roleMap)
  return {
    id: row.id,
    displayName: (row as any).display_name ?? '',
    email: (row as any).email ?? '',
    phone: (row as any).phone ?? undefined,

    titleBefore: (row as any).title_before ?? null,
    firstName: (row as any).first_name ?? null,
    lastName: (row as any).last_name ?? null,

    roleCode: (row as any).role_code ?? null,
    roleLabel: meta.label,
    roleOrderIndex: meta.orderIndex,
    roleColor: meta.color,

    createdAt: (row as any).created_at ?? '',
    isArchived: !!(row as any).is_archived,

    firstLoginAt: (row as any).first_login_at ?? null,
    lastLoginAt: (row as any).last_login_at ?? null,

    lastInviteStatus: (row as any).last_invite_status ?? null,
    lastInviteSentAt: (row as any).last_invite_sent_at ?? null,
    lastInviteExpiresAt: (row as any).last_invite_expires_at ?? null,
  }
}

function toRow(u: UiUser): ListViewRow<UiUser> {
  return {
    id: u.id,
    data: {
      roleLabel: u.roleColor ? (
        <span className="generic-type__name-badge" style={{ backgroundColor: u.roleColor }}>
          {u.roleLabel || '—'}
        </span>
      ) : (
        <span className="generic-type__name-main">{u.roleLabel || '—'}</span>
      ),

      displayName: u.displayName,
      lastName: u.lastName ?? '',
      firstName: u.firstName ?? '',
      titleBefore: u.titleBefore ?? '',

      email: u.email,

      lastLoginAt: u.lastLoginAt ? formatDateShort(u.lastLoginAt) : '',
      lastInviteStatus: u.lastInviteStatus ?? '',

      isArchived: u.isArchived ? 'Ano' : '',
    },
    raw: u,
  }
}

function getSortValue(u: UiUser, key: string): string | number {
  const norm = (v: any) => String(v ?? '').trim().toLowerCase()

  switch (key) {
    case 'roleLabel':
      return u.roleOrderIndex ?? 999999

    case 'displayName':
      return norm(u.displayName)
    case 'email':
      return norm(u.email)

    case 'lastName':
      return norm(u.lastName)
    case 'firstName':
      return norm(u.firstName)
    case 'titleBefore':
      return norm(u.titleBefore)

    case 'lastLoginAt':
      // řazení podle času (ISO)
      return (() => {
        const s = String(u.lastLoginAt ?? '').trim()
        if (!s) return 0
        const t = Date.parse(s)
        return Number.isFinite(t) ? t : 0
      })()

    case 'lastInviteStatus':
      return norm(u.lastInviteStatus)

    case 'isArchived':
      return u.isArchived ? 1 : 0

    default:
      return ''
  }
}

// =====================
// 4) DATA LOAD
// =====================

export default function UsersTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
}: UsersTileProps) {
  const toast = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams?.toString() ?? ''

  const [users, setUsers] = useState<UiUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterText, setFilterText] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailUser, setDetailUser] = useState<UiUser | null>(null)

  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')
  const [detailActiveSectionId, setDetailActiveSectionId] = useState<any>('detail')

  const [isDirty, setIsDirty] = useState(false)

  const [roleTypes, setRoleTypes] = useState<RoleTypeRow[]>([])
  const roleTypeMap = useMemo(() => buildRoleMetaMap(roleTypes), [roleTypes])
  const roleTypeMapRef = useRef<Record<string, RoleMeta>>({})

  const submitRef = useRef<null | (() => Promise<UiUser | null>)>(null)
  const inviteSubmitRef = useRef<null | (() => Promise<boolean>)>(null)

  const [invitePresetSubjectId, setInvitePresetSubjectId] = useState<string | null>(null)
  const [pendingSendInviteAfterCreate, setPendingSendInviteAfterCreate] = useState(false)
  const [attachmentsManagerSubjectId, setAttachmentsManagerSubjectId] = useState<string | null>(null)

  // ✅ Attachments manager bridge (API + UI state)
  const attachmentsManagerApiRef = useRef<AttachmentsManagerApi | null>(null)
  const [attachmentsManagerUi, setAttachmentsManagerUi] = useState<AttachmentsManagerUiState>({
    hasSelection: false,
    isDirty: false,
  })

  // ✅ DEFAULT sort pro Users (Role -> order_index)
  const DEFAULT_SORT: ListViewSortState = useMemo(() => ({ key: 'roleLabel', dir: 'asc' }), [])
  
  // ✅ v UI vždy držíme konkrétní sort (nikdy null)
  const [sort, setSort] = useState<ListViewSortState>(DEFAULT_SORT)
  
  // ✅ Column prefs (šířky/pořadí/viditelnost)
  const [colPrefs, setColPrefs] = useState<Pick<ViewPrefs, 'colWidths' | 'colOrder' | 'colHidden'>>({
    colWidths: {},
    colOrder: [],
    colHidden: [],
  })
  
  const columns = useMemo(() => {
    return applyColumnPrefs(BASE_COLUMNS, colPrefs)
  }, [colPrefs])
  
  // ✅ Columns drawer / dialog (UI state)
  const [colsOpen, setColsOpen] = useState(false)
  
  // ✅ Columns dialog constraints (Role první + Email povinný)
  const fixedFirstKey = 'roleLabel'
  const requiredKeys = ['email']
  
  // ✅ ListView prefs (persisted)
  const prefsLoadedRef = useRef(false)
  const saveTimerRef = useRef<any>(null)
  
  // ✅ Enforce: roleLabel vždy první + nikdy hidden (i když prefs přijdou rozbité)
  useEffect(() => {
    setColPrefs((prev) => {
      const order = Array.isArray(prev.colOrder) ? prev.colOrder : []
      const hidden = Array.isArray(prev.colHidden) ? prev.colHidden : []
  
      const nextOrder = [fixedFirstKey, ...order.filter((k) => k && k !== fixedFirstKey)]
      const nextHidden = hidden.filter((k) => k !== fixedFirstKey)
  
      const changed = nextOrder.join('|') !== order.join('|') || nextHidden.join('|') !== hidden.join('|')
      if (!changed) return prev
  
      return {
        ...prev,
        colOrder: nextOrder,
        colHidden: nextHidden,
      }
    })
  }, [])
  
  useEffect(() => {
    void (async () => {
      const prefs = await loadViewPrefs(VIEW_KEY, { v: 1, sort: null, colWidths: {}, colOrder: [], colHidden: [] })
  
      const loadedSort = (prefs.sort as ViewPrefsSortState) ?? null
      setSort(loadedSort ? loadedSort : DEFAULT_SORT)
  
      setColPrefs({
        colWidths: prefs.colWidths ?? {},
        colOrder: prefs.colOrder ?? [],
        colHidden: prefs.colHidden ?? [],
      })
  
      prefsLoadedRef.current = true
    })()
  }, [DEFAULT_SORT])
  
  useEffect(() => {
    if (!prefsLoadedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (!sort) return
  
    const persistSort: ViewPrefsSortState =
      sort.key === DEFAULT_SORT.key && sort.dir === DEFAULT_SORT.dir ? null : (sort as ViewPrefsSortState)
  
    const payload: ViewPrefs = {
      v: 1,
      sort: persistSort,
      colWidths: colPrefs.colWidths ?? {},
      colOrder: colPrefs.colOrder ?? [],
      colHidden: colPrefs.colHidden ?? [],
    }
  
    saveTimerRef.current = setTimeout(() => {
      void saveViewPrefs(VIEW_KEY, payload)
    }, 500)
  }, [sort, DEFAULT_SORT, colPrefs])
  
  // ✅ ListView může poslat null (třetí klik) = návrat na default
  const handleSortChange = useCallback(
    (next: ListViewSortState) => {
      setSort(next ?? DEFAULT_SORT)
    },
    [DEFAULT_SORT]
  )
  
  // ✅ Column resize (šířky sloupců)
  const handleColumnResize = useCallback((key: string, px: number) => {
    setColPrefs((p) => ({ ...p, colWidths: { ...(p.colWidths ?? {}), [key]: px } }))
  }, [])

  // -------------------------
  // URL helpers (t, id, vm, am)
  // -------------------------
  const setUrl = useCallback(
    (
      next: { t?: string | null; id?: string | null; vm?: string | null; am?: string | null },
      mode: 'replace' | 'push' = 'replace'
    ) => {
      const sp = new URLSearchParams(searchKey)

      const setOrDelete = (key: string, val: string | null | undefined) => {
        const v = (val ?? '').toString().trim()
        if (v) sp.set(key, v)
        else sp.delete(key)
      }

      if (Object.prototype.hasOwnProperty.call(next, 't')) setOrDelete('t', next.t)
      if (Object.prototype.hasOwnProperty.call(next, 'id')) setOrDelete('id', next.id)
      if (Object.prototype.hasOwnProperty.call(next, 'vm')) setOrDelete('vm', next.vm)
      if (Object.prototype.hasOwnProperty.call(next, 'am')) setOrDelete('am', next.am)

      const qs = sp.toString()
      const nextUrl = qs ? `${pathname}?${qs}` : pathname
      const currentUrl = searchKey ? `${pathname}?${searchKey}` : pathname

      logger.debug('setUrl()', { mode, next, searchKey, currentUrl, nextUrl, willNavigate: nextUrl !== currentUrl })

      if (nextUrl === currentUrl) return

      if (mode === 'push') router.push(nextUrl)
      else router.replace(nextUrl)
    },
    [pathname, router, searchKey]
  )

  // -------------------------
  // Load guards (anti-loop / anti-storm)
  // -------------------------
  const loadInFlightRef = useRef<Promise<void> | null>(null)
  const lastLoadKeyRef = useRef<string>('')

  const load = useCallback(async () => {
    const key = `${(filterText ?? '').trim().toLowerCase()}|${showArchived ? '1' : '0'}`

    if (loadInFlightRef.current && lastLoadKeyRef.current === key) return loadInFlightRef.current
    lastLoadKeyRef.current = key

    const p = (async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await listUsers({ searchText: filterText, includeArchived: showArchived })
        setUsers(rows.map((r) => mapRowToUi(r, roleTypeMapRef.current)))
      } catch (e: any) {
        logger.error('listUsers failed', e)
        setError(e?.message ?? 'Chyba načtení uživatelů')
      } finally {
        setLoading(false)
      }
    })()

    loadInFlightRef.current = p
    try {
      await p
    } finally {
      if (loadInFlightRef.current === p) loadInFlightRef.current = null
    }
  }, [filterText, showArchived])

  const roleTypesInFlightRef = useRef<Promise<void> | null>(null)
  const loadRoleTypes = useCallback(async () => {
    if (roleTypesInFlightRef.current) return roleTypesInFlightRef.current
    const p = (async () => {
      try {
        const rows = await fetchRoleTypes()
        setRoleTypes(rows)
      } catch (e) {
        logger.warn('fetchRoleTypes failed', e)
      }
    })()
    roleTypesInFlightRef.current = p
    try {
      await p
    } finally {
      if (roleTypesInFlightRef.current === p) roleTypesInFlightRef.current = null
    }
  }, [])

  useEffect(() => {
    roleTypeMapRef.current = roleTypeMap
  }, [roleTypeMap])

  useEffect(() => {
    void loadRoleTypes()
  }, [loadRoleTypes])

  useEffect(() => {
    void load()
  }, [load])
  
  // ✅ když se načtou roleTypes (barvy + order), přepočítej již načtené users
  useEffect(() => {
    if (!roleTypeMap || Object.keys(roleTypeMap).length === 0) return
  
    setUsers((prev) => {
      if (!prev?.length) return prev
  
      return prev.map((u) => {
        const meta = resolveRoleMeta(u.roleCode ?? null, roleTypeMap)
        return {
          ...u,
          roleLabel: meta.label,
          roleOrderIndex: meta.orderIndex,
          roleColor: meta.color,
        }
      })
    })
  }, [roleTypeMap])

  // ✅ mapa původního pořadí (jak přišlo z backendu) – stabilita řazení
  const baseOrderIndex = useMemo(() => {
    const m = new Map<string, number>()
    users.forEach((u, i) => m.set(u.id, i))
    return m
  }, [users])

  // ✅ sortedUsers (DEFAULT = roleOrderIndex ASC, email ASC)
  const sortedUsers = useMemo(() => {
    if (!sort) {
      // Default sort when sort is null
      return [...users].sort((a, b) => {
        const ao = a.roleOrderIndex ?? 999999
        const bo = b.roleOrderIndex ?? 999999
        if (ao !== bo) return ao - bo
        return (a.email ?? '').localeCompare(b.email ?? '', 'cs')
      })
    }
    const key = String(sort.key ?? '').trim()
    const dir = sort.dir === 'desc' ? -1 : 1
    const arr = [...users]

    // DEFAULT (role asc) má vlastní pravidla: order_index + email
    if (key === 'roleLabel' && dir === 1) {
      arr.sort((a, b) => {
        const ao = a.roleOrderIndex ?? 999999
        const bo = b.roleOrderIndex ?? 999999
        if (ao < bo) return -1
        if (ao > bo) return 1

        const ae = normalizeString(a.email)
        const be = normalizeString(b.email)
        if (ae < be) return -1
        if (ae > be) return 1

        return numberOrZero(baseOrderIndex.get(a.id)) - numberOrZero(baseOrderIndex.get(b.id))
      })
      return arr
    }

    // Obecné řazení dle klíče
    arr.sort((a, b) => {
      const av = getSortValue(a, key)
      const bv = getSortValue(b, key)

      if (typeof av === 'number' && typeof bv === 'number') {
        if (av < bv) return -1 * dir
        if (av > bv) return 1 * dir
      } else {
        const as = String(av ?? '')
        const bs = String(bv ?? '')
        if (as < bs) return -1 * dir
        if (as > bs) return 1 * dir
      }

      return numberOrZero(baseOrderIndex.get(a.id)) - numberOrZero(baseOrderIndex.get(b.id))
    })

    return arr
  }, [users, sort, baseOrderIndex])

  const listRows = useMemo<ListViewRow<UiUser>[]>(() => {
    return sortedUsers.map((u) => toRow(u))
  }, [sortedUsers])

  // =====================
  // 5) ACTION HANDLERS
  // =====================

  const closeListToModule = useCallback(() => {
    setUrl({ t: null, id: null, vm: null, am: null }, 'replace')
    router.push('/')
  }, [router, setUrl])

  const closeToList = useCallback(() => {
    setDetailUser(null)
    setDetailInitialSectionId('detail')
    setDetailActiveSectionId('detail')
    submitRef.current = null
    inviteSubmitRef.current = null
    setInvitePresetSubjectId(null)
    setAttachmentsManagerSubjectId(null)
    setIsDirty(false)
    setViewMode('list')
    setUrl({ t: 'users-list', id: null, vm: null, am: null }, 'replace')
  }, [setUrl])

  const openDetail = useCallback(
    (u: UiUser, vm: ViewMode, sectionId: any) => {
      setDetailUser(u)
      setDetailInitialSectionId(sectionId)
      setDetailActiveSectionId(sectionId)
      setIsDirty(false)
      setViewMode(vm as any)
      setUrl({ t: 'users-list', id: u.id, vm, am: null }, 'push')
    },
    [setUrl]
  )

  const openInvite = useCallback(
    (presetSubjectId: string | null) => {
      setInvitePresetSubjectId(presetSubjectId)
      setIsDirty(false)
      setViewMode('invite')
      setUrl({ t: 'invite-user', id: presetSubjectId, vm: null, am: null }, 'push')
    },
    [setUrl]
  )

  // -------------------------
  // CommonActions list
  // -------------------------
  const commonActions = useMemo<CommonActionId[]>(() => {
    const LIST: CommonActionId[] = ['add', 'view', 'edit', 'invite', 'columnSettings', 'close']
    const INVITE: CommonActionId[] = ['sendInvite', 'close']
    const READ_DEFAULT: CommonActionId[] = ['edit', 'invite', 'close']
    const EDIT_DEFAULT: CommonActionId[] = ['save', 'invite', 'close']
    const CREATE_DEFAULT: CommonActionId[] = ['save', 'close']

    const withAttachmentsBeforeClose = (base: CommonActionId[]): CommonActionId[] => {
      if (detailActiveSectionId === 'invite') return base

      const out: CommonActionId[] = base.includes('attachments') ? [...base] : [...base, 'attachments']
      const hasClose = out.includes('close')
      const filtered: CommonActionId[] = out.filter((x) => x !== 'attachments' && x !== 'close') as CommonActionId[]

      return hasClose ? ([...filtered, 'attachments', 'close'] as CommonActionId[]) : ([...filtered, 'attachments'] as CommonActionId[])
    }

    if (viewMode === 'list') return withAttachmentsBeforeClose(LIST)
    if (viewMode === 'invite') return INVITE

    if (viewMode === 'attachments-manager') {
      return ['attachmentsAdd', 'attachmentsEdit', 'attachmentsSave', 'attachmentsNewVersion', 'attachmentsHistory', 'columnSettings', 'close']
    }

    if (viewMode === 'read') {
      if (detailActiveSectionId === 'invite') return INVITE
      return withAttachmentsBeforeClose(READ_DEFAULT)
    }

    if (viewMode === 'edit') return withAttachmentsBeforeClose(EDIT_DEFAULT)
    return withAttachmentsBeforeClose(CREATE_DEFAULT)
  }, [viewMode, detailActiveSectionId])

  useEffect(() => {
    onRegisterCommonActions?.(commonActions)
  }, [onRegisterCommonActions, commonActions])

  useEffect(() => {
    const mappedViewMode: ViewMode =
      viewMode === 'list' ? 'list' : viewMode === 'edit' ? 'edit' : viewMode === 'create' ? 'create' : 'read'

    const mappedHasSelection = viewMode === 'attachments-manager' ? !!attachmentsManagerUi.hasSelection : !!selectedId
    const mappedIsDirty = viewMode === 'attachments-manager' ? !!attachmentsManagerUi.isDirty : !!isDirty

    onRegisterCommonActionsState?.({ viewMode: mappedViewMode, hasSelection: mappedHasSelection, isDirty: mappedIsDirty })
  }, [onRegisterCommonActionsState, viewMode, selectedId, isDirty, attachmentsManagerUi])

  // -------------------------
  // CommonActions handler
  // -------------------------
  useEffect(() => {
    if (!onRegisterCommonActionHandler) return
    logger.debug('register common action handler')

    const handler = async (actionId: CommonActionId) => {
      logger.debug('action click', actionId, { viewMode, isDirty, selectedId, detailUserId: detailUser?.id ?? null, searchKey })

      // ATTACHMENTS MANAGER ACTIONS
      // ATTACHMENTS MANAGER ACTIONS
      if (viewMode === 'attachments-manager') {
        // ✅ Close NECHCEME sežrat tady – musí propadnout níž do společného CLOSE bloku
        if (actionId === 'close') {
          // žádný return
        } else {
          const api = attachmentsManagerApiRef.current
          if (!api) return
      
          if (actionId === 'attachmentsAdd') {
            api.add()
            return
          }
      
          if (actionId === 'attachmentsEdit') {
            api.editMeta()
            return
          }
      
          if (actionId === 'attachmentsSave') {
            await api.save()
            return
          }
      
          if (actionId === 'attachmentsNewVersion') {
            api.newVersion()
            return
          }
      
          if (actionId === 'attachmentsHistory') {
            api.history()
            return
          }
      
          if (actionId === 'columnSettings') {
            api.columnSettings()
            return
          }
      
          return
        }
      }


      // CLOSE
      if (actionId === 'close') {
        const dirtyNow = String(viewMode) === 'attachments-manager' ? !!attachmentsManagerUi.isDirty : isDirty
        if (dirtyNow) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }

        const sp = new URLSearchParams(searchKey)
        const t = sp.get('t')?.trim() ?? null

        logger.debug('close branch start', { t, viewMode })

        if (String(viewMode) === 'attachments-manager') {
          logger.debug('close -> attachments-manager back to detail')
        
          const backId = attachmentsManagerSubjectId ?? detailUser?.id ?? null
          if (!backId) {
            closeToList()
            return
          }
        
          setDetailInitialSectionId('attachments')
          setDetailActiveSectionId('attachments')
        
          // ✅ jdi přes stejnou cestu jako ostatní přechody do detailu
          const backUser = users.find((u) => u.id === backId) ?? (detailUser?.id === backId ? detailUser : null)
          if (backUser) {
            openDetail(backUser, 'read', 'attachments')
          } else {
            closeToList()
          }
          return
        }

        if (t === 'invite-user') {
          logger.debug('close -> closeListToModule (t=invite-user)')
          closeListToModule()
          return
        }

        if (viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') {
          logger.debug('close -> closeToList (detail)')
          closeToList()
          return
        }

        logger.debug('close -> closeListToModule (list)')
        closeListToModule()
        return
      }

      // ATTACHMENTS open manager
      if (actionId === 'attachments') {
        if (viewMode === 'list') {
          logger.debug('attachments -> list', { selectedId })
          if (!selectedId) {
            toast.showWarning('Nejdřív vyber uživatele v seznamu.')
            return
          }
          setAttachmentsManagerSubjectId(selectedId)
          setViewMode('attachments-manager')
          setIsDirty(false)
          setUrl({ t: 'users-list', id: selectedId, vm: null, am: '1' }, 'push')
          return
        }

        if (detailActiveSectionId === 'invite') return
        if (isDirty) {
          toast.showWarning('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
          return
        }
        if (!detailUser?.id || !detailUser.id.trim() || detailUser.id === 'new') {
          toast.showWarning('Nejdřív ulož záznam, aby šly spravovat přílohy.')
          return
        }

        setAttachmentsManagerSubjectId(detailUser.id)
        setViewMode('attachments-manager')
        setIsDirty(false)
        setUrl({ t: 'users-list', id: detailUser.id, vm: null, am: '1' }, 'push')
        return
      }

      // LIST actions
      if (viewMode === 'list') {
        if (actionId === 'columnSettings') {
          setColsOpen(true)
          return
        }
        if (actionId === 'add') {
          setViewMode('create')

          const blank: UiUser = {
            id: 'new',
            displayName: '',
            email: '',
            roleLabel: '',
            createdAt: new Date().toISOString(),
          }

          setDetailUser(blank)
          setDetailInitialSectionId('detail')
          setDetailActiveSectionId('detail')
          setInvitePresetSubjectId(null)
          setAttachmentsManagerSubjectId(null)
          setIsDirty(false)
          submitRef.current = null
          inviteSubmitRef.current = null

          setUrl({ t: 'users-list', id: 'new', vm: 'create', am: null }, 'push')
          return
        }
               
        if (actionId === 'view' || actionId === 'edit') {
          if (!selectedId) return
          const u = users.find((x) => x.id === selectedId)
          if (!u) return
          openDetail(u, actionId === 'edit' ? 'edit' : 'read', 'detail')
          return
        }

        if (actionId === 'invite') {
          if (!selectedId) {
            openInvite(null)
            return
          }

          const u = users.find((x) => x.id === selectedId)
          if (!u) {
            openInvite(null)
            return
          }

          if (u.firstLoginAt) {
            toast.showWarning('Uživatel se již přihlásil – pozvánku nelze poslat znovu.')
            return
          }

          openDetail(u, 'read', 'invite')
          return
        }

        return
      }

      // INVITE screen
      if (viewMode === 'invite') {
        if (actionId === 'sendInvite') {
          if (!inviteSubmitRef.current) return
          const ok = await inviteSubmitRef.current()
          if (!ok) return
          setIsDirty(false)
          await load()
          return
        }
        return
      }

      // READ
      if (viewMode === 'read') {
        if (detailActiveSectionId === 'invite' && actionId === 'sendInvite') {
          if (!inviteSubmitRef.current) return
          const ok = await inviteSubmitRef.current()
          if (!ok) return
          setIsDirty(false)
          await load()
          return
        }

        if (actionId === 'edit') {
          setViewMode('edit')
          setUrl({ t: 'users-list', id: detailUser?.id ?? selectedId ?? null, vm: 'edit', am: null }, 'replace')
        }
        return
      }

      // EDIT / CREATE
      if (viewMode === 'edit' || viewMode === 'create') {
        if (actionId === 'invite') {
          if (isDirty) {
            toast.showWarning('Máš neuložené změny. Nejdřív ulož změny a pak pošli pozvánku.')
            return
          }

          if (!detailUser?.id?.trim() || detailUser.id === 'new') {
            toast.showWarning('Nejdřív ulož záznam, aby šla poslat pozvánka.')
            return
          }

          if ((detailUser as any)?.firstLoginAt) {
            toast.showWarning('Uživatel se již přihlásil – pozvánku nelze poslat znovu.')
            return
          }

          openInvite(detailUser.id)
          return
        }

        if (actionId === 'save') {
          if (!submitRef.current) {
            toast.showError('Chybí submit handler (submitRef).')
            return
          }

          const savedUser = await submitRef.current()
          if (!savedUser) return

          const wasCreate = viewMode === 'create' || detailUser?.id === 'new'

          setDetailUser(savedUser)
          setIsDirty(false)
          await load()

          setViewMode('read')
          setUrl({ t: 'users-list', id: savedUser.id, vm: 'read', am: null }, 'replace')

          if (wasCreate) {
            // Zobraz toast s akčním tlačítkem místo blocking modalu
            toast.showSuccess('Uživatel uložen', 8000, {
              label: 'Odeslat pozvánku',
              primary: true,
              onClick: () => {
                setDetailInitialSectionId('invite')
                setDetailActiveSectionId('invite')
                setPendingSendInviteAfterCreate(true)
              },
            })
          }

          return
        }

        return
      }
    }

    onRegisterCommonActionHandler(handler)
  }, [
    onRegisterCommonActionHandler,
    searchKey,
    viewMode,
    selectedId,
    users,
    openDetail,
    openInvite,
    load,
    isDirty,
    closeToList,
    closeListToModule,
    detailActiveSectionId,
    detailUser,
    setUrl,
    attachmentsManagerSubjectId,
    attachmentsManagerUi,
  ])

  useEffect(() => {
    if (!pendingSendInviteAfterCreate) return
    if (viewMode !== 'read') return
    if (detailActiveSectionId !== 'invite') return
    if (!inviteSubmitRef.current) return

    const run = async () => {
      const ok = await inviteSubmitRef.current?.()
      setPendingSendInviteAfterCreate(false)

      if (ok) {
        setIsDirty(false)
        await load()
        toast.showSuccess('Pozvánka odeslána')
      }
    }

    void run()
  }, [pendingSendInviteAfterCreate, viewMode, detailActiveSectionId, load])
  
  
  // =====================
  // 6) RENDER
  // =====================
  if (viewMode === 'list') {
    return (
      <div>
        {error && <div className="users-tile__error">{error}</div>}
        {loading ? (
          <div className="users-tile__loading-container">
            <SkeletonTable rows={8} columns={columns.length} />
          </div>
        ) : (
          <ListView<UiUser>
          columns={columns}
          rows={listRows}
          filterValue={filterText}
          onFilterChange={setFilterText}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          selectedId={selectedId ?? null}
          onRowClick={(row) => setSelectedId(String(row.id))}
          onRowDoubleClick={(row) => {
            const user = row.raw
            if (!user) return
            openDetail(user, 'read', 'detail')
          }}
          sort={sort}
          onSortChange={handleSortChange}
          onColumnResize={handleColumnResize}
        />
        )}

        <ListViewColumnsDrawer
          open={colsOpen}
          columns={BASE_COLUMNS}
          fixedFirstKey={fixedFirstKey}
          requiredKeys={requiredKeys}
          value={{
            order: colPrefs.colOrder ?? [],
            hidden: colPrefs.colHidden ?? [],
          }}
          onChange={(next) => {
            setColPrefs((p) => ({
              ...p,
              colOrder: next.order,
              colHidden: next.hidden,
            }))
          }}
          onReset={() => {
            setColPrefs((p) => ({
              ...p,
              colOrder: [],
              colHidden: [],
            }))
          }}
          onClose={() => setColsOpen(false)}
        />
      </div>
    )
  }



  if (viewMode === 'attachments-manager') {
    const managerId = attachmentsManagerSubjectId ?? ''
    const managerUser = users.find((u) => u.id === managerId) ?? (detailUser?.id === managerId ? detailUser : null)

    return (
      <AttachmentsManagerFrame
        entityType="subjects"
        entityId={managerId}
        entityLabel={managerUser?.displayName ?? null}
        canManage={true}
        readOnlyReason={null}
        onRegisterManagerApi={(api) => {
          attachmentsManagerApiRef.current = api
        }}
        onManagerStateChange={(s) => {
          setAttachmentsManagerUi(s)
        }}
      />
    )
  }

  if (viewMode === 'invite') {
    return (
      <InviteUserFrame
        presetSubjectId={invitePresetSubjectId}
        onDirtyChange={setIsDirty}
        onRegisterSubmit={(fn) => {
          inviteSubmitRef.current = fn
        }}
      />
    )
  }

  if ((viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') && detailUser) {
    return (
      <UserDetailFrame
        user={detailUser}
        viewMode={viewMode as ViewMode}
        initialSectionId={detailInitialSectionId}
        onActiveSectionChange={(id) => setDetailActiveSectionId(id as any)}
        onRegisterInviteSubmit={(fn) => {
          inviteSubmitRef.current = fn
        }}
        onDirtyChange={setIsDirty}
        onRegisterSubmit={(fn) => {
          submitRef.current = fn
        }}
      />
    )
  }

  return null
}
