// FILE: app/modules/900-nastaveni/module.config.js
// PURPOSE: Konfigurace modulu Nastavení + registrace tiles (číselníky)

import SubjectTypesTile from './tiles/SubjectTypesTile'
import TypesSettingsSection from './sections/TypesSettingsSection'
import ThemeSettingsSection from './sections/ThemeSettingsSection'
import IconSettingsSection from './sections/IconSettingsSection'
import ThemeSettingsTile from './tiles/ThemeSettingsTile'

import PermissionTypesTile from './tiles/PermissionTypesTile'
import PropertyTypesTile from './tiles/PropertyTypesTile'
import UnitTypesTile from './tiles/UnitTypesTile'
import RoleTypesTile from './tiles/RoleTypesTile'

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
    {
      id: 'role-types',
      label: 'Typy rolí',
      icon: 'settings', 
      sectionId: 'types-settings',
      component: RoleTypesTile,
      order: 14,
    },
    {
      id: 'permission-types',
      label: 'Typy oprávnění',
      icon: 'shield-check',
      sectionId: 'types-settings',
      component: PermissionTypesTile,
      order: 16,
    }
    {
      id: 'property-types',
      label: 'Typy nemovitostí',
      icon: 'settings',
      sectionId: 'types-settings',
      component: PropertyTypesTile,
      order: 10,
    },
    {
      id: 'unit-types',
      label: 'Typy jednotek',
      icon: 'settings', 
      sectionId: 'types-settings',
      component: UnitTypesTile,
      order: 12,
    },
    {
      id: 'subject-types',
      label: 'Typy subjektů',
      icon: 'settings', 
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
