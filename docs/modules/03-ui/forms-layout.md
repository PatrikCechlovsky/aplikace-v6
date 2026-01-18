# Formuláře - Layout a Styling

**Datum:** 2025-01-XX  
**Modul:** 010 - Správa uživatelů  
**Status:** Implementováno

---

## 1. Přehled změn

Dnešní úpravy se zaměřily na sjednocení a vylepšení layoutu formulářů v aplikaci, konkrétně:

- **Hybridní layout:** Fixní na desktopu, responzivní na mobilu
- **Přizpůsobení šířky polí:** Podle typu pole (titul, jméno, email, atd.)
- **Kompaktní zobrazení:** Omezení max-width pro lepší čitelnost
- **Podpora density nastavení:** Respektování hustoty z modulu 900

---

## 2. Hybridní Layout Systém

### 2.1 Princip

Formuláře používají **hybridní přístup** k layoutu:

- **Desktop (≥ 980px):** Fixní layout - pole mají fixní pozice, nezávisle na šířce okna
- **Tablet (640-979px):** Responzivní grid - pole se přizpůsobují
- **Mobil (< 640px):** 1 sloupec - všechna pole pod sebou

### 2.2 Výhody

- **Konzistence:** Uživatel ví, kde co najde
- **Přehlednost:** Pole se nepřesouvají při změně šířky okna
- **Responzivita:** Funguje na všech zařízeních

---

## 3. Typy Gridů

### 3.1 Standardní Grid (`detail-form__grid`)

Pro formuláře s více poli (např. UserDetailForm):

**Desktop (≥ 980px):**
- Fixní 3 sloupce: `120px | 280px | 280px`
- Sekce "Osoba": Titul | Jméno | Příjmení

**Tablet (640-979px):**
- Responzivní 2 sloupce

**Mobil (< 640px):**
- 1 sloupec

### 3.2 Úzký Grid (`detail-form__grid--narrow`)

Pro jednodušší formuláře (např. InviteUserForm):

**Desktop (≥ 980px):**
- Fixní 2 sloupce: `280px | 280px`
- Max-width: `600px` (kompaktní zobrazení)
- Pole s `span-2`: max-width `400px` (ne přes celou obrazovku)

**Tablet (640-979px):**
- Responzivní 2 sloupce

**Mobil (< 640px):**
- 1 sloupec

---

## 4. Přizpůsobení Šířky Polí

### 4.1 Atributy polí

Každé pole má definované:

- **`maxLength`:** Maximální počet znaků (validace)
- **`size`:** Orientace šířka v znacích (vodítko pro prohlížeč)
- **CSS třídy:** Pro přizpůsobení vizuální šířky

### 4.2 Typy polí a jejich šířky

| Typ pole | maxLength | size | CSS třída | Max-width (desktop) |
|----------|-----------|------|-----------|---------------------|
| Titul před | 10 | 10 | `--short` | 120px |
| Jméno | 30 | 20 | `--medium` | 250px |
| Příjmení | 50 | 25 | `--medium` | 250px |
| E-mail | 255 | 40 | - | 400px (v narrow gridu) |
| Telefon | 20 | 20 | - | - |
| Zobrazované jméno | 50 | 30 | - | 400px (v narrow gridu) |
| Poznámka | 500 | - | - | 400px (v narrow gridu) |

### 4.3 CSS třídy

```css
.detail-form__input--short {
  max-width: 120px; /* Titul */
}

.detail-form__input--medium {
  max-width: 250px; /* Jméno/příjmení */
}
```

**Poznámka:** Na desktopu v fixním gridu je šířka řízena gridem, max-width se ignoruje.

---

## 5. Span (Roztažení Pole)

### 5.1 Použití

Pole mohou spanovat více sloupců:

- **`span-2`:** Přes 2 sloupce (v 2-sloupcovém gridu)
- **`span-3`:** Přes 3 sloupce (v 3-sloupcovém gridu)
- **`span-4`:** Přes všechny sloupce (v narrow gridu = span-2)

### 5.2 Responzivní chování

- **Mobil:** Všechna pole `span-1` (1 sloupec)
- **Tablet:** `span-2` funguje od 2 sloupců
- **Desktop:** Span funguje v fixním gridu

---

## 6. Podpora Density Nastavení

Formuláře respektují nastavení hustoty z modulu 900 (Nastavení → Vzhled a zobrazení):

### 6.1 Pohodlná (Comfortable)
- Gap mezi sekcemi: `24px`
- Padding sekcí: `16px`
- Font-size labelů: `13px`
- Font-size inputů: `14px`
- Min-height inputů: `40px`
- Gap v gridu: `12px 20px` (desktop)

### 6.2 Kompaktní (Compact)
- Gap mezi sekcemi: `20px`
- Padding sekcí: `14px`
- Font-size labelů: `12px`
- Font-size inputů: `13px`
- Min-height inputů: `36px`
- Gap v gridu: `10px 18px` (desktop)

