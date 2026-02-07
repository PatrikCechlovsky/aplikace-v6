# 👤 Modul 020 – Můj účet

Dokumentace modulu pro správu osobního účtu přihlášeného uživatele.

---

## 📋 Obsah modulu

| Soubor | Popis |
|--------|-------|
| [020-my-account-spec.md](020-my-account-spec.md) | 📋 **Technická specifikace**<br/>Pole, formuláře, validace, API |
| [020-my-account-fields-recommendation.md](020-my-account-fields-recommendation.md) | 💡 **Doporučení polí**<br/>Jaká pole zobrazit v profilu, důvody |

---

## 🎯 Účel modulu

Modul **020-muj-ucet** slouží pro:

1. **👤 Osobní profil**
   - Zobrazení vlastních údajů (jméno, email, telefon)
   - Editace osobních údajů
   - Změna profilového obrázku

2. **🔐 Bezpečnost účtu**
   - Změna hesla
   - Nastavení MFA (Two-Factor Authentication)
   - Seznam aktivních sessions
   - Audit log přihlášení

3. **⚙️ Nastavení**
   - Jazyková lokalizace (CS/EN)
   - Téma (light/dark)
   - Notifikační preference

---

## 🗄️ Databázové entity

### Tabulka: `auth.users` (Supabase Auth)
- `email`, `email_confirmed_at`
- `phone`, `phone_confirmed_at`
- `user_metadata`: JSON s firstName, lastName, birthDate

### Tabulka: `user_profiles` (rozšíření)
- `user_id` (FK na auth.users)
- `avatar_url`, `bio`
- `locale`, `theme`

---

## 🔗 Související dokumentace

- [Hlavní README modulů](../README.md)
- [05-auth-rls.md](../../05-auth-rls.md) – Autentizace
- [010-users/](../010-users/) – Správa uživatelů (admin pohled)

---

## 🎨 UI Flow

```
1. Uživatel klikne na ikonu profilu (top-right)
2. Otevře se dropdown:
   - Můj účet
   - Nastavení
   - Odhlásit se
3. "Můj účet" → DetailView s tabuky:
   - Osobní údaje (edit mode)
   - Bezpečnost (heslo, MFA)
   - Nastavení (locale, theme)
```

---

## 🚀 Budoucí rozšíření

- [ ] Integrace s OAuth providery (Google, Apple)
- [ ] Export vlastních dat (GDPR)
- [ ] Smazání účtu (anonymizace dat)
- [ ] Notifikační centrum (email + in-app)
