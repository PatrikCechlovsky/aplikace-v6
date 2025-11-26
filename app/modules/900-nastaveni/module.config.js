// modules/900-nastaveni/module.config.js

export default {
  id: '900-nastaveni',
  order: 900,
  label: 'Nastavení',
  icon: '⚙️',
  enabled: true,

  // zde později doplníme jednotlivé sekce nastavení:
  // - obecné nastavení aplikace
  // - role a oprávnění
  // - barevná témata
  // - uživatelské preference
  // - číselníky (typy jednotek, typy služeb atd.)
  // - parametry systému
  // - volby pro generování dokumentů, identifikátory…

  overview: [],   // přehledy nastavení (zatím prázdné)
  detail: [],     // formuláře nastavení (zatím prázdné)
  tiles: [],      // dlaždice pro nastavení (zatím prázdné)
  actions: [],    // akce (zatím prázdné)
}
