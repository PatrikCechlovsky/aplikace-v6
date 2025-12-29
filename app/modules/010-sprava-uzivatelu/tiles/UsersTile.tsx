'use client'

// ============================================================================
// 0) HEADER
// ============================================================================
// FILE: app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx
// MODULE: 010 Správa uživatelů
// PURPOSE: List + detail + invite + attachments manager (📎)
// RULES:
// - Tabs Přílohy v detailu = read-only (řeší UserDetailFrame -> DetailAttachmentsSection variant="list")
// - 📎 (CommonActions) otevírá samostatný screen = AttachmentsManagerFrame (variant="manager")

// ============================================================================
// 1) IMPORTS
// ============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import CommonActions from '@/app/UI/CommonActions'
import type { CommonActionId } from '@/app/UI/CommonActions'
import ListView, { type ListViewRow } from '@/app/UI/ListView'

import { supabase } from '@/app/lib/supabaseClient'
import AttachmentsManagerFrame from '@/app/UI/attachments/AttachmentsManagerFrame'

// ✅ FIX: frames -> forms (frames složka v projektu není)
import InviteUserFrame from '../forms/InviteUserFrame'
import UserDetailFrame from '../forms/UserDetailFrame'

// ✅ FIX: helpers/roles neexistuje -> řešíme lokálně
import type { ViewMode } from '../types'

// ============================================================================
// 2) TYPES
// ============================================================================
type TileTab = 'users-list' | 'invite-user' | 'attachments-manager'
type UrlSetMode = 'push' | 'replace'

type SetUrlArgs = {
  t: TileTab
  id: string | null
  vm: ViewMode | null
}

type UsersTileProps = {
  searchKey: string
  onSetUrl: (nextSearchKey: string, mode: UrlSetMode) => void
  onCloseModule: () => void
}

type UiUser = {
  id: string
  displayName: string
  email: string
  roleCode?: string | null
  roleLabel: string
  twoFactorMethod?: string | null
  createdAt: string
  isArchived?: boolean
  firstLoginAt?: string | null
}

// local viewMode rozšíření
type LocalViewMode = ViewMode | 'list' | 'invite' | 'attachments-manager'

// ============================================================================
// 3) HELPERS
// ============================================================================
const DEBUG = false
function dbg(...args: any[]) {
  if (!DEBUG) return
  // eslint-disable-next-line no-console
  console.log('[010 UsersTile]', ...args)
}

// ✅ FIX: chybějící normalizeSupabaseError (dřív se volalo, ale nebylo nikde)
function normalizeSupabaseError(e: any): string {
  if (!e) return 'Neznámá chyba'
  if (typeof e === 'string') return e
  if (typeof e?.message === 'string' && e.message.trim()) return e.message
  if (typeof e?.error_description === 'string' && e.error_description.trim()) return e.error_description
  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
  }
}

function buildSearchKey(args: SetUrlArgs): string {
  const sp = new URLSearchParams()
  sp.set('m', '010-sprava-uzivatelu')
  sp.set('t', args.t)
  if (args.id) sp.set('id', args.id)
  if (args.vm) sp.set('vm', args.vm)
  return sp.toString()
}

// ✅ FIX: role label lokálně (místo ../helpers/roles)
function resolveRoleLabel(roleCode: string | null | undefined, roleMap: Record<string, string>): string {
  const c = String(roleCode ?? '').trim()
  if (!c) return ''
  return roleMap[c] ?? c
}

function toUiUser(row: any, roleMap: Record<string, string>): UiUser {
  return {
    id: row?.id ?? '',
    displayName: row?.display_name ?? '',
    email: row?.email ?? '',
    roleCode: (row as any).role_code ?? null,
    roleLabel: resolveRoleLabel((row as any).role_code, roleMap),
    twoFactorMethod: (row as any).two_factor_method ?? null,
    createdAt: (row as any).created_at ?? '',
    isArchived: !!(row as any).is_archived,
    firstLoginAt: (row as any).first_login_at ?? null,
  }
}

