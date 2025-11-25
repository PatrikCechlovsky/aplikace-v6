## ⚖️ Layout aplikace (Desktop & Mobile)

### Desktop verze

![Desktop Layout](sandbox:/mnt/data/022a5eb2-be63-4b6d-8bb5-b709832ae24b.png)

#### Rozvržení UI:

1. **Home Button**  
   - Logo aplikace / jméno aktuálního pronajímatele
   - Pevné umístění vlevo nahoře

2. **Sidebar (Menu modulů)**  
   - Dynamické: Načítá se dle `modules_config`
   - Obsahuje seznam aktivních modulů
   - Viditelnost dle role/uživatele/práv

3. **Breadcrumbs**  
   - Ukazuje aktuální cestu entitou/modulem (např. Domů > Uživatelé > Formulář > Jana Nová)

4. **Home Actions**  
   - Vyhledávání, Notifikace, Profil, Odhlášení
   - Viditelnost a dostupnost dle oprávnění

5. **Common Actions**  
   - Tlačítka nad aktuální entitou (např. Uložit, Archivovat, Export, ...)
   - Čte se z konfigurace modulu (form/view)

6. **Content Area**  
   - Hlavní plocha aplikace
   - Zobrazuje:
     - List View (seznam)
     - Detail Formuláře (hlavní entita)
     - Tabs/Vazby (další propojené entity)
     - Každá v záložce má List + Detail (přepínání mezi záznamy)

---

### 📱 Mobilní verze

- Sidebar je skrytý pod hamburger menu
- Home Actions se zobrazí jako dropdown
- Breadcrumbs zkrácené nebo skryté podle šířky
- Content Area je na výšku s posuvníkem
- Tabs zobrazeny jako horizontální posuvné menu nad detailem entity


---

## 🔐 Autentizace a Role Management

### ❌ Požadavek

- žádný uživatel nesmí vidět jiné záznamy, než které vlastní nebo spravuje
- Vše se bude kontrolovat pomocí JWT z `supabase.auth`

### ✅ Implementace

- Supabase Auth použito pro:
  - Registrace
  - 2FA (dvoufaktorové ověření)
  - Reset hesla
- Každý uživatel se zapíše do tabulky `users`
  - Obsahuje ID, e-mail, roli, přiděleného pronajímatele
- Každý záznam bude obsahovat `user_id` nebo `owner_id`
  - Filtrace dat na základě session

---

## 🔹 Shrnutí komponent

| Část        | Popis                                                | Zdroj dat             |
|-------------|-----------------------------------------------------|----------------------|
| 1. Home     | Logo + název aplikace/pronajímatele                  | Supabase / Settings  |
| 2. Sidebar  | Menu modulů                                        | modules_config.json  |
| 3. Breadcrumbs | Cesta k entitě                                  | Automatické dle navigace |
| 4. HomeActions | Vyhledávání, notifikace, profil, odhlášení     | Supabase / Context   |
| 5. CommonActions | Tlačítka přímo nad entitou                   | Modul konfigurace    |
| 6. Content  | Seznam + Formulář + Vazby                            | Modul / Tabs         |

---

## 🔹 TODO: Implementace

- [x] Nakreslený layout desktop verze
- [ ] Nakreslit mobilní verzi
- [ ] Vytvořit komponenty layoutu (Next.js / Tailwind)
- [ ] Vytvořit Supabase Auth integraci
- [ ] Založit tabulku `users` a napojit na session
- [ ] Zajistit kontrolu oprávnění v zobrazení modulů
- [ ] Spustit aplikaci na Vercelu s napojením na Supabase

