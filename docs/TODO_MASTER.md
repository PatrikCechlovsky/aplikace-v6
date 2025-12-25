# TODO MASTER – Aplikace Pronajímatel v6

Tento dokument je jediný konsolidovaný seznam úkolů v projektu.

Pravidla:
- Nové úkoly se přidávají výhradně sem.
- Duplicitní TODO soubory se po sloučení smažou.
- V TODO dokumentech nepoužívat fenced code blocky (TS/JS). TODO = plán práce.

---

## 0) TODO CLEANUP – sjednocení na 1 master

### 0.1 Kde jsme našli duplicitní TODO listy
Tyto soubory jsou duplicity a po sloučení do tohoto masteru je možné je smazat:
- `docs/todo_list.md`  → SLOUČENO
- `docs/03-ui/todolist.md` → SLOUČENO

### 0.2 Kde je ještě slovo TODO mimo todo listy (informativně)
Tyto soubory nejsou “TODO list”, ale obsahují TODO poznámky / pravidla / šablony:
- `docs/09-project-rules.md`
- `docs/08-plan-vyvoje.md`
- `docs/00-core/POSTUP.md` (šablona)
- `app/modules/postup.md` (šablona, obsahuje konkrétní TODO body)
- `app/modules/010-sprava-uzivatelu/MODULE-TODO.md` (implementační plán modulu 010)
- `app/modules/020-muj-ucet/MODULE-TODO.md` (implementační plán modulu 020)

Poznámka:
- Pokud chceme „jen jeden TODO“, doporučeno přejmenovat `MODULE-TODO.md` na `MODULE-PLAN.md` (nebo přesunout do docs).

---

## 1) Kritické problémy / stabilita

- [x] Opravit blikání UI / request stormy (useSearchParams → stabilní klíč přes toString)
- [ ] Zamezit opakovaným fetchům v dalších modulech (anti-storm pattern jako standard)
- [ ] Zkontrolovat, že nikde nevzniká loop přes router/query state

---

## 2) CommonActions (globální akce)

- [ ] Dokončit jednotná pravidla viditelnosti (mode/selection/permission)
- [ ] Zamezit ztrátě neuložených dat při navigaci (confirm)
- [ ] Reset CommonActions při přepnutí tile
- [ ] Otestovat CommonActions ve všech modulech

---

## 3) UI systém – List / Detail / Manager

- [ ] Sjednotit životní cyklus formulářů (read/edit/create)
- [ ] Jednotné “dirty” chování (nastavení, reset, confirm při close)
- [ ] Jednotný vzor pro manager screen (není tab v detailu, je samostatný tile)

---

## 4) Přílohy / Dokumenty (globální pravidlo)

### 4.1 Detail entity – záložka Přílohy (READ-ONLY)
- [ ] Zajistit, že v detailu entity nelze nic měnit (UI i guardy)
- [ ] Filtrace + přepínač archivovaných
- [ ] Otevření souboru (signed URL)

### 4.2 📎 CommonActions – Správa příloh (MANAGER TILE)
- [ ] Přidat přílohu (document + v001 + upload)
- [ ] Nová verze (upload další verze)
- [ ] Edit metadat (název, popis)
- [ ] Historie verzí
- [ ] Zavřít a vrátit se do detailu entity na záložku Přílohy

### 4.3 Edge-cases (povinné)
- [ ] Archivovaná entita → manager otevřít, ale read-only + důvod
- [ ] Read-only role → manager otevřít, ale read-only + důvod
- [ ] RLS/401/403 → srozumitelná hláška, žádné request stormy

---

## 5) Modul 010 – Správa uživatelů

- [ ] UX doladění detailu (šířky, texty, pořadí sekcí)
- [ ] Pozvánky – doladit chování po odeslání (zůstat / zavřít)
- [ ] Zabránit opakovanému posílání pozvánky po first_login_at
- [ ] Systémová sekce – sjednocený formát datum/čas (bez ISO “T”, bez mikrosekund)
- [ ] Přílohy u uživatele: read-only tab v detailu + manager tile přes 📎

---

## 6) Reorder / přečíslování typů (role, permission, …)

- [ ] Opravit bug s duplicitním pořadím při přesunu (2× stejné číslo)
- [ ] Zajistit atomický reorder (bez duplicit)
- [ ] Otestovat na role_types / permission_types a dalších typech

---

## 7) ListView – “druhé kolo” TODO (z app/modules/postup.md)

- [ ] Automatické filtry podle vlastníka (owner-based filtering)
- [ ] Přidat logiku pro “archivované” v seznamu (jednotný pattern)
- [ ] Vymyslet zobrazení ikon stavů v seznamu (status icons)
- [ ] Performance optimalizace (po dokončení základního UX)

---

## 8) Dokumentace

- [ ] Udržovat jen 1 TODO dokument (tento)
- [ ] Po sloučení smazat:
  - `docs/todo_list.md`
  - `docs/03-ui/todolist.md`
- [ ] Rozhodnout, zda `MODULE-TODO.md` přejmenovat/přesunout (aby neexistovalo více “TODO” názvů)

---

## 9) Test checklist (minimální)

- [ ] Build na Vercel bez TS chyb
- [ ] Modul 010: list → detail → attachments manager → zpět
- [ ] Přílohy: read-only tab v detailu (bez write možností)
- [ ] Přílohy: manager umí add/edit/version/history
- [ ] Žádné request stormy při přepínání režimů
