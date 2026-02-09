// FILE: app/modules/800-subjekty/module.config.js
// PURPOSE: Konfigurace modulu 800 – Subjekty (seznam + přidání)
// NOTE: Počty podle typů se načítají dynamicky v AppShell a labels se aktualizují

import SubjectsTile from './tiles/SubjectsTile'
import SubjectTypeTile from './tiles/SubjectTypeTile'
import CreateSubjectTile from './tiles/CreateSubjectTile'

// Factory funkce pro vytvoření SubjectTypeTile s přednastaveným typem
function createSubjectTypeTile(subjectType) {
  const WrappedComponent = function SubjectTypeTileWrapper(props) {
    return SubjectTypeTile({ ...props, subjectType })
  }
  WrappedComponent.displayName = `SubjectTypeTile_${subjectType}`
  return WrappedComponent
}

export default {
  id: '800-subjekty',
  order: 800,
  label: 'Subjekty',
  icon: 'address-book',
  enabled: true,

  tiles: [
    {
      id: 'subjects-list',
      label: 'Přehled subjektů',
      icon: 'list-alt',
      component: SubjectsTile,
      order: 10,
      children: [
        {
          id: 'subjects-type-osoba',
          label: 'Fyzická osoba (0)',
          icon: 'user',
          component: createSubjectTypeTile('osoba'),
          subjectType: 'osoba',
          dynamicLabel: true,
        },
        {
          id: 'subjects-type-osvc',
          label: 'OSVČ (0)',
          icon: 'briefcase',
          component: createSubjectTypeTile('osvc'),
          subjectType: 'osvc',
          dynamicLabel: true,
        },
        {
          id: 'subjects-type-firma',
          label: 'Firma (0)',
          icon: 'building',
          component: createSubjectTypeTile('firma'),
          subjectType: 'firma',
          dynamicLabel: true,
        },
        {
          id: 'subjects-type-spolek',
          label: 'Spolek / SVJ (0)',
          icon: 'users',
          component: createSubjectTypeTile('spolek'),
          subjectType: 'spolek',
          dynamicLabel: true,
        },
        {
          id: 'subjects-type-zastupce',
          label: 'Zástupce jiného subjektu (0)',
          icon: 'user-tie',
          component: createSubjectTypeTile('zastupce'),
          subjectType: 'zastupce',
          dynamicLabel: true,
        },
        {
          id: 'subjects-type-statni',
          label: 'Státní instituce (0)',
          icon: 'landmark',
          component: createSubjectTypeTile('statni'),
          subjectType: 'statni',
          dynamicLabel: true,
        },
      ],
    },
    {
      id: 'create-subject',
      label: 'Přidat subjekt',
      icon: 'plus',
      component: CreateSubjectTile,
      order: 20,
    },
  ],

  actions: [],
}
