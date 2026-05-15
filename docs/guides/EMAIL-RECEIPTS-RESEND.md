# 📧 Odesílání potvrzení o platbě (Resend) – návrh kompletního řešení

> Stav: návrh architektury a datového modelu pro Aplikaci v6.

## 1) Cíle a zásady
- **Legálně použitelné potvrzení**: auditní stopa, neměnitelné PDF, prokazatelná integrita.
- **Vazba na platbu**: každé potvrzení musí mít jednoznačný vztah k platbě a nájemní smlouvě.
- **Doručení e‑mailem**: Resend (transakční e‑maily), log odeslání a doručení.
- **QR ověření**: veřejná stránka pro ověření pravosti PDF.
- **Číslování**: sekvenční, podle roku a společnosti/pronajímatele.
- **Archivace**: žádné fyzické mazání, pouze `is_archived`.

> ⚠️ Právní upozornění: jde o technický návrh. Pro právní závaznost je nutná kontrola právníkem (náležitosti potvrzení, podpis, archivace).

---

## 2) Datový model (tabulky)

### 2.1 `payment_receipts`
Záznam o vystaveném potvrzení.
- `id` UUID PK
- `tenant_id` UUID FK -> `subjects`
- `landlord_id` UUID FK -> `subjects`
- `contract_id` UUID FK -> `contracts`
- `payment_id` UUID FK -> `payments`
- `receipt_number` TEXT (např. `2026-000123-LLD01`)
- `issued_at` TIMESTAMPTZ NOT NULL
- `period_from` DATE NULL
- `period_to` DATE NULL
- `amount` NUMERIC(12,2) NOT NULL
- `currency` TEXT DEFAULT 'CZK'
- `pdf_attachment_id` UUID FK -> `attachments`
- `pdf_sha256` TEXT NOT NULL
- `qr_token_id` UUID FK -> `receipt_qr_tokens`
- `status` TEXT CHECK in (`draft`,`issued`,`voided`)
- `note` TEXT NULL
- `created_at`, `created_by`, `updated_at`
- `is_archived` BOOLEAN DEFAULT false

**Indexy**:
- `receipt_number` UNIQUE
- `payment_id` UNIQUE
- `(landlord_id, issued_at)`

### 2.2 `receipt_number_counters`
Sekvenční číslování po roku/pronajímateli.
- `id` UUID PK
- `landlord_id` UUID FK -> `subjects`
- `year` INT NOT NULL
- `last_number` INT NOT NULL
- `prefix` TEXT NULL (např. `LLD01`)
- `updated_at`

**Unique**: `(landlord_id, year)`

### 2.3 `receipt_email_log`
Log odeslání e‑mailu (Resend).
- `id` UUID PK
- `receipt_id` UUID FK -> `payment_receipts`
- `to_email` TEXT NOT NULL
- `subject` TEXT NOT NULL
- `resend_message_id` TEXT NULL
- `status` TEXT CHECK in (`queued`,`sent`,`delivered`,`bounced`,`complained`,`failed`)
- `error_message` TEXT NULL
- `sent_at` TIMESTAMPTZ NULL
- `delivered_at` TIMESTAMPTZ NULL
- `created_at`

### 2.4 `receipt_qr_tokens`
Token pro QR ověření.
- `id` UUID PK
- `receipt_id` UUID FK -> `payment_receipts`
- `token` TEXT UNIQUE (random 32–64 chars)
- `expires_at` TIMESTAMPTZ NULL (nebo NULL = bez expirace)
- `created_at`

### 2.5 `receipt_events`
Auditní stopa (neměnitelný log).
- `id` UUID PK
- `receipt_id` UUID FK -> `payment_receipts`
- `event_type` TEXT (`created`,`issued`,`email_sent`,`email_delivered`,`voided`,`reissued`)
- `payload` JSONB NULL
- `created_at`
- `created_by`

---

## 3) Generování PDF

### 3.1 Nástroj
- Doporučení: **PDFKit** nebo **@react-pdf/renderer** (server‑side).
- Skladování v Supabase Storage: `documents/receipt/{receipt_id}/v{version}/confirmation.pdf`