function toRow(u: UiUser): ListViewRow<UiUser> {
  return {
    id: u.id,
    data: {
      roleLabel: u.roleLabel,
      displayName: u.displayName,
      email: u.email,
      twoFactorMethod: u.twoFactorMethod ?? '—',
      createdAt: u.createdAt,
    },
    raw: u,
  }
}
// ============================================================================
// 4) DATA LOAD
// ============================================================================
export default function UsersTile({ searchKey, onSetUrl, onCloseModule }: UsersTileProps) {
  // 4.1) state
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const [users, setUsers] = useState<UiUser[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<LocalViewMode>('list')
  const [detailUser, setDetailUser] = useState<UiUser | null>(null)

  const [detailInitialSectionId, setDetailInitialSectionId] = useState<any>('detail')
  const [detailActiveSectionId, setDetailActiveSectionId] = useState<any>('detail')

  const [invitePresetSubjectId, setInvitePresetSubjectId] = useState<string | null>(null)

  // attachments manager
  const [attachmentsManagerSubjectId, setAttachmentsManagerSubjectId] = useState<string | null>(null)

  // submit refs
  const submitRef = useRef<null | (() => Promise<any>)>(null)
  const inviteSubmitRef = useRef<null | (() => Promise<any>)>(null)

  const [isDirty, setIsDirty] = useState(false)

  // 4.2) setUrl wrapper
  const setUrl = useCallback(
    (next: SetUrlArgs, mode: UrlSetMode) => {
      const nextSearchKey = buildSearchKey(next)
      dbg('setUrl()', { mode, next, searchKey, nextSearchKey })
      onSetUrl(nextSearchKey, mode)
    },
    [onSetUrl, searchKey]
  )

  // 4.3) loaders
  const load = useCallback(async () => {
    setLoading(true)
    setErrorText(null)
    try {
      const { data: rolesData, error: rolesErr } = await supabase.from('roles').select('code,label').eq('is_archived', false)
      if (rolesErr) throw rolesErr

      const roleMap: Record<string, string> = {}
      for (const r of rolesData ?? []) roleMap[String((r as any).code)] = String((r as any).label ?? '')

      const { data, error } = await supabase.from('v_users_with_role').select('*').order('display_name', { ascending: true })
      if (error) throw error

      setUsers((data ?? []).map((row: any) => toUiUser(row, roleMap)))
    } catch (e: any) {
      setErrorText(normalizeSupabaseError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // 4.4) URL -> state sync
  useEffect(() => {
    const sp = new URLSearchParams(searchKey)
    const t = (sp.get('t')?.trim() ?? 'users-list') as TileTab
    const id = sp.get('id')?.trim() ?? null
    const vm = (sp.get('vm')?.trim() as ViewMode | null) ?? null

    dbg('URL->state', { t, id, vm, viewMode })

    // INVITE
    if (t === 'invite-user') {
      if (viewMode !== 'invite') setViewMode('invite')
      setDetailUser(null)
      setInvitePresetSubjectId(null)
      setAttachmentsManagerSubjectId(null)
      submitRef.current = null
      inviteSubmitRef.current = null
      setIsDirty(false)
      return
    }

    // ATTACHMENTS MANAGER
    if (t === 'attachments-manager') {
      if (!id) return
      if (attachmentsManagerSubjectId !== id) setAttachmentsManagerSubjectId(id)
      if (viewMode !== 'attachments-manager') setViewMode('attachments-manager')
      if (selectedId !== id) setSelectedId(id)
      setIsDirty(false)
      return
    }

    // USERS LIST/DETAIL
    const safeVm: ViewMode = vm === 'edit' || vm === 'create' || vm === 'read' ? vm : 'read'

    // CREATE route
    if (safeVm === 'create' && (id === 'new' || !id)) {
      if (viewMode !== 'create') setViewMode('create')

      if (!detailUser || detailUser.id !== 'new') {
        setDetailUser({
          id: 'new',
          displayName: '',
          email: '',
          roleLabel: '',
          createdAt: new Date().toISOString(),
        })
      }

      setDetailInitialSectionId('detail')
      setDetailActiveSectionId('detail')
      setInvitePresetSubjectId(null)
      setAttachmentsManagerSubjectId(null)
      submitRef.current = null
      inviteSubmitRef.current = null
      setIsDirty(false)
      return
    }

    // LIST (bez id)
    if (!id) {
      if (viewMode !== 'list') setViewMode('list')
      if (selectedId !== null) setSelectedId(null)
      setDetailUser(null)
      setInvitePresetSubjectId(null)
      setAttachmentsManagerSubjectId(null)
      submitRef.current = null
      inviteSubmitRef.current = null
      setIsDirty(false)
      return
    }

    // DETAIL
    const found = users.find((u) => u.id === id)
    if (!found) return

    if (selectedId !== id) setSelectedId(id)
    if (!detailUser || detailUser.id !== id) setDetailUser(found)
    if (viewMode !== safeVm) setViewMode(safeVm)

    setInvitePresetSubjectId(null)
    setAttachmentsManagerSubjectId(null)
  }, [attachmentsManagerSubjectId, detailUser, searchKey, selectedId, users, viewMode])

  // ============================================================================
  // 5) ACTION HANDLERS
  // ============================================================================
  // 5.1) CommonActions list
  const commonActions = useMemo((): CommonActionId[] => {
    const LIST: CommonActionId[] = ['add', 'edit', 'invite', 'attachments', 'close']
    const READ: CommonActionId[] = ['edit', 'invite', 'attachments', 'close']
    const EDIT: CommonActionId[] = ['save', 'attachments', 'close']
    const CREATE: CommonActionId[] = ['save', 'close'] // attachments až po uložení
    const INVITE: CommonActionId[] = ['save', 'close']

    if (viewMode === 'list') return LIST
    if (viewMode === 'invite') return INVITE
    if (viewMode === 'attachments-manager') return ['close']

    if (viewMode === 'read') {
      if (detailActiveSectionId === 'invite') return INVITE
      return READ
    }

    if (viewMode === 'edit') return EDIT
    if (viewMode === 'create') return CREATE

    return ['close']
  }, [detailActiveSectionId, viewMode])

  // 5.2) open helpers
  const openDetail = useCallback(
    (u: UiUser, vm: ViewMode, initialSectionId: any) => {
      setDetailUser(u)
      setViewMode(vm)
      setDetailInitialSectionId(initialSectionId)
      setDetailActiveSectionId(initialSectionId)
      setInvitePresetSubjectId(null)
      setAttachmentsManagerSubjectId(null)
      submitRef.current = null
      inviteSubmitRef.current = null
      setIsDirty(false)

      setUrl({ t: 'users-list', id: u.id, vm }, 'push')
    },
    [setUrl]
  )

  const openInvite = useCallback(
    (presetSubjectId: string | null) => {
      setViewMode('invite')
      setDetailUser(null)
      setInvitePresetSubjectId(presetSubjectId)
      setAttachmentsManagerSubjectId(null)
      submitRef.current = null
      inviteSubmitRef.current = null
      setIsDirty(false)
      setUrl({ t: 'invite-user', id: null, vm: null }, 'push')
    },
    [setUrl]
  )

  const closeToList = useCallback(() => {
    setViewMode('list')
    setDetailUser(null)
    setInvitePresetSubjectId(null)
    setAttachmentsManagerSubjectId(null)
    submitRef.current = null
    inviteSubmitRef.current = null
    setIsDirty(false)
    setUrl({ t: 'users-list', id: null, vm: null }, 'replace')
  }, [setUrl])

  // 5.3) list handlers
  const handleRowClick = useCallback(
    (row: ListViewRow<UiUser>) => {
      const u = row.raw as UiUser
      if (!u?.id) return
      if (selectedId !== u.id) setSelectedId(u.id)
      setUrl({ t: 'users-list', id: u.id, vm: null }, 'replace')
    },
    [selectedId, setUrl]
  )

  const handleRowDoubleClick = useCallback(
    (row: ListViewRow<UiUser>) => {
      const u = row.raw as UiUser
      if (!u?.id) return
      openDetail(u, 'read', 'detail')
    },
    [openDetail]
  )

  // 5.4) main CommonAction handler
  const handleCommonAction = useCallback(
    async (actionId: CommonActionId) => {
      dbg('CommonAction', { actionId, viewMode, selectedId, detailId: detailUser?.id ?? null, isDirty })

      // CLOSE
      if (actionId === 'close') {
        if (isDirty) {
          const ok = confirm('Máš neuložené změny. Opravdu chceš zavřít?')
          if (!ok) return
        }

        // close attachments manager -> zpět do detailu na tab Přílohy
        if (viewMode === 'attachments-manager') {
          const backId = attachmentsManagerSubjectId ?? detailUser?.id ?? null
          if (backId) {
            setDetailInitialSectionId('attachments')
            setDetailActiveSectionId('attachments')
            setViewMode('read')
            setUrl({ t: 'users-list', id: backId, vm: 'read' }, 'replace')
          } else {
            closeToList()
          }
          return
        }

        // close invite screen -> zavřít modul
        if (viewMode === 'invite') {
          onCloseModule()
          return
        }

        // close detail -> zpět do listu
        if (viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') {
          closeToList()
          return
        }

        // close list -> zavřít modul
        onCloseModule()
        return
      }

      // ATTACHMENTS (📎)
      if (actionId === 'attachments') {
        // z listu: musí být selected
        if (viewMode === 'list') {
          if (!selectedId) {
            alert('Nejdřív vyber uživatele v seznamu.')
            return
          }
          setAttachmentsManagerSubjectId(selectedId)
          setViewMode('attachments-manager')
          setIsDirty(false)
          setUrl({ t: 'attachments-manager', id: selectedId, vm: null }, 'push')
          return
        }

        // z detailu: nesmí být dirty a nesmí být new
        if (isDirty) {
          alert('Máš neuložené změny. Nejdřív ulož nebo zavři změny a pak otevři správu příloh.')
          return
        }

        if (!detailUser?.id || detailUser.id === 'new') {
          alert('Nejdřív ulož záznam, aby šly spravovat přílohy.')
          return
        }

        setAttachmentsManagerSubjectId(detailUser.id)
        setViewMode('attachments-manager')
        setIsDirty(false)
        setUrl({ t: 'attachments-manager', id: detailUser.id, vm: null }, 'push')
        return
      }

      // LIST
      if (viewMode === 'list') {
        if (actionId === 'add') {
          setViewMode('create')
          setDetailUser({
            id: 'new',
            displayName: '',
            email: '',
            roleLabel: '',
            createdAt: new Date().toISOString(),
          })
          setDetailInitialSectionId('detail')
          setDetailActiveSectionId('detail')
          setInvitePresetSubjectId(null)
          setAttachmentsManagerSubjectId(null)
          submitRef.current = null
          inviteSubmitRef.current = null
          setIsDirty(false)

          setUrl({ t: 'users-list', id: 'new', vm: 'create' }, 'push')
          return
        }

        if (actionId === 'edit' || actionId === 'invite') {
          if (!selectedId) {
            alert('Nejdřív vyber uživatele v seznamu.')
            return
          }
          const u = users.find((x) => x.id === selectedId)
          if (!u) return

          if (actionId === 'edit') return openDetail(u, 'edit', 'detail')
          if (actionId === 'invite') return openInvite(u.id)
        }
        return
      }

      // INVITE SCREEN
      if (viewMode === 'invite') {
        if (actionId === 'save') {
          if (!inviteSubmitRef.current) return alert('Chybí submit handler (inviteSubmitRef).')
          await inviteSubmitRef.current()
        }
        return
      }

      // DETAIL
      if ((viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') && detailUser) {
        if (actionId === 'edit') {
          if (viewMode === 'read') {
            setViewMode('edit')
            setUrl({ t: 'users-list', id: detailUser.id, vm: 'edit' }, 'replace')
          }
          return
        }

        if (actionId === 'invite') {
          openInvite(detailUser.id)
          return
        }

        if (actionId === 'save') {
          if (!submitRef.current) return alert('Chybí submit handler (submitRef).')
          const res = await submitRef.current()
          if (!res) return

          // po create očekáváme res.id
          if (detailUser.id === 'new' && typeof (res as any).id === 'string') {
            const newId = (res as any).id as string
            setDetailUser({ ...detailUser, id: newId })
            setViewMode('read')
            setUrl({ t: 'users-list', id: newId, vm: 'read' }, 'replace')
            setIsDirty(false)
            return
          }

          setViewMode('read')
          setUrl({ t: 'users-list', id: detailUser.id, vm: 'read' }, 'replace')
          setIsDirty(false)
          return
        }

        return
      }

      // ✅ fallback – nic neuděláme, ale handler vždy skončí čitelně
      return
    },
    [
      attachmentsManagerSubjectId,
      closeToList,
      detailActiveSectionId,
      detailUser,
      isDirty,
      onCloseModule,
      openDetail,
      openInvite,
      selectedId,
      setUrl,
      users,
      viewMode,
    ]
  )

  // ============================================================================
  // 6) RENDER
  // ============================================================================
  // 6.1) list view data
  const listColumns = useMemo(
    () => [
      { key: 'roleLabel', label: 'Role' },
      { key: 'displayName', label: 'Zobrazované jméno' },
      { key: 'email', label: 'E-mail' },
      { key: 'twoFactorMethod', label: '2FA' },
      { key: 'createdAt', label: 'Vytvořeno' },
    ],
    []
  )

  const listRows = useMemo(() => users.map(toRow), [users])

  // 6.2) RENDER: LIST
  if (viewMode === 'list') {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <CommonActions actions={commonActions} onActionClick={handleCommonAction} />

        {loading && <div className="detail-view__placeholder">Načítám…</div>}
        {!loading && errorText && (
          <div className="detail-view__placeholder">
            Chyba: <strong>{errorText}</strong>
          </div>
        )}

        {!loading && !errorText && (
          <ListView
            columns={listColumns}
            rows={listRows}
            selectedId={selectedId ?? undefined}
            onRowClick={handleRowClick}
            onRowDoubleClick={handleRowDoubleClick}
            filterValue=""
            onFilterChange={() => {}}
          />
        )}
      </div>
    )
  }

  // 6.3) RENDER: ATTACHMENTS MANAGER
  if (viewMode === 'attachments-manager') {
    const managerId = attachmentsManagerSubjectId ?? ''
    const managerUser = users.find((u) => u.id === managerId) ?? (detailUser?.id === managerId ? detailUser : null)

    if (!managerId) {
      return (
        <div className="detail-view__section">
          <CommonActions actions={commonActions} onActionClick={handleCommonAction} />
          <div className="detail-view__placeholder">Chybí ID pro správu příloh.</div>
        </div>
      )
    }

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <CommonActions actions={commonActions} onActionClick={handleCommonAction} />

        <AttachmentsManagerFrame
          entityType="subjects"
          entityId={managerId}
          entityLabel={managerUser?.displayName ?? null}
          canManage={true}
          readOnlyReason={null}
        />
      </div>
    )
  }

  // 6.4) RENDER: INVITE
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

  // 6.5) RENDER: DETAIL
  if ((viewMode === 'read' || viewMode === 'edit' || viewMode === 'create') && detailUser) {
    return (
      <UserDetailFrame
        user={detailUser}
        viewMode={viewMode as ViewMode}
        initialSectionId={detailInitialSectionId}
        onActiveSectionChange={(id) => setDetailActiveSectionId(id as any)}
        onDirtyChange={setIsDirty}
        onRegisterSubmit={(fn) => {
          submitRef.current = fn
        }}
        onRegisterInviteSubmit={(fn) => {
          inviteSubmitRef.current = fn
        }}
      />
    )
  }

  // fallback
  return (
    <div className="detail-view__section">
      <CommonActions actions={commonActions} onActionClick={handleCommonAction} />
      <div className="detail-view__placeholder">Neznámý stav: {String(viewMode)}</div>
    </div>
  )
}
