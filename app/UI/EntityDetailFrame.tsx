/*
 * FILE: app/UI/EntityDetailFrame.tsx
 * PURPOSE: Vzor hlavní karty detailu entity (form + sekce + případně pravý panel)
 */

'use client'

import React from 'react'

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

export default function EntityDetailFrame({
  title,
  subtitle,
  children,
  attachmentsSlot,
  systemInfoSlot,
}: Props) {
  const hasSide = !!attachmentsSlot || !!systemInfoSlot
  const hasHeader = !!title || !!subtitle

  return (
    <div className="entity-detail">
      {/* Hlavička detailu – jen pokud máme něco k zobrazení */}
      {hasHeader && (
        <div className="entity-detail__header">
          <div>
            {title && <h2 className="entity-detail__title">{title}</h2>}
            {subtitle && (
              <div className="entity-detail__subtitle">{subtitle}</div>
            )}
          </div>
        </div>
      )}

      {/* Tělo detailu – 1 sloupec (jen formulář) nebo 2 sloupce (form + pravý panel) */}
      <div
        className={
          hasSide
            ? 'entity-detail__body entity-detail__body--with-side'
            : 'entity-detail__body'
        }
      >
        <div className="entity-detail__main">{children}</div>

        {hasSide && (
          <aside className="entity-detail__side">
            <div className="entity-detail__section">
              <div className="entity-detail__section-title">Přílohy</div>
              {attachmentsSlot ?? (
                <div className="entity-detail__section-empty">
                  Zatím žádné přílohy.
                </div>
              )}
            </div>

            <div className="entity-detail__section">
              <div className="entity-detail__section-title">Systém</div>
              {systemInfoSlot ?? (
                <div className="entity-detail__section-empty">
                  Systémové informace budou doplněny.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      <style jsx>{`
        .entity-detail {
          width: 100%;
          height: 100%;
          padding: 12px 16px 20px;
          box-sizing: border-box;
        }

        .entity-detail__header {
          max-width: 960px;
          margin: 0 auto 12px;
        }

        .entity-detail__title {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .entity-detail__subtitle {
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 2px;
        }

        /* ZÁKLAD – jen formulář uprostřed, bez pravého panelu */
        .entity-detail__body {
          max-width: 960px;
          margin: 0 auto;
        }

        .entity-detail__main {
          width: 100%;
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
          font-size: 0.85rem;
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
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .entity-detail__section-empty {
          font-size: 0.8rem;
          color: #6b7280;
        }

        /* Mobil – vše pod sebe */
        @media (max-width: 900px) {
          .entity-detail {
            padding: 8px 8px 16px;
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
