// FILE: app/UI/SkeletonLoader.tsx
// PURPOSE: Reusable skeleton loader components for loading states

'use client'

import React from 'react'
import '@/app/styles/components/SkeletonLoader.css'

interface SkeletonLoaderProps {
  className?: string
  variant?: 'text' | 'circle' | 'rect' | 'card' | 'table'
  width?: string | number
  height?: string | number
  lines?: number
}

/**
 * Basic skeleton loader - animated placeholder
 */
export function SkeletonLoader({
  className = '',
  variant = 'rect',
  width,
  height,
}: SkeletonLoaderProps) {
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`skeleton skeleton--${variant} ${className}`}
      style={style}
      aria-label="Načítání..."
      role="status"
    />
  )
}

/**
 * Text skeleton - multiple lines of text
 */
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          height="1rem"
        />
      ))}
    </div>
  )
}

/**
 * Card skeleton - for card-like content
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton-card ${className}`}>
      <SkeletonLoader variant="rect" height="200px" />
      <div className="skeleton-card__content">
        <SkeletonLoader variant="text" width="80%" height="1.5rem" />
        <SkeletonText lines={2} />
      </div>
    </div>
  )
}

/**
 * Table skeleton - for table loading states
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={`skeleton-table ${className}`}>
      <div className="skeleton-table__header">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLoader key={i} variant="text" width="100px" height="1.2rem" />
        ))}
      </div>
      <div className="skeleton-table__body">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="skeleton-table__row">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <SkeletonLoader key={colIdx} variant="text" width="80%" height="1rem" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Centered loading skeleton - for full page loading
 */
export function SkeletonCentered({
  message,
  className = '',
}: {
  message?: string
  className?: string
}) {
  return (
    <div className={`skeleton-centered ${className}`}>
      <div className="skeleton-centered__spinner">
        <SkeletonLoader variant="circle" width={48} height={48} />
      </div>
      {message && <p className="skeleton-centered__message">{message}</p>}
    </div>
  )
}

export default SkeletonLoader


