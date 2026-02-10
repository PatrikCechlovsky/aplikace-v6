# 🎨 Modul 03-ui – UI komponenty a design patterns

Dokumentace UI komponent, layoutu a design patterns používaných v aplikaci.

---

## 📋 Obsah modulu

| Soubor | Popis |
|--------|-------|
| [attachments.md](attachments.md) | 📎 **Systém příloh**<br/>Jak fungují attachmenty, storage, verze, zobrazení |
| [forms-layout.md](forms-layout.md) | 📝 **Layout formulářů**<br/>Grid system, responsive breakpoints, DetailForm.css |
| [ui-list-and-detail-pattern.md](ui-list-and-detail-pattern.md) | 📋 **List + Detail pattern**<br/>ListView, DetailFrame, RelationListWithDetail |

---

## 🎯 Účel modulu

Tento modul dokumentuje **UI systém aplikace** – není to klasický funkční modul, ale dokumentace designu.

### Co najdeš v této složce:

1. **🏗️ Strukturální komponenty**
   - AppShell – 6-section layout (immutable)
   - Sidebar, TopMenu, Breadcrumbs
   - HomeButton, HomeActions

2. **📋 Data zobrazení**
   - EntityList (ListView) – tabulky s filtry
   - EntityDetailFrame (DetailView) – detail entity s tabuky
   - RelationListWithDetail – list + detail sidebar

3. **📝 Formuláře**
   - DetailView – generický form renderer
   - InputWithHistory – input s historií
   - AddressAutocomplete – adresní autocomplete
  - GenericTypeTile – nové položky se vytváří vždy jako aktivní

4. **📎 Přílohy**
   - DetailAttachmentsSection – read-only tab
   - AttachmentManagementTile – upload/version/edit
   - Storage: `documents/{entity-type}/{entity-id}/{doc-id}/v{version}/{filename}`

---

## 🏗️ 6-Section UI Layout (IMMUTABLE)

Každá obrazovka v aplikaci má PEVNOU strukturu:

```
┌────────────────────────────────────────────┐
│ 1. HomeButton (top-left)                   │
├──────────┬─────────────────────────────────┤
│          │ 2. TopBar                       │
│          │   - Breadcrumbs (left)          │
│ 2.       │   - HomeActions (right)         │
│ Sidebar  ├─────────────────────────────────┤
│          │ 3. CommonActions (toolbar)      │
│ (modules)├─────────────────────────────────┤
│          │ 4. Content                      │
│          │   - EntityList / DetailFrame /  │
│          │     TileLayout                  │
├──────────┼─────────────────────────────────┤
│          │ 5. Footer (optional)            │
└──────────┴─────────────────────────────────┘
```

**NIKDY neměň tuto strukturu!**

Viz: [app/AppShell.tsx](../../../app/AppShell.tsx)

---

## 📋 Standard komponenty (app/UI/)

| Komponenta | Účel | Kdy použít |
|------------|------|------------|
| `EntityList` | Tabulka s filtry | Seznam entit (users, landlords, tenants) |
| `EntityDetailFrame` | Detail s tabuky | Detail entity (user, landlord, tenant) |
| `DetailView` | Form renderer | Generování formulářů z definice |
| `RelationListWithDetail` | List + sidebar detail | Vztahy 1:N (tenant → users, entity → accounts) |
| `CommonActions` | Toolbar akce | Add, Edit, Delete, Filter, Export, ... |
| `TileLayout` | Grid tiles | Dashboard, entry point modulu |

**Pravidlo:** Pokud existuje komponenta, POUŽIJ ji. Nevytvárej duplikáty!

---

## 🎨 Responsive Design

### Breakpoints (DetailForm.css)

```css
/* Mobile: < 768px */
.detail-form__grid--narrow {
  grid-template-columns: 1fr;
  gap: 6px 16px;
}

/* Tablet: 768px - 1024px */
@media (min-width: 768px) {
  .detail-form__grid--narrow {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 16px;
  }
}

/* Desktop: > 1024px */
@media (min-width: 1024px) {
  .detail-form__grid--narrow {
    grid-template-columns: 300px 300px;
    gap: 12px 16px;
  }
}
```

### Mobile-only spacer

```css
.mobile-only-spacer {
  display: block;
  height: 12px;
  
  @media (min-width: 768px) {
    display: none;
  }
}
```

Použití: Vizuální oddělení skupin checkboxů na mobilu.

---

## 🔗 Související dokumentace

- [03-ui-system.md](../../03-ui-system.md) – Celý UI systém
- [02-architecture.md](../../02-architecture.md) – Architektura
- [app/UI/](../../../app/UI/) – Zdrojový kód komponent

---

## 🚀 Příklady použití

### EntityList + EntityDetailFrame

```typescript
// TenantsTile.tsx (seznam)
<EntityList
  data={tenants}
  columns={[
    { key: 'full_name', label: 'Jméno' },
    { key: 'email', label: 'Email' },
  ]}
  onRowClick={(tenant) => router.push(`/tenants/${tenant.id}`)}
/>

// TenantDetailFrame.tsx (detail)
<EntityDetailFrame
  title={tenant.full_name}
  tabs={[
    { id: 'basic', label: 'Základní údaje', content: <TenantDetailForm /> },
    { id: 'users', label: 'Uživatelé', content: <TenantUsersSection /> },
  ]}
/>
```

### RelationListWithDetail

```typescript
// TenantUsersSection.tsx (1:N vztah)
<RelationListWithDetail
  items={tenantUsers}
  selectedId={selectedUserId}
  onSelect={setSelectedUserId}
  renderForm={(user, viewMode) => (
    <DetailView
      value={user}
      fields={[
        { name: 'first_name', label: 'Jméno', type: 'text', required: true },
        { name: 'last_name', label: 'Příjmení', type: 'text', required: true },
      ]}
      viewMode={viewMode}
    />
  )}
/>
```

---

## ⚠️ Pravidla pro UI komponenty

✅ **Dodržuj:**
- 6-section layout (immutable)
- Použij existující komponenty
- Responsive breakpoints (mobile, tablet, desktop)
- Consistent spacing (DetailForm.css)

❌ **Nedělej:**
- Vlastní layout mimo AppShell
- Duplikátní komponenty
- Hardcoded breakpoints
- Inline styles (použij CSS třídy)

---

**Tip:** Když přidáváš novou UI featuru, VŽDY nejprve zkontroluj `app/UI/` – pravděpodobně už existuje komponenta, kterou můžeš použít.
