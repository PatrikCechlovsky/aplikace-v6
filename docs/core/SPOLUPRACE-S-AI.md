# aplikace-v6/docs/00-core/SPOLUPRACE-S-AI.md
# SPOLUPRACE S AI – pravidla a workflow

## Účel dokumentu
Tento dokument definuje pravidla a postup pro spolupráci s AI asistentem (Cursor AI) na projektu aplikace-v6.  
Zajišťuje konzistentní workflow, jasnou komunikaci a správné nasazení změn.

---

# 1. ZÁKLADNÍ PRINCIPY

## 1.1 Komunikace
- **Kód se nevysvětluje dlouze** – uživatel kódu nerozumí a nepotřebuje technické detaily
- **Výsledek je důležitý** – uživatel chce vidět změny v aplikaci na Vercelu
- **Pomalejší tempo** – jdeme krok za krokem, aby si uživatel zvykl
- **Ptám se, když si nejsem jistý** – AI se ptá před většími změnami

## 1.2 Dokumentace
- Všechny změny se dokumentují do `/docs/`
- Dokumentace se aktualizuje při každé změně
- Respektujeme strukturu dokumentace (01–10, modulové složky, archiv)

## 1.3 Respektování existujících pravidel
- AI musí respektovat všechna pravidla z `/docs/09-project-rules.md`
- AI nesmí měnit strukturu bez svolení
- AI nesmí vytvářet duplicity
- AI musí vždy dodat kompletní soubor

---

# 2. WORKFLOW ZMĚN

## 2.1 Větev (Branch)
- Všechny změny se dělají v **samostatné větvi** (ne v `main`)
- Název větve: `feature/nazev-zmeny` nebo `feature/ai-spoluprace`
- Větev se vytvoří před začátkem práce

## 2.2 Proces změn
```
1. Vytvoření větve
   ↓
2. Úpravy kódu (AI dělá změny)
   ↓
3. Commit změn (AI navrhne commit message)
   ↓
4. Push na GitHub (do větve)
   ↓
5. Vercel vytvoří preview automaticky
   ↓
6. Testování na preview URL
   ↓
7. Pokud OK → merge do main
   Pokud ne → úpravy ve větvi
```

## 2.3 Commit a Push
- AI může udělat commit a push **s uživatelovým souhlasem**
- Commit message musí být jasný a popisný
- Push se dělá do větve, ne do `main`
- `main` zůstává vždy stabilní

---

# 3. TESTOVÁNÍ A NASAZENÍ

## 3.1 Vercel Preview
- Každá větev automaticky vytvoří preview na Vercelu
- URL: `https://aplikace-v6-git-feature-xyz.vercel.app`
- Uživatel testuje změny na preview, ne na produkci

## 3.2 Merge do main
- Merge se dělá až po otestování na preview
- Uživatel rozhoduje, kdy je to připravené
- Po merge do `main` se automaticky nasadí na produkci

---

# 4. PRAVIDLA PRO AI

## 4.1 Co AI dělá
- ✅ Upravuje soubory v projektu
- ✅ Vytváří nové soubory podle potřeby
- ✅ Navrhuje commit messages
- ✅ Může commitnout a pushnout (s souhlasem)
- ✅ Aktualizuje dokumentaci

## 4.2 Co AI nedělá
- ❌ Nemění strukturu bez svolení
- ❌ Nevytváří duplicity
- ❌ Neobchází existující pravidla
- ❌ Necommitne bez souhlasu (pokud není výslovně řečeno)
- ❌ Nezmění `main` přímo

## 4.3 Povinnosti AI
- Vždy dodat kompletní soubor (ne jen část)
- Respektovat všechny standardy z `09-project-rules.md`
- Aktualizovat dokumentaci při změnách
- Ptát se, když si není jistý

---

# 5. PAMĚŤ A KONTEXT

## 5.1 V rámci konverzace
- AI si pamatuje celou historii konverzace
- Pravidla z tohoto dokumentu si pamatuje po celou dobu konverzace
- Nemusí se opakovat během jedné konverzace

## 5.2 Nová konverzace
- Na začátku nové konverzace: uživatel řekne "Přečti si pravidla ze `/docs/00-core/SPOLUPRACE-S-AI.md`"
- Nebo uživatel napíše pravidla na začátku zprávy
- AI si přečte dokumentaci a dodrží pravidla

---

# 6. TEMPO A STYLE PRÁCE

## 6.1 Pomalejší tempo
- Jdeme krok za krokem
- Uživatel si zvyká na spolupráci
- Nejdříve pochopit, pak implementovat

## 6.2 Jasná komunikace
- AI vysvětluje, co dělá (stručně)
- AI se ptá, když si není jistý
- AI navrhuje řešení, ale rozhoduje uživatel

## 6.3 Výsledek před vysvětlením
- Důležitý je výsledek v aplikaci
- Technické detaily nejsou potřeba
- Uživatel vidí změny na Vercelu

---

# 7. DOKUMENTACE ZMĚN

## 7.1 Kdy aktualizovat dokumentaci
- Při změně modulu → aktualizovat `04-modules.md` nebo modulovou dokumentaci
- Při změně UI → aktualizovat `03-ui-system.md`
- Při změně datového modelu → aktualizovat `06-data-model.md`
- Při změně pravidel → aktualizovat `09-project-rules.md`

## 7.2 Formát dokumentace
- Respektovat hlavičky souborů (FILE, PURPOSE)
- Používat append-only přístup (nic nemažeme, jen přidáváme)
- Historické části označit jako zastaralé, ale nechat

---

# 8. CHECKLIST PRO KAŽDOU ZMĚNU

- [ ] Vytvořena větev (nebo už existuje)
- [ ] Změny v kódu provedeny
- [ ] Dokumentace aktualizována (pokud je potřeba)
- [ ] Commit vytvořen (s jasným message)
- [ ] Push na GitHub (do větve)
- [ ] Vercel preview vytvořen
- [ ] Uživatel otestoval
- [ ] Pokud OK → merge do main
- [ ] Pokud ne → úpravy ve větvi

---

# 9. ZÁVĚR

Tato pravidla zajišťují:
- Bezpečný workflow (větev → test → main)
- Jasnou komunikaci
- Respektování existujících pravidel projektu
- Možnost testování před nasazením

Pravidla se mohou upravovat podle potřeby. Všechny změny se dokumentují.

---

# 10. HISTORICKÉ ČÁSTI

*(Zatím prázdné, připravené pro budoucí úpravy pravidel)*

