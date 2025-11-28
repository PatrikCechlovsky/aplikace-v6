// FILE: app/modules/900-nastaveni/module.config.js
// PURPOSE: Konfigurace modulu Nastavení + registrace tiles (číselníky)

import SubjectTypesTile from './tiles/SubjectTypesTile'

export default {
  id: '900-nastaveni',
  order: 900,
  label: 'Nastavení',
  icon: 'settings',
  enabled: true,

  /*
   * Přehledové obrazovky (zatím prázdné)
   */
  overview: [],

  /*
   * Detailní formuláře (zatím prázdné)
   */
  detail: [],

  /*
   * Tiles – zde registrujeme dlaždice pro modul Nastavení
   */
  tiles: [
    {
      id: 'subject-types',
      label: 'Typy subjektů',
      component: SubjectTypesTile,
    },
  ],

  /*
   * Akce modulu (zatím prázdné)
   */
  actions: [],
}
