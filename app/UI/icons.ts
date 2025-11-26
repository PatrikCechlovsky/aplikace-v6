// ----------------------------------------------------
// File: app/UI/icons.ts
// Source: docs/ikons.md (uživatelské ikony)
// ----------------------------------------------------

export type IconKey =
  | "home"
  | "users"
  | "user"
  | "account"
  | "settings"
  | "payments"
  | "finance"
  | "energy"
  | "documents"
  | "communication"
  | "dashboard"
  | "building"
  | "apartment"
  | "apartment-unit"
  | "list"
  | "detail"
  | "edit"
  | "delete"
  | "archive"
  | "attach"
  | "refresh"
  | "search"
  | "star"
  | "warning"
  | "notification"
  | "bell"
  | "logout"
  | "login"
  | "add"
  | "send"
  | "history"
  | "settings"
  | "wizard"
  | "folder"
  | "file"
  | "chat"
  | "mail"
  | "print"
  | "form"
  | "grid"
  | "tile"
  | "arrow-right"
  | "arrow-left"
  | "arrow-up"
  | "arrow-down";

// ----------------------------------------------------

export const ICONS: Record<IconKey, string> = {
  home: "🏠",
  users: "👥",
  user: "👤",
  account: "👤",
  settings: "⚙️",
  payments: "💳",
  finance: "💰",
  energy: "⚡",
  documents: "📁",
  communication: "💬",
  dashboard: "📊",
  building: "🏢",
  apartment: "🏘️",
  apartment-unit: "🚪",
  list: "📄",
  detail: "👁️",
  edit: "✏️",
  delete: "🗑️",
  archive: "🗄️",
  attach: "📎",
  refresh: "🔄",
  search: "🔍",
  star: "⭐",
  warning: "⚠️",
  notification: "🔔",
  bell: "🔔",
  logout: "🚪",
  login: "🔐",
  add: "➕",
  send: "📤",
  history: "🕘",
  wizard: "🧭",
  folder: "📁",
  file: "📄",
  chat: "💬",
  mail: "✉️",
  print: "🖨️",
  form: "📝",
  grid: "🟦",
  tile: "🟦",
  "arrow-right": "▶️",
  "arrow-left": "◀️",
  "arrow-up": "▲",
  "arrow-down": "▼",
};

// ----------------------------------------------------

export function getIcon(key: IconKey, fallback: string = "❓") {
  return ICONS[key] ?? fallback;
}
