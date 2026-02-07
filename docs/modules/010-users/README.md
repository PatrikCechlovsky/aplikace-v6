# 👥 Modul 010 – Správa uživatelů

Dokumentace modulu pro správu uživatelských účtů a pozvánek.

---

## 📋 Obsah modulu

| Soubor | Popis |
|--------|-------|
| [010-users.md](010-users.md) | 📖 **Hlavní dokumentace modulu**<br/>Přehled funkcí, architektury, use-cases |
| [010-users-spec.md](010-users-spec.md) | 📋 **Technická specifikace**<br/>Pole, tabulky, API endpointy, RLS policies |
| [010-invite-flow.md](010-invite-flow.md) | 🔄 **Flow pozvánek**<br/>Proces vytvoření pozvánky, schválení, aktivace účtu |
| [010-invite-ui.md](010-invite-ui.md) | 🎨 **UI specifikace**<br/>Formuláře, listy, detaily pozvánek |
| [010-invite-backend.md](010-invite-backend.md) | ⚙️ **Backend implementace**<br/>Service layer, API endpoints, validace |

---

## 🎯 Účel modulu

Modul **010-sprava-uzivatelu** slouží pro:

1. **👤 Správu uživatelských účtů**
   - Zobrazení seznamu uživatelů
   - Detail uživatele (role, oprávnění)
   - Aktivace/deaktivace účtu

2. **✉️ Systém pozvánek (invites)**
   - Vytvoření pozvánky s emailem + rolí
   - Schvalovací proces (pending → approved)
   - Magic link pro registraci
   - Časová expirace pozvánek

3. **🔐 Správa rolí a oprávnění**
   - Přiřazení role: admin, landlord, tenant, user
   - Delegace oprávnění
   - RLS policies enforcement

---

## 🗄️ Databázové entity

### Tabulka: `users` (Supabase Auth)
- Email, password hash (Supabase Auth spravuje)
- Metadata: first_name, last_name, birth_date

### Tabulka: `user_invites`
- `id`, `email`, `role`, `invited_by`
- `status`: pending, approved, rejected, expired
- `expires_at`, `used_at`

---

## 🔗 Související dokumentace

- [Hlavní README modulů](../README.md)
- [05-auth-rls.md](../../05-auth-rls.md) – Autentizace a RLS
- [core/subject-permissions.md](../../core/subject-permissions.md) – Oprávnění subjektů

---

## 🚀 Kam dále?

- Implementace MFA (Multi-Factor Authentication)
- Audit log uživatelských akcí
- Automatické expirování neaktivních účtů
