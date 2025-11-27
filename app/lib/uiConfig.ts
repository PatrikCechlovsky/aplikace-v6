/*
 * FILE: app/lib/uiConfig.ts
 * PURPOSE: Globální nastavení UI (ikonky, téma, chování)
 */

export type ThemeName = 'light' | 'dark' | 'blue' | 'green' | 'orange'

export type UiConfig = {
  showSidebarIcons: boolean
  showBreadcrumbIcons: boolean
  theme: ThemeName
}

export const uiConfig: UiConfig = {
  // Zobrazovat ikonky v sidebaru (vlevo u seznamu modulů)
  showSidebarIcons: true,

  // Zobrazovat ikonky v drobečkové navigaci
  showBreadcrumbIcons: true,

  // Výchozí motiv: 'light' | 'dark' | 'blue' | 'green' | 'orange'
  theme: 'light',
}
