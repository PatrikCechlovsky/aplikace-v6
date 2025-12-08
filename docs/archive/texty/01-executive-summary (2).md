# 01 – Executive Summary
Tento dokument shrnuje účel, rozsah a hlavní principy aplikace Pronajímatel v6.

## 1. Účel aplikace
Pronajímatel v6 je modulární systém pro správu nemovitostí, jednotek, nájemníků, smluv, plateb, energií, dokumentů a komunikace.

## 2. Klíčové vlastnosti
- Modulární architektura
- Dynamický UI layout
- Autentizace a bezpečnost
- Témata a ikony
- Napojení na Supabase

## 3. Uživatelé
- Majitelé nemovitostí
- Správci objektů
- Účetní
- Servisní technici

## 4. Technologie
Next.js, React, TypeScript, Supabase, Vercel.

## 5. Přehled modulů
010 Správa uživatelů
020 Můj účet
030 Pronajímatel
040 Nemovitost
050 Nájemník
060 Smlouva
070 Služby
080 Platby
090 Finance
100 Energie
120 Dokumenty
130 Komunikace
900 Nastavení

## 6. UI systém
Aplikace používá 6‑sekční layout:
1. HomeButton
2. Sidebar
3. Breadcrumbs
4. HomeActions
5. CommonActions
6. Content

## 7. Architektura
- app/UI – globální komponenty
- app/modules – moduly s definicemi tiles
- services – logika
- lib – helpery
- docs – dokumentace

## 8. Stav projektu
Základní systém hotový, UI a moduly ve výstavbě.

## 9. Cíle verze v6
- kompletní modulový systém
- bezpečný režim RLS
- detailní UI komponenty
- rozšiřitelný design

## Historická část
(pokusný návrh, bude doplněn při přesunu původních dokumentů)
