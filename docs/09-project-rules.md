# /docs/09-project-rules.md
## Popis: Hlavní pravidla projektu Pronajímatel v6 – vývojové standardy, dokumentace, UI/UX, naming conventions, workflow, moduly, bezpečnost a architektura.
---

# 09 – Pravidla projektu

---

# 1. Účel dokumentu

Tento dokument definuje **závazná pravidla**, která musí následovat:

- vývojáři,
- design,
- dokumentace,
- architektura,
- datový model,
- testování,
- deployment.

Je to **ústřední “konstituce projektu”**, která určuje, **jak** se vše dělá, aby aplikace byla udržitelná, škálovatelná a konzistentní.

---

# 2. Obecné principy projektu

## 2.1 Konzistence je priorita
Každý modul, formulář nebo část UI musí vypadat a chovat se stejně.

## 2.2 Jednoduchost před složitostí
Preferujeme jedno jasné řešení, než 3 obtížně udržitelné.

## 2.3 Nesmí vznikat duplicity
Každá logika, funkce, komponenta nebo typ existuje jen na jednom místě.

## 2.4 Dokumentace je součástí vývoje
Každá změna se zapisuje do dokumentace.  
(od tohoto okamžiku: **NEEXISTUJE změna bez aktualizace dokumentace**)

## 2.5 Vše musí být verzované
- kód,
- databázové změny,
- dokumenty,
- definice modulů,
- UI standardy.

---

# 3. Struktura repozitáře – závazná pravidla

Repo obsahuje tyto povinné části:

```
/app/               – Next.js aplikace
  /UI/              – globální UI komponenty
  /modules/         – moduly aplikace
  /auth/            – přihlášení
/docs/              – dokumentace 01–10
/docs/archive/      – archivní poznámky
/supabase/          – migrace DB a seed data
```

## Pravidla:

1. **NIC** se neukládá mimo výše uvedené struktury.  
2. Každý modul má svoji složku s přesnou strukturou.  
3. Každý dokument (01–10) musí existovat.  
4. Kód se nesmí ukládat do `/public/` (kromě assetů).  
5. V `/app/UI/` smějí být jen **globální** komponenty.

---

# 4. Naming conventions

## 4.1 Složky a soubory

| Typ | Formát |
|-----|--------|
| modul | `040-nemovitosti` |
| komponenta | `HomeButton.tsx` |
| config soubor | `module.config.js` |
| tile | `NemovitostiTile.tsx` |
| formulář | `NemovitostiForm.tsx` |
| přehled | `NemovitostiOverview.tsx` |

## 4.2 Značení modulů

Pevný formát:

```
<ordernumber>-<nazev-modulu>
```

Například:

- `010-uzivatele`
- `040-nemovitosti`
- `060-smlouvy`
- `900-nastaveni`

## 4.3 Proměnné

- camelCase  
- React komponenty: PascalCase  
- konstanty: UPPER_SNAKE_CASE  

---

# 5. Pravidla UI / UX

## 5.1 6-sekční layout je závazný

Každá stránka používá:

1. HomeButton  
2. Sidebar  
3. Horní lištu  
4. CommonActions  
5. Breadcrumbs  
6. Content  

*Odchylka není povolena.*

## 5.2 Sidebar – pravidla

- jen dynamické načítání modulů  
- každý modul musí mít ikonu  
- aktivní modul je zvýrazněn  
- 2. a 3. úroveň mají odsazení podle UI specifikace  

## 5.3 CommonActions

- centrální seznam akcí  
- moduly si definují jen *konfigurace použití*  
- UI engine rozhoduje:
  - disabled,
  - hidden,
  - requiresSelection,
  - requiresDirty.

## 5.4 Formuláře

Musí obsahovat:

- validaci (minimální)
- konzistentní vzhled
- pole dle datového modelu
- stejné chování pro “dirty state”

## 5.5 Přehledy

- tabulka musí být jednotná  
- výběr řádku aktivuje příslušné akce  
- filtry jsou vždy nahoře  

---

# 6. Pravidla modulů

## 6.1 Struktura modulu

Povinná struktura:

