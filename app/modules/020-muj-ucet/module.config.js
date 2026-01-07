// FILE: app/modules/020-muj-ucet/module.config.js
// PURPOSE: Konfigurace modulu 020 – Můj účet

import MyAccountTile from './tiles/MyAccountTile'

export default {
  id: '020-muj-ucet',
  order: 20,
  label: 'Můj účet',
  icon: 'user',
  enabled: true,

  tiles: [
    {
      id: 'my-account',
      label: 'Můj účet',
      icon: 'user',
      component: MyAccountTile,
      order: 10,
    },
  ],

  actions: [],
}
