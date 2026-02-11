/*
 * FILE: app/UI/EntityDetailFrame.tsx
 * PURPOSE: Vzor hlavní karty detailu entity (form + sekce + případně pravý panel)
 */

'use client'

/* =========================
   1) IMPORTS
   ========================= */
import React, { useMemo } from 'react'

/* =========================
   2) TYPES
   ========================= */
type Props = {
  /** Volitelný nadpis detailu (když nechceš, nech prázdné) */
  title?: string
  /** Volitelný podtitulek (např. e-mail, kód…) */
  subtitle?: string
  /** Vlastní obsah detailu (formulář / sekce) */
  children?: React.ReactNode
  /** Volitelné – pokud pošleš obsah, zobrazí se pravý panel */
  attachmentsSlot?: React.ReactNode
  systemInfoSlot?: React.ReactNode
}

/* =========================
   3) HELPERS
   ========================= */
function buildBodyClassName(hasSide: boolean) {
  return hasSide ? 'entity-detail__body entity-detail__body--with-side' : 'entity-detail__body'
}

/* =========================
   4) DATA LOAD
   ========================= */
/* (none) */

/* =========================
   5) ACTION HANDLERS
   ========================= */
/* (none) */

/* =========================
   6) RENDER
   ========================= */
export default function EntityDetailFrame({
  title,
  subtitle,
  children,
  attachmentsSlot,
  systemInfoSlot,
}: Props) {
  const hasSide = !!attachmentsSlot || !!systemInfoSlot
  const hasHeader = !!title || !!subtitle

  const bodyClassName = useMemo(() => buildBodyClassName(hasSide), [hasSide])

  return (
    <div className="entity-detail">
      {/* Hlavička detailu – jen pokud máme něco k zobrazení */}
      {hasHeader && (
        <div className="entity-detail__header">
          <div>
            {title && <h2 className="entity-detail__title">{title}</h2>}
            {subtitle && <div className="entity-detail__subtitle">{subtitle}</div>}
          </div>
        </div>
      )}

      {/* Tělo detailu – 1 sloupec (jen formulář) nebo 2 sloupce (form + pravý panel) */}
      <div className={bodyClassName}>
        <div className="entity-detail__main">{children}</div>

        {hasSide && (
          <aside className="entity-detail__side">
            <div className="entity-detail__section">
              <div className="entity-detail__section-title">Přílohy</div>
              {attachmentsSlot ?? <div className="entity-detail__section-empty">Zatím žádné přílohy.</div>}
            </div>

            <div className="entity-detail__section">
              <div className="entity-detail__section-title">Systém</div>
              {systemInfoSlot ?? (
                <div className="entity-detail__section-empty">Systémové informace budou doplněny.</div>
              )}
            </div>
          </aside>
        )}
      </div>
      <style jsx>{`
        /* =========================================================
           Density-aware typografie přes CSS proměnné z .layout
           - tyto proměnné nastavuješ globálně (layout--density-*)
           - tady je jen používáme + fallbacky
           ========================================================= */

        .entity-detail {
          /* spacing */
          padding: var(--entity-frame-pad, 12px 16px 20px);
          box-sizing: border-box;
          width: 100%;
          min-height: 0;

          /* typography */
          --_title-font: var(--entity-title-font, 22px);
          --_subtitle-font: var(--entity-subtitle-font, 13px);
          --_side-font: var(--entity-side-font, 13px);
          --_section-title-font: var(--entity-section-title-font, 13px);
          --_section-empty-font: var(--entity-section-empty-font, 12px);
        }

        .entity-detail__header {
          margin: 0;
        }

        .entity-detail__title {
          font-size: var(--_title-font);
          line-height: 1.3;
          font-weight: 600;
          margin: 0;
        }

        .entity-detail__subtitle {
          font-size: var(--_subtitle-font);
          color: #6b7280;
          margin-top: 2px;
        }

        /* ZÁKLAD – jen formulář uprostřed, bez pravého panelu */
        .entity-detail__body {
          width: 100%;
        }

        .entity-detail__main {
          width: 100%;
          flex: 1 1 0;
          min-height: 0;
        }

        /* Varianta s pravým panelem – použijeme později pro přílohy / systém */
        .entity-detail__body--with-side {
          max-width: 1200px;
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr);
          gap: 24px;
          align-items: flex-start;
        }

        .entity-detail__side {
          font-size: var(--_side-font);
        }

        .entity-detail__section {
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          padding: 12px;
          background: #f9fafb;
          margin-bottom: 12px;
        }

        .entity-detail__section-title {
          font-weight: 600;
          font-size: var(--_section-title-font);
          margin-bottom: 6px;
        }

        .entity-detail__section-empty {
          font-size: var(--_section-empty-font);
          color: #6b7280;
        }

        /* Mobil – vše pod sebe */
        @media (max-width: 900px) {
          .entity-detail {
            padding: var(--entity-frame-pad-mobile, 8px 8px 16px);
          }

          .entity-detail__header {
            margin-bottom: 8px;
          }

          .entity-detail__body--with-side {
            display: block;
            max-width: 100%;
          }

          .entity-detail__side {
            margin-top: 12px;
          }
        }
      `}</style>
    </div>
  )
}
