-- FILE: supabase/migrations/098_update_bank_list_cnb_2026.sql
-- PURPOSE: Sync bank_list with official CNB code list (platné od 2026-02-01)
-- DATE: 2026-02-10

-- Zdroj: https://www.cnb.cz/cs/platebni-styk/.galleries/ucty_kody_bank/download/kody_bank_CR.csv

CREATE TEMP TABLE tmp_cnb_bank_list (
  bank_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  swift TEXT NULL
) ON COMMIT DROP;

INSERT INTO tmp_cnb_bank_list (bank_code, bank_name, swift) VALUES
  ('0100', 'Komerční banka, a.s.', 'KOMBCZPP'),
  ('0300', 'Československá obchodní banka, a. s.', 'CEKOCZPP'),
  ('0600', 'MONETA Money Bank, a.s.', 'AGBACZPP'),
  ('0710', 'ČESKÁ NÁRODNÍ BANKA', 'CNBACZPP'),
  ('0800', 'Česká spořitelna, a.s.', 'GIBACZPX'),
  ('2010', 'Fio banka, a.s.', 'FIOBCZPP'),
  ('2060', 'Citfin, spořitelní družstvo', 'CITFCZPP'),
  ('2070', 'TRINITY BANK a.s.', 'MPUBCZPP'),
  ('2100', 'ČSOB Hypoteční banka, a.s.', NULL),
  ('2200', 'Peněžní dům, spořitelní družstvo', NULL),
  ('2220', 'Artesa, spořitelní družstvo', 'ARTTCZPP'),
  ('2250', 'Banka CREDITAS a.s.', 'CTASCZ22'),
  ('2260', 'NEY spořitelní družstvo', NULL),
  ('2600', 'Citibank Europe plc, organizační složka', 'CITICZPX'),
  ('2700', 'UniCredit Bank Czech Republic and Slovakia, a.s.', 'BACXCZPP'),
  ('3030', 'Air Bank a.s.', 'AIRACZPP'),
  ('3060', 'PKO BP S.A., Czech Branch', 'BPKOCZPP'),
  ('3500', 'ING Bank N.V.', 'INGBCZPP'),
  ('4300', 'Národní rozvojová banka, a.s.', 'NROZCZPP'),
  ('5500', 'Raiffeisenbank a.s.', 'RZBCCZPP'),
  ('5800', 'J&T BANKA, a.s.', 'JTBPCZPP'),
  ('6000', 'PPF banka a.s.', 'PMBPCZPP'),
  ('6200', 'COMMERZBANK Aktiengesellschaft, pobočka Praha', 'COBACZPX'),
  ('6210', 'mBank S.A., organizační složka', 'BREXCZPP'),
  ('6300', 'BNP Paribas S.A., pobočka Česká republika', 'GEBACZPP'),
  ('6363', 'Partners Banka, a.s.', NULL),
  ('6600', 'Banking Circle S.A., Czech Republic', NULL),
  ('6700', 'Všeobecná úverová banka a.s., pobočka Praha', 'SUBACZPP'),
  ('6800', 'Sberbank CZ, a.s. v likvidaci', 'VBOECZ2X'),
  ('7910', 'Deutsche Bank Aktiengesellschaft Filiale Prag, organizační složka', 'DEUTCZPX'),
  ('7950', 'Raiffeisen stavební spořitelna a.s.', NULL),
  ('7960', 'ČSOB Stavební spořitelna, a.s.', NULL),
  ('7970', 'MONETA Stavební Spořitelna, a.s.', NULL),
  ('7990', 'Modrá pyramida stavební spořitelna, a.s.', NULL),
  ('8030', 'Volksbank Raiffeisenbank Nordoberpfalz eG pobočka Cheb', 'GENOCZ21'),
  ('8040', 'Oberbank AG pobočka Česká republika', 'OBKLCZ2X'),
  ('8060', 'Stavební spořitelna České spořitelny, a.s.', NULL),
  ('8090', 'Česká exportní banka, a.s.', 'CZEECZPP'),
  ('8150', 'HSBC Continental Europe, Czech Republic', 'MIDLCZPP'),
  ('8190', 'Sparkasse Oberlausitz-Niederschlesien', NULL),
  ('8198', 'FAS finance company s.r.o.', 'FFCSCZP1'),
  ('8220', 'Payment execution s.r.o.', 'PAERCZP1'),
  ('8250', 'Bank of China (CEE) Ltd. Prague Branch', 'BKCHCZPP'),
  ('8255', 'Bank of Communications Co., Ltd., Prague Branch odštěpný závod', 'COMMCZPP'),
  ('8265', 'Industrial and Commercial Bank of China Limited, Prague Branch, odštěpný závod', 'ICBKCZPP'),
  ('8500', 'Multitude Bank p.l.c.', NULL),
  ('8610', 'Devizová burza a.s.', NULL),
  ('8660', 'PAYMONT, UAB', NULL);

-- Update existujících záznamů
UPDATE public.bank_list bl
SET bank_name = cnb.bank_name,
    swift = cnb.swift,
    updated_at = now()
FROM tmp_cnb_bank_list cnb
WHERE bl.bank_code = cnb.bank_code;

-- Insert chybějících záznamů
INSERT INTO public.bank_list (bank_code, bank_name, swift)
SELECT cnb.bank_code, cnb.bank_name, cnb.swift
FROM tmp_cnb_bank_list cnb
LEFT JOIN public.bank_list bl ON bl.bank_code = cnb.bank_code
WHERE bl.bank_code IS NULL;

-- Smazat záznamy mimo oficiální seznam ČNB
DELETE FROM public.bank_list bl
WHERE NOT EXISTS (
  SELECT 1 FROM tmp_cnb_bank_list cnb
  WHERE cnb.bank_code = bl.bank_code
);

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 098 complete: bank_list synced with CNB list (2026-02-01).';
END $$;
