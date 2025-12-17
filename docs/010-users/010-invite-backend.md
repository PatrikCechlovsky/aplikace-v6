# Modul 010 – Invite flow (Backend koncept)

## 1. Entita: Pozvánka

Pozvánka je samostatná entita:
- není uživatel,
- není role,
- je procesní záznam.

## 2. Minimální data
- režim (existing / new)
- subject_id (pokud existující)
- email (pokud nový)
- role
- stav
- auditní pole

## 3. Stavy pozvánky
- pending
- sent
- accepted
- expired
- canceled

## 4. Audit
- created_at
- created_by
- sent_at

## 5. Bezpečnost
- RLS: přístup pouze pro oprávněné role
- běžný uživatel nevidí cizí pozvánky

## 6. Budoucí rozšíření
- znovu odeslat
- zrušit pozvánku
- log změn role