```
module.config.js
tiles/
forms/
overview/
```

## 6.2 module.config.js – pravidla

Musí obsahovat:

```js
id: '040-nemovitosti',
label: 'Nemovitosti',
icon: 'building',
order: 40,
enabled: true,
```

Volitelné, ale doporučené:

```js
commonActions: {...}
permissions: {...}
sections: [...]
```

## 6.3 Každý modul musí mít:

- min. 1 tile  
- min. 1 overview  
- min. 1 formulář (detail/edit)  
- vazby na data  

---

# 7. Pravidla dokumentace

## 7.1 Dokumenty 01–10 jsou POVINNÉ

- každý dokument má jasně definované téma,
- nic nesmí být mimo ně.

## 7.2 Každý dokument má 3 části:

- A = finální obsah  
- B = historické části (přeškrtnuté)  
- C = archiv (samostatný soubor)

## 7.3 Pravidla psaní dokumentace

- vždy v Markdownu  
- každý dokument začíná:
  - cestou souboru  
  - jednovětým popisem  
- bloky kódu vždy pomocí ```  
- nikdy ne HTML ani .docx  

---

# 8. Pravidla pro databázi a RLS

## 8.1 Každá tabulka musí obsahovat:

- `id (uuid)`  
- `created_at`  
- `created_by`  
- `updated_at`  
- `updated_by`  
- `owner_id` (pro multi-tenant logiku)  

## 8.2 Každá tabulka musí mít RLS

Příklad SELECT:

```sql
USING (owner_id = auth.uid())
```

## 8.3 Migrace musí být verzované

Používáme strukturu:

```
/supabase/migrations/XXX-description.sql
```

---

# 9. Pravidla pro vývoj a git workflow

## 9.1 Branch model

- `main` = produkce  
- `develop` (volitelné)  
- `feature/<nazev>` = vývoj  
- `fix/<nazev>` = bugfix  

## 9.2 Commit message

Formát:

```
[type] stručný popis

detailní popis (volitelné)
```

Povolené type:

- feat
- fix
- chore
- refactor
- docs
- style

## 9.3 PR (pull request)

Musí obsahovat:

- popis změny  
- screenshoty (pokud UI)  
- odkaz na změněný dokument 01–10  

---

# 10. Pravidla bezpečnosti

## 10.1 Secrets NIKDY necommitovat

## 10.2 SERVICE_ROLE_KEY nikdy na frontendu

## 10.3 RLS aktivní vždy a všude

## 10.4 Hesla musí být přes Supabase Auth

## 10.5 Logging jen bezpečný (bez citlivých dat)

---

# 11. Pravidla kvality kódu

- žádné funkce uvnitř JSX,  
- žádné console.log v produkci,  
- komponenty musí být malé a přehledné,  
- každý soubor max. ~300–400 řádků (když je víc → rozdělit),  
- žádná duplicita kódu,  
- typy v TypeScriptu povinné, žádné `any`.

---

# 12. Pravidla pro spolupráci s ChatGPT

Tato pravidla zavedl **Páťa**:

- ChatGPT nesmí mazat žádná data → vše se archivuje.  
- Dokumentace se píše v blocích A/B/C.  
- Odpověď musí být v jednom bloku, aby šla zkopírovat.  
- Pokud ChatGPT udělá chybu, musí vrátit celý blok znovu správně.  
- Nic se nesmí rozhodovat bez explicitního potvrzení.  

---

# 13. Závěr

Tento dokument definuje jednotný styl celého projektu.  
Pokud se pravidla dodržují → projekt je:

- stabilní,  
- udržitelný,  
- přehledný,  
- škálovatelný,  
- profesionální.

Jakákoliv práce mimo tato pravidla je **nepřípustná**.

---

# 📜 Historické části dokumentu – PRAVIDLA PROJEKTU

~~Původní úvaha: možná nebudeme potřebovat detailní pravidla.~~  
Tento názor byl později odmítnut.

~~Pravidla měla být jen v krátkém README.~~  
Ukázalo se však, že je nutné je mít jako samostatný dokument.

Tato sekce se bude plnit starými verzemi pravidel při každé aktualizaci.
