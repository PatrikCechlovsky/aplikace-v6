// FILE: app/modules/900-nastaveni/module.config.js
// PURPOSE: Konfigurace modulu Nastavení + registrace tiles (číselníky)

import SubjectTypesTile from './tiles/SubjectTypesTile'
import TypesSettingsSection from './sections/TypesSettingsSection'
import ThemeSettingsSection from './sections/ThemeSettingsSection'
import IconSettingsSection from './sections/IconSettingsSection'

import ThemeSettingsTile from './tiles/ThemeSettingsTile'
import IconDisplaySettingsTile from './tiles/IconDisplaySettingsTile'
import PermissionTypesTile from './tiles/PermissionTypesTile'
import PropertyTypesTile from './tiles/PropertyTypesTile'
import UnitTypesTile from './tiles/UnitTypesTile'
import RoleTypesTile from './tiles/RoleTypesTile'
import PaymentTypesTile from './tiles/PaymentTypesTile'
import RoomTypesTile from './tiles/RoomTypesTile'
import EquipmentTypesTile from './tiles/EquipmentTypesTile'
import AppViewSettingsTile from './tiles/AppViewSettingsTile'
import ServiceTypesTile from './tiles/ServiceTypesTile'
import ServiceBillingTypesTile from './tiles/ServiceBillingTypesTile'
import VatRatesTile from './tiles/VatRatesTile'
import ServiceUnitsTile from './tiles/ServiceUnitsTile'

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
      introText: 'Mapování ikon modulů, akcí a číselníků. Vyber, jestli chceš v aplikaci používat ikonky nebo jen textové popisky.'
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
      order: 10,
    },
    {
      id: 'permission-types',
      label: 'Typy oprávnění',
      icon: 'settings',
      sectionId: 'types-settings',
      component: PermissionTypesTile,
      order: 20,
    },
    {
      id: 'subject-types',
      label: 'Typy subjektů',
      icon: 'settings', 
      sectionId: 'types-settings',
      component: SubjectTypesTile,
      order: 30,
    },
    {
      id: 'property-types',
      label: 'Typy nemovitostí',
      icon: 'settings',
      sectionId: 'types-settings',
      component: PropertyTypesTile,
      order: 40,
    },
    {
      id: 'unit-types',
      label: 'Typy jednotek',
      icon: 'settings', 
      sectionId: 'types-settings',
      component: UnitTypesTile,
      order: 50,
    },
    {
      id: 'room-types',
      label: 'Typy místností',
      icon: 'settings',
      sectionId: 'types-settings',
      component: RoomTypesTile,
      order: 55,
    },
    {
      id: 'equipment-types',
      label: 'Typy vybavení',
      icon: 'settings',
      sectionId: 'types-settings',
      component: EquipmentTypesTile,
      order: 56,
    },
    {
      id: 'service-types',
      label: 'Kategorie služeb',
      icon: 'settings',
      sectionId: 'types-settings',
      component: ServiceTypesTile,
      order: 60,
    },
    {
      id: 'service-billing-types',
      label: 'Typy účtování služeb',
      icon: 'settings',
      sectionId: 'types-settings',
      component: ServiceBillingTypesTile,
      order: 61,
    },
    {
      id: 'vat-rates',
      label: 'DPH sazby',
      icon: 'settings',
      sectionId: 'types-settings',
      component: VatRatesTile,
      order: 62,
    },
    {
      id: 'service-units',
      label: 'Jednotky služeb',
      icon: 'settings',
      sectionId: 'types-settings',
      component: ServiceUnitsTile,
      order: 63,
    },
    {
      id: 'payment-types',
      label: 'Typy plateb',
      icon: 'settings', 
      sectionId: 'types-settings',
      component: PaymentTypesTile,
      order: 18,
    },
    {
      id: 'theme-settings',
      label: 'Barevné zobrazení',
      icon: 'paint', // můžeš změnit na nějaký vlastní
      sectionId: 'theme-settings',
      component: ThemeSettingsTile,
      order: 20, // libovolné pořadí mezi ostatními
    },
    {
      id: 'app-view-settings',
      label: 'Vzhled a zobrazení',
      icon: 'layout',        // nebo jiná tvoje ikona
      sectionId: 'theme-settings',
      component: AppViewSettingsTile,
      order: 40,
    },
     {
      id: 'icon-display',
      label: 'Zobrazení ikon',
      icon: 'smile',
      sectionId: 'icon-settings',
      component: IconDisplaySettingsTile,
      order: 10,
    },
    // později třeba:
    // { id: 'contract-types', label: 'Typy smluv', sectionId: 'types-settings', ... }
    // { id: 'theme-presets', label: 'Barevná schémata', sectionId: 'theme-settings', ... }
  ],

  actions: [],
}
