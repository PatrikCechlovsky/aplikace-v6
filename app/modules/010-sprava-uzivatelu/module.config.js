// FILE: app/modules/010-sprava-uzivatelu/module.config.js
// PURPOSE: Konfigurace modulu 010 – Správa uživatelů (seznam + detail + pozvánka)

import UsersTile from './tiles/UsersTile'
import InviteUserTile from './tiles/InviteUserTile'

export default {
  id: '010-sprava-uzivatelu',
  order: 10,
  label: 'Správa uživatelů',
  icon: 'user',
  enabled: true,

  tiles: [
    {
      id: 'users-list',
      label: 'Přehled uživatelů',
      icon: 'list-alt',
      component: UsersTile,
      order: 10,
    },
    {
      id: 'invite-user',
      label: 'Pozvat uživatele',
      icon: 'mail',
      component: InviteUserTile,
      order: 20,
    },
  ],

  actions: [],
}