### 3.2 Obsah PDF (minimální náležitosti)
- Identifikace pronajímatele (IČ, DIČ, adresa)
- Identifikace nájemníka
- Číslo potvrzení
- Číslo smlouvy / reference
- Datum vystavení
- Období, kterého se platba týká
- Částka a měna
- Způsob úhrady (bankovní převod / hotově)
- Variabilní symbol / reference platby
- QR ověřovací kód + URL
- Podpis (volitelně: digitální nebo jméno osoby)

### 3.3 Integrita
- Výpočet **SHA‑256** PDF a uložení do `payment_receipts.pdf_sha256`.
- Možnost pozdější kontroly integrity (sha256 souhlasí s uloženým PDF).

---

## 4) E‑mail šablony (Resend)

### 4.1 Varianta šablon
- HTML + textová verze.
- Šablony v `app/lib/email/templates/` (např. `receipt-confirmation.tsx`).

### 4.2 Obsah e‑mailu
- Předmět: `Potvrzení o úhradě nájemného {receipt_number}`
- Oslovení
- Rekapitulace částky, období, datum vystavení
- Tlačítko na ověření (QR URL)
- Příloha PDF

---

## 5) QR ověření

### 5.1 URL ověření
- `https://app.example.cz/verify/receipt/{token}`

### 5.2 Stránka ověření
- Veřejný režim (bez přihlášení).
- Zobrazí: číslo potvrzení, částku, období, datum, status, hash.
- Kontrola, že PDF hash odpovídá.

### 5.3 QR kód
- Generovat QR pro ověřovací URL.
- Ukládat QR kód jako PNG (volitelně do attachments).

---

## 6) Číslování potvrzení

### 6.1 Algoritmus
- Při vystavení: transakčně navýšit `receipt_number_counters.last_number`.
- Vygenerovat číslo ve formátu:
  - `YYYY-000001-LLD01` (rok, pořadí, prefix)

### 6.2 Zásady
- Číslování nesmí mít mezery.
- Pokud je potvrzení stornované (`voided`), číslo se **nepřiděluje znovu**.

---

## 7) Workflow

1. Platba je označena jako uhrazená.
2. Uživatel zvolí „Vystavit potvrzení“.
3. Vytvoří se `payment_receipts` (status `issued`).
4. Vygeneruje se PDF + uloží `pdf_sha256`.
5. Vygeneruje se QR token.
6. Odeslání e‑mailu přes Resend.
7. Zápis do logů + audit eventy.

---

## 8) API + služby

### 8.1 Service layer
- `app/lib/services/receipts.ts`:
  - `createReceiptForPayment(paymentId)`
  - `generateReceiptPdf(receiptId)`
  - `sendReceiptEmail(receiptId)`
  - `verifyReceiptToken(token)`

### 8.2 API Routes
- `app/api/receipts/issue` (POST)
- `app/api/receipts/send` (POST)
- `app/api/receipts/verify/[token]` (GET)

---

## 9) RLS
- `payment_receipts`: čtení jen pro příslušného pronajímatele/tenant.
- `receipt_email_log`: pouze role pronajímatele.
- `receipt_qr_tokens`: čtení pouze přes server API (veřejná stránka přes API).

---

## 10) Resend nastavení

### .env
```
RESEND_API_KEY=...
RESEND_FROM_EMAIL=potvrzeni@domena.cz
```

### Webhooky
- `delivered`, `bounced`, `complained` → aktualizace `receipt_email_log`.

---

## 11) Doporučené kroky implementace
1. Migrace DB + RLS
2. Service layer
3. PDF generátor + hash
4. QR token + ověřovací stránka
5. E‑mail šablony + Resend
6. UI tlačítko „Vystavit potvrzení“
7. Dokumentace + testy

---

## 12) Co je potřeba doplnit
- Formát čísla potvrzení (prefix, rok, pořadí)
- Přesné texty v PDF (právní náležitosti)
- Přesný obsah e‑mailu
- Podpis (digitální/scan)

