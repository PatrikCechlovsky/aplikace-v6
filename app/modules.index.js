// FILE: src/app/modules.index.js
// Seznam lazy loaderů na module.config.js (relativně z /src/app/)

export const MODULE_SOURCES = [
  () => import('./modules/010-sprava-uzivatelu/module.config.js'),
  () => import('./modules/020-muj-ucet/module.config.js'),
  () => import('./modules/030-pronajimatel/module.config.js'),
  () => import('./modules/040-nemovitost/module.config.js'),
  () => import('./modules/050-najemnik/module.config.js'),
  () => import('./modules/060-smlouva/module.config.js'),
  () => import('./modules/070-sluzby/module.config.js'),
  () => import('./modules/080-platby/module.config.js'),
  () => import('./modules/090-finance/module.config.js'),
  () => import('./modules/100-energie/module.config.js'),
  // () => import('./modules/110-udrzba/module.config.js'),
  () => import('./modules/120-dokumenty/module.config.js'),
  () => import('./modules/130-komunikace/module.config.js'),
  () => import('./modules/900-nastaveni/module.config.js'),
  // () => import('./modules/990-help/module.config.js'),
]

// 🔍 DEBUG: vyexportuj MODULE_SOURCES do window, abychom je viděli v konzoli
if (typeof window !== 'undefined') {
  // dáme to pod rozumný jméno, ať si to nespleteš s něčím jiným
  window.__PRONAJ_MODULE_SOURCES__ = MODULE_SOURCES
}
