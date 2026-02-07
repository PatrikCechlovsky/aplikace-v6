// FILE: app/lib/constants/properties.ts
// PURPOSE: Fixed constants for property and unit management (not generic types)
// NOTES: These values are hardcoded and don't require database tables

/**
 * Unit status options with color coding
 * 🔴 Red = Occupied
 * 🟢 Green = Available
 * 🟡 Yellow = Reserved
 * 🟤 Brown = Under renovation
 */
export const UNIT_STATUSES = [
  { value: 'occupied', label: '🔴 Obsazená', color: '#ef4444' },
  { value: 'available', label: '🟢 Volná', color: '#22c55e' },
  { value: 'reserved', label: '🟡 Rezervovaná', color: '#eab308' },
  { value: 'renovation', label: '🟤 V rekonstrukci', color: '#92400e' },
] as const;

/**
 * Czech regions (14 krajů)
 */
export const REGIONS = [
  { value: 'PHA', label: 'Praha' },
  { value: 'STC', label: 'Středočeský kraj' },
  { value: 'JHC', label: 'Jihočeský kraj' },
  { value: 'PLK', label: 'Plzeňský kraj' },
  { value: 'KVK', label: 'Karlovarský kraj' },
  { value: 'ULK', label: 'Ústecký kraj' },
  { value: 'LBK', label: 'Liberecký kraj' },
  { value: 'HKK', label: 'Královéhradecký kraj' },
  { value: 'PAK', label: 'Pardubický kraj' },
  { value: 'VYS', label: 'Kraj Vysočina' },
  { value: 'JHM', label: 'Jihomoravský kraj' },
  { value: 'OLK', label: 'Olomoucký kraj' },
  { value: 'ZLK', label: 'Zlínský kraj' },
  { value: 'MSK', label: 'Moravskoslezský kraj' },
] as const;

/**
 * Central European countries (ISO codes)
 */
export const COUNTRIES = [
  { value: 'CZ', label: 'Česká republika' },
  { value: 'SK', label: 'Slovensko' },
  { value: 'AT', label: 'Rakousko' },
  { value: 'DE', label: 'Německo' },
  { value: 'PL', label: 'Polsko' },
] as const;

/**
 * Standard room types for units
 */
export const ROOM_TYPES = [
  { value: 'kitchen', label: 'Kuchyně' },
  { value: 'bathroom', label: 'Koupelna' },
  { value: 'living_room', label: 'Obývací pokoj' },
  { value: 'bedroom', label: 'Ložnice' },
  { value: 'hallway', label: 'Chodba' },
  { value: 'toilet', label: 'WC' },
  { value: 'pantry', label: 'Spíž' },
  { value: 'balcony', label: 'Balkon' },
  { value: 'terrace', label: 'Terasa' },
  { value: 'garage', label: 'Garáž' },
  { value: 'cellar', label: 'Sklep' },
  { value: 'attic', label: 'Půda' },
  { value: 'office', label: 'Kancelář' },
  { value: 'storage', label: 'Sklad' },
  { value: 'other', label: 'Ostatní' },
] as const;

/**
 * Equipment condition states (fixed technical values, not user-configurable)
 * These 6 states match equipment_states in generic_types but should be used as constants.
 * Users should not modify these via UI - they are standardized condition codes.
 */
export const EQUIPMENT_STATES = [
  { value: 'new', label: 'Nové', description: 'Nové vybavení, nepoužité', color: '#2ECC71', icon: '✨' },
  { value: 'good', label: 'Běžné opotřebení', description: 'Funkční vybavení v dobrém stavu', color: '#3498DB', icon: '✅' },
  { value: 'worn', label: 'Opotřebené', description: 'Vybavení se znaky opotřebení', color: '#F39C12', icon: '⚠️' },
  { value: 'damaged', label: 'Poškozené', description: 'Částečně poškozené, vyžaduje opravu', color: '#E67E22', icon: '🔧' },
  { value: 'to_replace', label: 'K výměně', description: 'Vybavení určené k výměně', color: '#E74C3C', icon: '🔄' },
  { value: 'broken', label: 'Nefunkční', description: 'Nefunkční vybavení, nutná výměna', color: '#C0392B', icon: '❌' },
] as const;

// Type exports for TypeScript
export type UnitStatus = typeof UNIT_STATUSES[number]['value'];
export type Region = typeof REGIONS[number]['value'];
export type Country = typeof COUNTRIES[number]['value'];
export type RoomType = typeof ROOM_TYPES[number]['value'];
export type EquipmentState = typeof EQUIPMENT_STATES[number]['value'];
