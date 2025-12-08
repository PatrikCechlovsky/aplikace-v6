# aplikace-v6/docs/01-core/subject-model.md
# Subject – datový model (entita + související tabulky)

## Účel dokumentu
Tento dokument definuje **datový model subjektu**, tedy všechny tabulky, vazby a logiku, kterou systém používá k ukládání informací o osobách, firmách, nájemnících, pronajímatelích a dalších entitách.

Model je centrálním prvkem celé aplikace a používají ho moduly:

- 010 – Správa uživatelů  
- 020 – Můj účet  
- 030 – Správa kontaktů / firem  
- 050 – Nájemník a jeho domácnost  
- 110 – Správa subjektů (administrace)  

Tento dokument neurčuje UI ani SQL – pouze koncept a strukturu dat.

---

# 1. Hlavní entita: `subject`

Tabulka **subject** představuje jakoukoliv osobu nebo organizaci.

### 1.1 Definice subjektu
Subjekt může být:

- osoba
- OSVČ
- firma
- spolek
- státní organizace
- zástupce (osoba jednající za firmu)
- nájemník (vzniká kombinací role + typu subjektu)
- pronajímatel
- uživatel systému

### 1.2 Popis tabulky
Tabulka obsahuje:

- osobní údaje  
- firemní údaje  
- adresu  
- kontaktní informace  
- role a oprávnění  
- metadata a audit  
- návaznost na bankovní účty  
- vztahy na další entity (jednotky, spolubydlící, zástupce, dokumenty…)

Detailní seznam polí je uveden v dokumentu:

