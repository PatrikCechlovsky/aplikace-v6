# Modul 060 – Smlouvy

## Účel modulu
Modul **060 – Smlouvy** slouží pro evidenci nájemních smluv a jejich vazeb na **jednotky, nemovitosti, pronajímatele a nájemníky**. Je to základ pro návazné **platby** a **předávací protokoly**.

## Hlavní entity

### 1) `contracts`
Smlouva navázaná na jednotku, nájemníka a pronajímatele.

**Klíčová pole:**
- `cislo_smlouvy` – lidské číslo smlouvy (např. 2025-001)
- `stav` – stav smlouvy (koncept, aktivní, ukončená…)
- `property_id`, `unit_id`, `landlord_id`, `tenant_id`
- `datum_zacatek`, `datum_konec`, `doba_neurcita`
- `periodicita_najmu`, `den_platby`
- `kauce_potreba`, `kauce_castka`, `pozadovany_datum_kauce`
- `stav_kauce`, `stav_najmu`, `stav_plateb_smlouvy`
- `is_archived` + audit pole (`created_at`, `created_by`, `updated_at`, `updated_by`)

### 2) `handover_protocols`
Předávací protokoly navázané na smlouvu.

**Klíčová pole:**
- `contract_id` – vazba na smlouvu
- `typ_protokolu`, `stav_protokolu`
- `datum_predani`, `cas_predani`, `misto_predani`
- `meraky_stav`, `poznamky`, podpisy/přílohy
- `is_archived` + audit pole

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
  - Finance
  - Poznámky
  - Archivace
  - Přílohy
  - Systémová metadata

## Poznámky
- Volba **jednotky** automaticky doplní vazby na **nemovitost, pronajímatele a nájemníka**.
- **Konec smlouvy** je skrytý, pokud je nastavena **doba neurčitá**.
- Výpočty plateb a stavů budou napojeny na modul Plateb.
