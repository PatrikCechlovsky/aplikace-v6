// FILE: app/modules/060-smlouva/module.config.js
// PURPOSE: Konfigurace modulu 060 – Smlouvy

import ContractsTile from './tiles/ContractsTile'
import CreateContractTile from './tiles/CreateContractTile'

export default {
  id: '060-smlouva',
  order: 60,
  label: 'Smlouvy',
  icon: 'contract',
  enabled: true,

  tiles: [
    {
      id: 'contracts-list',
      label: 'Přehled smluv',
      icon: 'list-alt',
      component: ContractsTile,
      order: 10,
    },
    {
      id: 'create-contract',
      label: 'Přidat smlouvu',
      icon: 'plus',
      component: CreateContractTile,
      order: 20,
    },
  ],
}
