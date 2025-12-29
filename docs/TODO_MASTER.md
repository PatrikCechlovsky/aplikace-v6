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


# TODO – Globální audit log (celá aplikace)

## Cíl
Zavést jednotný **audit log** pro celou aplikaci (business události), aby bylo dohledatelné:
- kdo provedl změnu
- kdy
- na jaké entitě
- co se změnilo (whitelist diff)
- odkud změna přišla (modul / tile / akce)

Audit log je oddělený od:
- verzování souborů (document_versions)
- technických logů (console, server errors)

---

## 1) DB – tabulka public.audit_log

### Účel
Jedna centrální tabulka pro audit celé aplikace  
(logují se pouze smysluplné business události)

### Struktura sloupců

### Core
- id uuid (PK)
- created_at timestamptz DEFAULT now()

### Actor (kdo)
- actor_user_id uuid NULL (auth.users.id)
- actor_subject_id uuid NULL (subjects.id)
- actor_name text NULL (denormalizace pro čitelnost)
- actor_email text NULL (denormalizace)

### Context (odkud)
- origin_module text NULL (např. 010)
- origin_tile text NULL (např. UsersTile)
- origin_action text NULL (např. attachmentsSave, saveUser)
- request_id text NULL (pro spojení více logů jedné akce)
- ip inet NULL
- user_agent text NULL

### Target (co)
- entity_type text NOT NULL (subjects, documents, contracts…)
- entity_id uuid NULL
- entity_label text NULL (denormalizace – jméno / název)

### Event
- action text NOT NULL
- severity text NOT NULL DEFAULT info (info | warning | error)
- success boolean NOT NULL DEFAULT true
- message text NULL (krátké lidské shrnutí)

### Data
- diff jsonb NULL (whitelist změn / event payload)
- meta jsonb NULL (technický kontext)

### Indexy
- created_at DESC
- entity_type + entity_id + created_at DESC
- actor_subject_id + created_at DESC
- origin_module + created_at DESC

---

## 2) RLS a práva

### MVP nastavení
- INSERT: pouze server / service role
- SELECT: pouze admin

Později rozšířit podle oprávnění k entitám.

---

## 3) Konvence – action slovník

Používat stabilní stringy (ne UI názvy).

### Základní
- create
- update
- archive
- restore
- delete

### Aplikační
- invite_create
- invite_send
- doc_create
- doc_meta_change
- doc_new_version
- role_change
- permission_change

---

## 4) Pravidla pro diff (whitelist)

### Ukládat
- title
- description
- tags
- is_archived
- role / permission kódy
- document: version_number, file_name, mime, size

### Neukládat
- hesla
- tokeny
- invite tokeny
- secrets
- velké payloady
- citlivé PII

### Formáty diff

Změny polí:
- type: fields
- fields: { field: { from, to } }

Event:
- type: event
- event: { version_number, file_name, size }

Bulk:
- type: bulk
- bulk: { count, ids_sample }

---

## 5) Aplikační vrstva – helper logAuditEvent

### Umístění
- společná service vrstva (např. app/lib/services/audit.ts)

### Vstupy
- actor (user / subject + jméno + email)
- entity (type / id / label)
- action
- message
- diff
- meta
- origin_module
- origin_tile
- origin_action
- request_id (volitelné)

### Pravidla
- logovat pouze v services
- nikdy v UI
- nikdy v CommonActions

---

## 6) MVP scope – co logovat jako první

### Priorita 1
- Users / Subjects: create, update, archive, restore
- Invites: invite_create, invite_send
- Documents / Attachments:
  - doc_create
  - doc_meta_change
  - doc_new_version

### Priorita 2 (později)
- import / export
- finance / platby
- globální admin timeline
- retention / export / GDPR

---

## 7) UI (později)
- Detail dokumentu / příloh: Historie
  - Verze souborů (document_versions)
  - Změny metadat + audit (audit_log)
- Admin část:
  - globální filtr auditů podle entity / modulu / aktéra
