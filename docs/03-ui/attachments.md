# docs/03-ui/attachments.md
# Přílohy (Attachments) – finální dohoda + implementace (v6)

Tento dokument je **zdroj pravdy** pro chování příloh v aplikaci-v6.

---

## 1) Finální dohoda (bez nejasností)

### 1️⃣ Detail entity → záložka „Přílohy“
**Účel:** informativní přehled  
**Stav:** **READ-ONLY**

Uživatel může:
- vidět seznam příloh (latest verze),
- filtrovat (text),
- zapnout „zobrazit archivované“,
- otevřít soubor (signed URL).

Uživatel **NEMŮŽE**:
- nahrávat nové přílohy,
- přidávat nové verze,
- editovat metadata,
- pracovat s historií verzí,
- archivovat / obnovovat.

> **Pravidlo:** V detailu entity nesmí vzniknout možnost změn příloh.

---

### 2️⃣ 📎 v CommonActions → samostatný TILE „Správa příloh“
**Účel:** plná práce s přílohami  
**Stav:** **MANAGER**

Uživatel může:
- přidat přílohu (vytvoří dokument + v001 + upload),
- nahrát novou verzi (upload nové verze ke stávajícímu dokumentu),
- editovat metadata (název/popisek),
- zobrazit historii verzí,
- zavřít správu a vrátit se do detailu entity.

> Otevírá se **mimo detail entity**, jako samostatný screen/tile.

---

## 2) Datový model (Supabase)

### Tabulky / view
- `documents` – metadata dokumentu + polymorfní vazba (`entity_type`, `entity_id`)
- `document_versions` – jednotlivé verze souboru
- `v_document_latest_version` – view pro „latest version“ na dokument

### Princip
- dokument = logický celek (název, popis)
- verze = konkrétní soubor
- nic se fyzicky nemaže → pouze archivace
- verzování je standard

---

## 3) Implementace (UI)

### Core komponenta (1×)
Soubor: `app/UI/detail-sections/DetailAttachmentsSection.tsx`

Režimy:
- `variant="list"`  
  - používá se v detailu entity (záložka „Přílohy“)
  - read-only: filtr, includeArchived, open file, refresh
- `variant="manager"`  
  - používá se v samostatném manager tile
  - plná správa: add, edit metadata, new version, versions/history

**Technická garance read-only:**
- v `variant="list"` se nerenderují UI prvky pro změny,
- všechny „write“ handlery jsou chráněné guardem (`if (!isManager) return`).

---

### Manager obrazovka
Soubor: `app/UI/attachments/AttachmentsManagerFrame.tsx`

- wrapper pro „Správa příloh“
- rendruje `DetailAttachmentsSection` jako `variant="manager"`
- může zobrazit důvod read-only (viz edge-cases)

---

## 4) Napojení přes CommonActions

V module tile (např. `UsersTile.tsx`):
- akce `attachments` (📎) otevře manager tile:
  - URL: `t=attachments-manager&id=<entityId>`
- zavření manageru vrací do detailu entity na záložku `attachments`

Důležité:
- nepřepínat záložky přes router (kvůli loopům)
- stabilizovat `useSearchParams()` přes `searchParams.toString()`

---

## 5) Edge-cases (povinné chování)

### 5.1 Entita není uložená
- pokud entita nemá `entityId` (create/new), přílohy nejsou dostupné
- UI: „Přílohy budou dostupné po uložení záznamu.“

### 5.2 Archivovaná entita
- manager tile se může otevřít (dohledání souborů)
- ale správa je **read-only** (bez write akcí)
- UI zobrazí důvod: „Entita je archivovaná – správa příloh je pouze pro čtení.“

### 5.3 Read-only role / oprávnění
- manager tile se otevře
- je read-only
- UI: „Nemáš oprávnění spravovat přílohy.“

### 5.4 RLS / 401 / 403
- zobrazit srozumitelnou hlášku
- žádné request stormy / nekonečné retry
- refresh je povolen

---

## 6) Test checklist

### Detail entity – záložka Přílohy (READ-ONLY)
- [ ] vidím seznam příloh (latest)
- [ ] filtr funguje
- [ ] přepínač „zobrazit archivované“ funguje
- [ ] otevření souboru funguje (signed URL)
- [ ] nikde nevidím: přidat / edit / nová verze / verze / historie / archivovat

### Manager tile – Správa příloh (MANAGER)
- [ ] přidat přílohu vytvoří document + v001 + upload
- [ ] edit metadat uloží title/description
- [ ] nová verze vytvoří další version + upload
- [ ] historie/verze se zobrazí
- [ ] zavření vrací do detailu entity na záložku Přílohy

---

## 7) Poznámka k budoucímu UI (CommonActions pro manager)
Dnes může manager používat lokální toolbar uvnitř `DetailAttachmentsSection`.
Pokud se rozhodneme, že akce budou 100% přes centrální CommonActions:
- přidat nové `CommonActionId` pro attachments manager, nebo
- vytvořit registry/handler podobně jako u formulářů.

Zásada: záložka v detailu entity zůstává vždy read-only.
