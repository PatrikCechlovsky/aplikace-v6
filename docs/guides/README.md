# 📖 Guides – Návody a setupy

Tento adresář obsahuje praktické návody pro nastavení a použití různých funkcí aplikace.

---

## 📋 Dostupné návody

| Soubor | Téma | Popis |
|--------|------|-------|
| [ADDRESS-AUTOCOMPLETE-SETUP.md](ADDRESS-AUTOCOMPLETE-SETUP.md) | 🏠 **Adresní autocomplete** | Kompletní návod na nastavení ARES API integrace pro automatické doplňování adres |
| [ADDRESS-AUTOCOMPLETE-NAVOD.md](ADDRESS-AUTOCOMPLETE-NAVOD.md) | 📝 **Použití autocomplete** | Detailní návod, jak používat adresní autocomplete v aplikaci |
| [ADDRESS-AUTOCOMPLETE-FIX.md](ADDRESS-AUTOCOMPLETE-FIX.md) | 🔧 **Troubleshooting** | Řešení problémů s adresním autocomplete |

---

## 🎯 Struktura návodu

Každý guide by měl obsahovat:

### 1️⃣ **Účel**
- K čemu je funkce určena
- Kdo ji bude používat

### 2️⃣ **Prerekvizity**
- Co je potřeba mít připravené
- Závislosti, API klíče

### 3️⃣ **Krok za krokem setup**
- Číslované kroky
- Konkrétní příkazy nebo akce

### 4️⃣ **Příklady použití**
- Reálné use-cases
- Screenshots (pokud je to užitečné)

### 5️⃣ **Troubleshooting**
- Časté problémy
- Jak je vyřešit

### 6️⃣ **Related**
- Odkazy na související dokumentaci
- API dokumentace externích služeb

---

## 🔗 Související dokumentace

- [02-architecture.md](../02-architecture.md) – Technická architektura
- [changelogs/](../changelogs/) – Historie implementací
- [core/POSTUP.md](../core/POSTUP.md) – Vývojový proces

---

## ✍️ Jak vytvořit nový guide?

Při přidání nové funkce, která vyžaduje setup:

1. Vytvoř soubor: `{NAZEV-FUNKCE}-SETUP.md`
2. Použij strukturu výše
3. Buď konkrétní – uživatel by měl být schopný následovat návod bez dalších otázek
4. Přidej troubleshooting sekci
5. Aktualizuj tabulku výše v tomto README

---

## 🎓 Tipy pro psaní guides

✅ **Doporučení:**
- Používej číslování kroků
- Uvádej konkrétní příkazy, které má uživatel spustit
- Přidej expected output (co by měl uživatel vidět)
- Vysvětli důvod každého kroku
- Testuj návod na čistém prostředí

❌ **Vyhni se:**
- Předpokladům ("je jasné, že...")
- Vágním instrukcím ("nastav config správně")
- Přeskakování kroků
- Zastaralým informacím (pravidelně aktualizuj)

---

**Tip:** Guide by měl být užitečný i za půl roku, kdy už nebudeš pamatovat kontext. Piš pro budoucí sebe nebo nové členy týmu.
