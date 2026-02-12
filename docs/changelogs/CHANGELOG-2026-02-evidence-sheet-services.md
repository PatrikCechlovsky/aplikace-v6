# Changelog – Evidence sheet services (2026-02)

## Shrnutí
- Sjednocení správy služeb pro evidenční list a jednotky se vzorem nemovitostí (UI, archivace, přílohy).
- Zarovnání toolbar tlačítek a nastavení sloupců (Column Drawer) s modulem Služby.
- Přidán sloupec `is_archived` do `contract_evidence_sheet_services` a služba pro archivaci.
- Evidence sheet služby nyní používají katalogové joiny (kategorie, účtování, jednotky, DPH).

## Dotčené části
- UI: EvidenceSheetServicesTab
- Service layer: contractEvidenceSheets
- DB: migrace 105
