/*
 * FILE: app/UI/icons.ts
 * PURPOSE: Centrální mapa ikon pro celou aplikaci
 */

export type IconKey =
  | 'home'
  | 'users'
  | 'user'
  | 'landlord'
  | 'building'
  | 'apartment'
  | 'unit'
  | 'tenant'
  | 'contract'
  | 'services'
  | 'payments'
  | 'finance'
  | 'energy'
  | 'documents'
  | 'communication'
  | 'settings'
  | 'dashboard'
  | 'help'
  | 'list'
  | 'detail'
  | 'edit'
  | 'delete'
  | 'archive'
  | 'attach'
  | 'refresh'
  | 'search'
  | 'warning'
  | 'notification'
  | 'logout'
  | 'login'
  | 'add'
  | 'send'
  | 'history'
  | 'folder'
  | 'file'
  | 'chat'
  | 'mail'
  | 'print'
  | 'form'
  | 'grid'
  | 'tile'

export const ICONS: Record<IconKey, string> = {
  home: '🏠',
  users: '👥',
  user: '👤',
  landlord: '🏠',
  building: '🏢',
  apartment: '🏘️',
  unit: '🚪',
  tenant: '🧍‍♂️',
  contract: '📜',
  services: '⚙️',
  payments: '💳',
  finance: '💰',
  energy: '⚡',
  documents: '📁',
  communication: '💬',
  settings: '⚙️',
  dashboard: '📊',
  help: '❓',
  list: '📄',
  detail: '👁️',
  edit: '✏️',
  delete: '🗑️',
  archive: '🗄️',
  attach: '📎',
  refresh: '🔄',
  search: '🔍',
  warning: '⚠️',
  notification: '🔔',
  logout: '🚪',
  login: '🔐',
  add: '➕',
  send: '📤',
  history: '🕘',
  folder: '📁',
  file: '📄',
  chat: '💬',
  mail: '✉️',
  print: '🖨️',
  form: '📝',
  grid: '🟦',
  tile: '🟦',
}

export function getIcon(key: IconKey | undefined, fallback = '❓') {
  if (!key) return fallback
  return ICONS[key] ?? fallback
}
