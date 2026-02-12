# Modul 060 – Smlouvy

## Účel modulu
Modul **060 – Smlouvy** slouží pro evidenci nájemních smluv a jejich vazeb na **jednotky, nemovitosti, pronajímatele a nájemníky**. Je to základ pro návazné **platby** a **předávací protokoly**.

## Hlavní entity

### 1) `contracts`
Smlouva navázaná na jednotku, nájemníka a pronajímatele.

**Klíčová pole:**

- `cislo_smlouvy` – číslo smlouvy
- `stav` – stav smlouvy
- `property_id`, `unit_id`, `landlord_id`, `tenant_id`
- `datum_zacatek`, `datum_konec`, `doba_neurcita`
- `periodicita_najmu`, `den_platby`
- `najem_vyse`

## ✅ Co umí modul
- seznam smluv
- detail a editace smlouvy
- přílohy smlouvy (read-only tab + manager přes 📎)
- záložka **Služby** – připojení služeb na jednotku a výpočet součtu do „Výše nájmu"
- záložka **Uživatelé** – výběr uživatelů nájemníka pro konkrétní smlouvu
- záložka **Zástupci** – výběr zástupců nájemníka a pronajímatele
- záložka **Účty** – výběr účtu nájemníka a pronajímatele
- záložka **Evidenční listy** – verzované přílohy ke smlouvě (osoby + služby)

### 2) `handover_protocols`
- `contract_id` – vazba na smlouvu
- `typ_protokolu`, `stav_protokolu`

## Vazby
- **Smlouva** → **Jednotka** → **Nemovitost**
- **Smlouva** → **Pronajímatel** a **Nájemník** (subjekty)
- **Smlouva** → **Předávací protokoly** (1:N)

## Číselníky (generic_types)
Modul používá číselníky spravované v Nastavení:
- `contract_types`
- `contract_statuses`
- `handover_protocol_types`
- `handover_protocol_statuses`

Poznámka: Periodicita nájmu používá `service_periodicities` (shodné s periodicitou služeb).

## UI
- **Seznam smluv** (ListView) s filtrem a archivací
- **Detail smlouvy** (DetailView):
  - Základní údaje
  - Vazby
  - Evidenční listy (detail listu: osoby, služby, přílohy)
  - Finance
  - Poznámky
  - Archivace
  - Přílohy
  - Systémová metadata

## Poznámky
- Volba **jednotky** automaticky doplní vazby na **nemovitost a pronajímatele**. Nájemník se vybírá ručně.
- Pole **Počet uživatelů** se odvozuje z nájemníka (1 nájemník + spolubydlící).
- Účty jsou povinné pro aktivaci smlouvy.
- Zástupce je povinný pro firmu/spolek při aktivaci smlouvy.
- Evidenční listy se číslují od 1 výše a vždy mohou nahradit předchozí list.
- Změny osob/služeb se provádí vždy vytvořením nového evidenčního listu (předchozí se ukončí).
- **Konec smlouvy** je skrytý, pokud je nastavena **doba neurčitá**.
- Výpočty plateb a stavů budou napojeny na modul Plateb.
