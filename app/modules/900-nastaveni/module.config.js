// FILE: app/modules/900-nastaveni/module.config.js
// PURPOSE: Konfigurace modulu Nastavení + registrace tiles (číselníky)

import SubjectTypesTile from './tiles/SubjectTypesTile'
import TypesSettingsSection from './sections/TypesSettingsSection'
import ThemeSettingsSection from './sections/ThemeSettingsSection'
import IconSettingsSection from './sections/IconSettingsSection'

export default {
  id: '900-nastaveni',
  order: 900,
  label: 'Nastavení',
  icon: 'settings',
  enabled: true,

  // 2. ÚROVEŇ – SECTIONS (Nastavení typů / vzhledu / ikon)
  sections: [
    {
      id: 'types-settings',
      label: 'Nastavení typů',
      component: TypesSettingsSection,
    },
    {
      id: 'theme-settings',
      label: 'Nastavení vzhledu',
      component: ThemeSettingsSection,
    },
    {
      id: 'icon-settings',
      label: 'Nastavení ikon',
      component: IconSettingsSection,
    },
  ],

  // 3. ÚROVEŇ – TILES (konkrétní číselníky) přiřazené do sekcí
  tiles: [
    {
      id: 'subject-types',
      label: 'Typy subjektů',
      sectionId: 'types-settings',   // ⇐ patří do sekce „Nastavení typů“
      component: SubjectTypesTile,
    },
    // později třeba:
    // { id: 'contract-types', label: 'Typy smluv', sectionId: 'types-settings', ... }
    // { id: 'theme-presets', label: 'Barevná schémata', sectionId: 'theme-settings', ... }
  ],

  actions: [],
}
