// FILE: app/UI/DetailView.tsx
// PURPOSE: Jednoduchý obal pro detail formuláře entity + centrální sekce (Tabs).
//          - Sekce jsou definované tady (JEDEN zdroj pravdy).
//          - Moduly jen řeknou: sectionIds = [...]
//          - DetailTabs je separátní UI prvek (bez znalosti dat).

'use client'

import React, { useMemo, useState } from 'react'
import DetailTabs, { type DetailTabItem } from './DetailTabs'

export type DetailViewMode = 'create' | 'edit' | 'view'

export type DetailSectionId =
  | 'detail'
  | 'roles'
  | 'users'
  | 'equipment'
  | 'accounts'
  | 'attachments'
  | 'system'

export type DetailViewSection<Ctx = unknown> = {
  id: DetailSectionId
  label: string
  order: number
  /** Sekce, které mají být vždy (tvé pravidlo): detail + přílohy + systém */
  always?: boolean
  /** Vykreslení obsahu sekce (module dodá ctx; render je v registry) */
  render: (ctx: Ctx) => React.ReactNode
  /** Volitelně: sekce se může skrýt podle kontextu */
  visibleWhen?: (ctx: Ctx) => boolean
}

/**
 * CENTRÁLNÍ REGISTRY – TADY “NAHRAJEME PŘIPRAVENÉ SEKCE”
 * Pořadí: detail, roles, users, equipment, accounts, attachments, system
 *
 * Render je zatím placeholder (kromě detailu, který můžeš napojit z modulu přes children, viz níž).
 * V dalších krocích nahradíme placeholdery reálnými komponentami.
 */
const DETAIL_SECTIONS: Record<DetailSectionId, DetailViewSection<any>> = {
  detail: {
    id: 'detail',
    label: 'Detail',
    order: 10,
    always: true,
    render: (ctx) => ctx?.detailContent ?? null,
  },

  roles: {
    id: 'roles',
    label: 'Role a oprávnění',
    order: 20,
    render: () => (
      <div className="detail-view__placeholder">
        Role a oprávnění – doplníme (uživatel).
      </div>
    ),
  },

  users: {
    id: 'users',
    label: 'Seznam uživatelů',
    order: 30,
    render: () => (
      <div className="detail-view__placeholder">
        Seznam uživatelů – doplníme (např. uživatelé jednotky / nájemníci).
      </div>
    ),
  },

  equipment: {
    id: 'equipment',
    label: 'Vybavení jednotky',
    order: 40,
    render: () => (
      <div className="detail-view__placeholder">
        Vybavení jednotky – doplníme (jednotka).
      </div>
    ),
  },

  accounts: {
    id: 'accounts',
    label: 'Účty',
    order: 50,
    render: () => (
      <div className="detail-view__placeholder">
        Účty – doplníme (subjekt).
      </div>
    ),
  },

  attachments: {
    id: 'attachments',
    label: 'Přílohy',
    order: 60,
    always: true,
    render: () => (
      <div className="detail-view__placeholder">Přílohy – doplníme.</div>
    ),
  },

  system: {
    id: 'system',
    label: 'Systém',
    order: 70,
    always: true,
    render: () => <div className="detail-view__placeholder">Systém – doplníme.</div>,
  },
}

function resolveSections<Ctx>(
  sectionIds: DetailSectionId[] | undefined,
  ctx: Ctx
): DetailViewSection<Ctx>[] {
  const picked = new Set<DetailSectionId>(sectionIds ?? [])

  // přidat always (detail, attachments, system)
  ;(Object.values(DETAIL_SECTIONS) as DetailViewSection<Ctx>[]).forEach((s) => {
    if (s.always) picked.add(s.id)
  })

  // map + visibleWhen + sort
  const list = Array.from(picked)
    .map((id) => DETAIL_SECTIONS[id] as DetailViewSection<Ctx>)
    .filter(Boolean)
    .filter((s) => (s.visibleWhen ? s.visibleWhen(ctx) : true))
    .sort((a, b) => a.order - b.order)

  return list
}

export type DetailViewProps<Ctx = unknown> = {
  /** Režim formuláře (zatím jen informativně) */
  mode: DetailViewMode

  /** Má formulář neuložené změny? (pro budoucí použití) */
  isDirty?: boolean

  /** Probíhá ukládání (pro budoucí použití) */
  isSaving?: boolean

  /** Callback pro Uložit – řeší si konkrétní modul (nepoužito v UI) */
  onSave?: () => void

  /** Callback pro Zrušit / Zavřít – řeší si konkrétní modul (nepoužito v UI) */
  onCancel?: () => void

  /**
   * NOVĚ: ID sekcí, které chce modul navíc.
   * "Vždy" se přidá: detail + přílohy + systém
   */
  sectionIds?: DetailSectionId[]

  /**
   * Kontext detailu (entita, práva, handlers…)
   * Zatím minimálně používáme `detailContent` pro sekci "detail".
   */
  ctx?: Ctx & { detailContent?: React.ReactNode }

  /**
   * Legacy: když nic nepředáš (sectionIds/ctx), DetailView funguje jako wrapper kolem children.
   */
  children?: React.ReactNode
}

export default function DetailView<Ctx = unknown>({
  children,
  sectionIds,
  ctx,
}: DetailViewProps<Ctx>) {
  // Legacy režim: zachováme původní chování (nic nerozbít)
  if (!sectionIds && !ctx) {
    return <div className="detail-view">{children}</div>
  }

  const safeCtx = (ctx ?? ({} as Ctx)) as Ctx & { detailContent?: React.ReactNode }
  const sections = useMemo(() => resolveSections(sectionIds, safeCtx), [sectionIds, safeCtx])

  const defaultActive = sections[0]?.id ?? 'detail'
  const [activeId, setActiveId] = useState<DetailSectionId>(defaultActive)

  // když aktivní zmizí, spadni na první
  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0]

  const tabs: DetailTabItem[] = sections.map((s) => ({
    id: s.id,
    label: s.label,
  }))

  return (
    <div className="detail-view">
      {tabs.length > 1 && (
        <DetailTabs
          items={tabs}
          activeId={activeSection?.id ?? defaultActive}
          onChange={(id) => setActiveId(id as DetailSectionId)}
        />
      )}

      {activeSection && (
        <section id={`detail-section-${activeSection.id}`}>
          {activeSection.render(safeCtx)}
        </section>
      )}
    </div>
  )
}
