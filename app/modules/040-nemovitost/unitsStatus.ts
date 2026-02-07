// FILE: app/modules/040-nemovitost/unitsStatus.ts
// PURPOSE: Sdílené mapování statusu jednotek pro listy i vazby.
// NOTES: Bez JSX kvůli .ts – používá React.createElement.

import React from 'react'

export type UnitStatusKey = 'available' | 'occupied' | 'reserved' | 'renovation'

export const UNIT_STATUS_CONFIG: Record<UnitStatusKey, { label: string; color: string; icon: string }> = {
	available: { label: 'Volná', color: '#22c55e', icon: '🟢' },
	occupied: { label: 'Obsazená', color: '#ef4444', icon: '🔴' },
	reserved: { label: 'Rezervovaná', color: '#eab308', icon: '🟡' },
	renovation: { label: 'V rekonstrukci', color: '#a16207', icon: '🟤' },
}

export function renderUnitStatus(status?: string | null): React.ReactNode {
	if (!status) return '—'
	const cfg = UNIT_STATUS_CONFIG[status as UnitStatusKey]
	if (!cfg) return status
	return React.createElement(
		'span',
		{ className: 'status-badge', style: { color: cfg.color } },
		`${cfg.icon} ${cfg.label}`
	)
}
