// FILE: app/modules/900-nastaveni/module.config.js
// PURPOSE: Konfigurace modulu Nastavení + registrace tiles (číselníky)

import SubjectTypesTile from './tiles/SubjectTypesTile'
import TypesSettingsSection from './sections/TypesSettingsSection'
import ThemeSettingsSection from './sections/ThemeSettingsSection'
import IconSettingsSection from './sections/IconSettingsSection'
import ThemeSettingsTile from './tiles/ThemeSettingsTile'

// ⬇⬇⬇ NOVÝ IMPORT
import PropertyTypesTile from './tiles/PropertyTypesTile'

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
      icon: 'book',          // ← tvoje ikona 📚
      component: TypesSettingsSection,
      introTitle: 'Nastavení typů',
      introText: 'Zde najdeš číselníky typů subjektů, smluv, majetku…'
    },
    {
      id: 'theme-settings',
      label: 'Nastavení vzhledu',
      icon: 'paint',         // 🎨
      component: ThemeSettingsSection,
      introTitle: 'Nastavení vzhledu',
      introText: 'Barevná schémata, motivy a layout aplikace.'
    },
    {
      id: 'icon-settings',
      label: 'Nastavení ikon',
      icon: 'smile', // 🙂
      component: IconSettingsSection,
      introTitle: 'Nastavení ikon',
      introText: 'Mapování ikon modulů, akcí a číselníků.'
    }
  ],

  // 3. ÚROVEŇ – TILES (konkrétní číselníky) přiřazené do sekcí
  tiles: [
    // ⬇⬇⬇ NOVÁ DLAŽDICE – typy nemovitostí
    {
      id: 'property-types',
      label: 'Typy nemovitostí',
      icon: 'building-2',
      sectionId: 'types-settings',
      component: PropertyTypesTile,
      order: 10,
    },

    {
      id: 'subject-types',
      label: 'Typy subjektů',
      icon: 'list',  // nebo vytvoř novou ikonu např. "subject-type"
      sectionId: 'types-settings',
      component: SubjectTypesTile,
      order: 15,
    },
    {
      id: 'theme-settings',
      label: 'Barevné zobrazení',
      icon: 'paint', // můžeš změnit na nějaký vlastní
      sectionId: 'theme-settings',
      component: ThemeSettingsTile,
      order: 20, // libovolné pořadí mezi ostatními
    },
    // později třeba:
    // { id: 'contract-types', label: 'Typy smluv', sectionId: 'types-settings', ... }
    // { id: 'theme-presets', label: 'Barevná schémata', sectionId: 'theme-settings', ... }
  ],

  actions: [],
}
