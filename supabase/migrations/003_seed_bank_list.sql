-- Migration: Seed bank_list with Czech banks
-- Purpose: Naplnění číselníku bank základními českými bankami
-- Created: 2026-01-06

-- Vložení základních českých bank
INSERT INTO public.bank_list (bank_code, bank_name, swift) VALUES
  ('0100', 'Komerční banka, a.s.', 'KOMBCZPPXXX'),
  ('0300', 'Československá obchodní banka, a.s.', 'CEKOCZPPXXX'),
  ('0600', 'MONETA Money Bank, a.s.', 'AGBACZPX'),
  ('0800', 'Česká spořitelna, a.s.', 'GIBACZPX'),
  ('2010', 'Fio banka, a.s.', 'FIOBCZPPXXX'),
  ('2020', 'mBank S.A., organizační složka', 'BREXCZPPXXX'),
  ('2060', 'Citfin, spořitelní družstvo', 'CITFCZPP'),
  ('2070', 'TRINITY BANK a.s.', 'TBNKCZPP'),
  ('2220', 'Artesa, spořitelní družstvo', 'ARTECZPP'),
  ('2240', 'Poštovní spořitelna, a.s.', 'POBNCZPP'),
  ('2250', 'Bank of China (Czech) a.s.', 'BKCHCZPP'),
  ('2600', 'Citibank Europe plc, organizační složka', 'CITICZPX'),
  ('2700', 'UniCredit Bank Czech Republic and Slovakia, a.s.', 'BACXCZPP'),
  ('3030', 'Air Bank a.s.', 'AIRACZPP'),
  ('3050', 'BNP Paribas Personal Finance SA, odštěpný závod', 'BNPACZPP'),
  ('3060', 'PKO BP S.A., organizační složka', 'BPKOCZPP'),
  ('3500', 'ING Bank N.V.', 'INGBCZPP'),
  ('4000', 'Expobank CZ a.s.', 'EXPNCZPP'),
  ('4300', 'Českomoravská záruční a rozvojová banka, a.s.', 'CMZRCZP1'),
  ('5500', 'Raiffeisenbank a.s.', 'RZBCCZPP'),
  ('5800', 'J & T BANKA, a.s.', 'JTBPCZPP'),
  ('6000', 'PPF banka a.s.', 'PMBPCZPP'),
  ('6100', 'Equa bank a.s.', 'EQBKCZPP'),
  ('6200', 'COMMERZBANK Aktiengesellschaft, pobočka Praha', 'COBACZPX'),
  ('6210', 'Moravský peněžní ústav – spořitelní družstvo', 'MPUECZPP'),
  ('6300', 'Hypoteční banka, a.s.', 'HYBACZPP'),
  ('6700', 'Všeobecná úverová banka a.s., pobočka Česká republika', 'SUBACZPP'),
  ('6800', 'Sberbank CZ, a.s.', 'VBOECZ2X'),
  ('7910', 'Česká národní banka', 'CNBACZPP'),
  ('8030', 'Volksbank CZ a.s.', 'VBOECZ2X'),
  ('8040', 'Oberbank AG pobočka Česká republika', 'OBKLCZ2X'),
  ('8060', 'Stavební spořitelna České spořitelny, a.s.', 'GIBACZPX'),
  ('8090', 'Česká exportní banka, a.s.', 'CEKOCZPP'),
  ('8150', 'HSBC Bank plc - pobočka Praha', 'MIDLCZPX'),
  ('8200', 'Raiffeisen stavební spořitelna a.s.', 'RZBCCZPP'),
  ('8220', 'Modrá pyramida stavební spořitelna, a.s.', 'MPUECZPP'),
  ('8230', 'Wüstenrot - stavební spořitelna a.s.', 'WUSTCZPP'),
  ('8240', 'Českomoravská stavební spořitelna, a.s.', 'CMZRCZP1')
ON CONFLICT (bank_code) DO NOTHING;

