// FILE: app/modules/010-sprava-uzivatelu/module.config.js
// PURPOSE: Konfigurace modulu 010 – Správa uživatelů (seznam + detail)

import UsersTile from './tiles/UsersTile'

export default {
  id: '010-sprava-uzivatelu',
  order: 10,
  label: 'Správa uživatelů',
  icon: 'user',
  enabled: true,

  // Tento modul zatím nepoužívá SECTIONS, rovnou jeden tile.
  tiles: [
    {
      id: 'users-list',
      label: 'Přehled uživatelů',
      icon: 'list-alt',
      component: UsersTile,
      order: 10,
    },
  ],

  actions: [],
}
