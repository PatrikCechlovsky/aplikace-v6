# 🚀 QUICK REFERENCE: onNavigate Pattern

## ⚡ Rychlý přehled

**Pattern:** Callback pro navigaci mezi tiles  
**Použití:** List → Add, Detail → Edit, Related entities  
**Status:** ✅ Implementováno v modulech 030, 050  

---

## 📋 Checklist pro implementaci

### ✅ Krok 1: Props interface
```typescript
type YourTileProps = {
  onNavigate?: (tileId: string) => void
}
```

### ✅ Krok 2: Destructuring
```typescript
export default function YourTile({ onNavigate }: YourTileProps) {
```

### ✅ Krok 3: Add handler
```typescript
if (id === 'add') {
  onNavigate?.('create-entity')
  return
}
```

### ✅ Krok 4: Ověř module.config.js
```javascript
tiles: [
  { id: 'list', component: ListTile },
  { id: 'create-entity', component: CreateTile } // ← musí existovat
]
```

---

## 🎯 Co to řeší

| Před | Po |
|------|-----|
| 40+ řádků create kódu | 3 řádky |
| Sidebar filtry otevřené | Automaticky zavřené |
| Lokální state management | Centrální navigace |
| Duplicitní logika | Konzistentní pattern |

---

## 📚 Dokumentace

- **Detailní návod:** [CHANGELOG-NAVIGATION-PATTERN-LIST-TO-ADD.md](changelogs/CHANGELOG-NAVIGATION-PATTERN-LIST-TO-ADD.md)
- **Přehled:** [SHRNUTÍ-NAVIGATION-PATTERN.md](SHRNUTÍ-NAVIGATION-PATTERN.md)
- **UI systém:** [03-ui-system.md](03-ui-system.md) (sekce 11)

---

## 💻 Příklady kódu

**LandlordsTile:**
```typescript
if (id === 'add') {
  onNavigate?.('create-landlord')
  return
}
```

**TenantsTile:**
```typescript
if (id === 'add') {
  onNavigate?.('create-tenant')
  return
}
```

---

## 🧪 Test

1. Otevři přehled → filtry v Sidebaru ✅
2. Klik **+ (Přidat)** ✅
3. Seznam se zavře, filtry se zavřou ✅
4. Create tile se otevře ✅

---

## ⏭️ Další moduly

- [x] 030 Pronajímatelé ✅
- [x] 050 Nájemníci ✅  
- [x] 040 Nemovitosti ✅
- [x] 040 Jednotky ✅
- [ ] 060 Smlouvy
- [ ] 070 Služby
- [ ] 080 Platby

---

**Commity:** `2b892f1`, `275b4a9`, `0937009`