### 6.3 Mini
- Gap mezi sekcemi: `16px`
- Padding sekcí: `12px`
- Font-size labelů: `11px`
- Font-size inputů: `12px`
- Min-height inputů: `32px`
- Gap v gridu: `8px 16px` (desktop)

---

## 7. Příklady Implementace

### 7.1 UserDetailForm

**Sekce "Základ":**
- Zobrazované jméno: `span-3` (plná šířka v 3-sloupcovém gridu)
- E-mail: `span-3` (plná šířka)
- Telefon: `span-1` (1 sloupec)
- Přihlašovací jméno: `span-1` (1 sloupec)

**Sekce "Osoba":**
- Titul před: `--short` (120px)
- Jméno: `--medium` (250px)
- Příjmení: `--medium` (250px)

### 7.2 InviteUserForm

**Layout:**
- Režim: `span-2` (max-width 400px)
- Uživatel: `span-2` (max-width 400px, pouze pokud "existující")
- E-mail: `span-2` (max-width 400px)
- Zobrazované jméno: `span-2` (max-width 400px)
- Role: `span-1` (1 sloupec, max 280px)
- Oprávnění: `span-1` (1 sloupec, max 280px)
- Poznámka: `span-2` (max-width 400px)

**Grid:** `detail-form__grid--narrow` (max-width 600px na desktopu)

---

## 8. CSS Struktura

### 8.1 Hlavní soubory

- `app/styles/components/DetailForm.css` - Hlavní styly formulářů
- `app/styles/components/TileLayout.css` - Layout wrapper (header + content)
- `app/styles/components/DensityTypography.css` - Density proměnné

### 8.2 Klíčové třídy

```css
.detail-form                    /* Kontejner formuláře */
.detail-form__section          /* Sekce formuláře (bílé pozadí) */
.detail-form__grid             /* Standardní grid */
.detail-form__grid--narrow     /* Úzký grid (pro jednodušší formuláře) */
.detail-form__field            /* Pole formuláře */
.detail-form__field--span-2    /* Pole přes 2 sloupce */
.detail-form__input            /* Input pole */
.detail-form__input--short     /* Krátké pole (titul) */
.detail-form__input--medium    /* Střední pole (jméno) */
```

---

## 9. Best Practices

### 9.1 Kdy použít standardní grid

- Formuláře s více poli (3+ sekce)
- Formuláře s různými typy polí (krátké + dlouhé)
- Formuláře, kde potřebujeme fixní layout (např. Osoba: Titul | Jméno | Příjmení)

### 9.2 Kdy použít narrow grid

- Jednodušší formuláře (1-2 sekce)
- Formuláře s převážně dlouhými poli (email, jméno)
- Formuláře, kde chceme kompaktní zobrazení (max-width 600px)

### 9.3 Pravidla pro span

- **Dlouhá pole** (email, jméno, poznámka): `span-2` v narrow gridu
- **Krátká pole** (titul): `span-1` s `--short` třídou
- **Střední pole** (jméno, příjmení): `span-1` s `--medium` třídou
- **Selecty** (role, oprávnění): `span-1` vedle sebe

---

## 10. Responzivní Breakpointy

```css
/* Mobil */
@media (max-width: 639px) {
  /* 1 sloupec, všechno pod sebou */
}

/* Tablet */
@media (min-width: 640px) and (max-width: 979px) {
  /* 2 sloupce, responzivní */
}

/* Desktop */
@media (min-width: 980px) {
  /* Fixní layout */
}
```

---

## 11. Pozadí a Theme

Formuláře respektují theme nastavení:

- **Pozadí formuláře:** Transparentní (respektuje `tile-layout__content` s `var(--color-surface-subtle)`)
- **Sekce formuláře:** Bílé pozadí (`var(--color-surface)`) s borderem
- **Input pole:** `var(--color-surface-subtle)` → `var(--color-surface)` při focus

---

## 12. Budoucí vylepšení

- [ ] Automatické přizpůsobení šířky podle `size` atributu
- [ ] Vizuální indikátor maxLength (např. "30/50 znaků")
- [ ] Lepší validace a error handling
- [ ] Podpora více typů polí (date picker, file upload, atd.)

---

## 13. Reference

- **Soubory:**
  - `app/styles/components/DetailForm.css`
  - `app/modules/010-sprava-uzivatelu/forms/UserDetailForm.tsx`
  - `app/modules/010-sprava-uzivatelu/forms/InviteUserForm.tsx`
  - `app/UI/TileLayout.tsx`

- **Související dokumentace:**
  - `docs/03-ui-system.md` - Obecný UI systém
  - `docs/03-ui/ui-list-and-detail-pattern.md` - List/Detail pattern
  - `docs/09-project-rules.md` - Pravidla projektu

