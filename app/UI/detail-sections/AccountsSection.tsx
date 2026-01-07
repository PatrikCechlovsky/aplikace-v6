// FILE: app/UI/detail-sections/AccountsSection.tsx
// PURPOSE: Sekce pro zobrazení a správu bankovních účtů

'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { listBankAccounts, listBanks, saveBankAccount, type BankAccountWithBank, type SaveBankAccountInput } from '@/app/lib/services/bankAccounts'
import { useToast } from '@/app/UI/Toast'
import createLogger from '@/app/lib/logger'
const logger = createLogger('AccountsSection')

type Props = {
  subjectId: string
  mode?: 'view' | 'edit'
}

type AccountFormValue = {
  label: string
  accountNumber: string
  bankId: string
  iban: string
  swift: string
  note: string
  isArchived: boolean
}

export default function AccountsSection({ subjectId }: Props) {
  const toast = useToast()
  const [accounts, setAccounts] = useState<BankAccountWithBank[]>([])
  const [loading, setLoading] = useState(true)
  const [banks, setBanks] = useState<Array<{ id: string; bank_code: string; bank_name: string; swift: string | null }>>([])
  const [loadingBanks, setLoadingBanks] = useState(true)

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [formValue, setFormValue] = useState<AccountFormValue>({
    label: '',
    accountNumber: '',
    bankId: '',
    iban: '',
    swift: '',
    note: '',
    isArchived: false,
  })
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const currentIndexRef = useRef<number>(-1)

  // Načíst účty
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await listBankAccounts(subjectId)
        if (cancelled) return
        setAccounts(data)
      } catch (e: any) {
        if (cancelled) return
        logger.error('listBankAccounts failed', e)
        toast.showError(e?.message ?? 'Chyba při načítání účtů')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [subjectId, toast])

  // Načíst banky
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoadingBanks(true)
        const data = await listBanks()
        if (cancelled) return
        setBanks(data)
      } catch (e: any) {
        if (cancelled) return
        logger.error('listBanks failed', e)
        toast.showError(e?.message ?? 'Chyba při načítání bank')
      } finally {
        if (!cancelled) setLoadingBanks(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // Vybrat účet
  const selectAccount = useCallback(
    (accountId: string | null) => {
      setSelectedAccountId(accountId)
      currentIndexRef.current = accountId ? accounts.findIndex((a) => a.id === accountId) : -1

      if (accountId) {
        const account = accounts.find((a) => a.id === accountId)
        if (account) {
          setFormValue({
            label: account.label ?? '',
            accountNumber: account.account_number ?? '',
            bankId: account.bank_id ?? '',
            iban: account.iban ?? '',
            swift: account.swift ?? '',
            note: account.note ?? '',
            isArchived: account.is_archived ?? false,
          })
          setIsDirty(false)
        }
      } else {
        setFormValue({
          label: '',
          accountNumber: '',
          bankId: '',
          iban: '',
          swift: '',
          note: '',
          isArchived: false,
        })
        setIsDirty(false)
      }
    },
    [accounts]
  )

  // Nový účet
  const handleAdd = useCallback(() => {
    setSelectedAccountId(null)
    currentIndexRef.current = -1
    setFormValue({
      label: '',
      accountNumber: '',
      bankId: '',
      iban: '',
      swift: '',
      note: '',
      isArchived: false,
    })
    setIsDirty(false)
  }, [])

  // Předchozí/Další
  const handlePrevious = useCallback(() => {
    if (currentIndexRef.current > 0) {
      const prevAccount = accounts[currentIndexRef.current - 1]
      selectAccount(prevAccount.id)
    }
  }, [accounts, selectAccount])

  const handleNext = useCallback(() => {
    if (currentIndexRef.current < accounts.length - 1) {
      const nextAccount = accounts[currentIndexRef.current + 1]
      selectAccount(nextAccount.id)
    }
  }, [accounts, selectAccount])

  // Uložit
  const handleSave = useCallback(async () => {
    try {
      // Validace povinných polí
      if (!formValue.label?.trim()) {
        toast.showWarning('Název účtu je povinný.')
        return
      }

      if (!formValue.accountNumber?.trim()) {
        toast.showWarning('Číslo účtu je povinné.')
        return
      }

      if (!formValue.bankId?.trim()) {
        toast.showWarning('Banka je povinná.')
        return
      }

      setSaving(true)

      const payload: SaveBankAccountInput = {
        id: selectedAccountId || undefined,
        subjectId,
        label: formValue.label,
        bankId: formValue.bankId || undefined,
        accountNumber: formValue.accountNumber,
        iban: formValue.iban || undefined,
        swift: formValue.swift || undefined,
        note: formValue.note || undefined,
        isArchived: formValue.isArchived,
      }

      await saveBankAccount(payload)

      // Obnovit seznam
      const refreshed = await listBankAccounts(subjectId)
      setAccounts(refreshed)

      // Pokud byl nový účet, vybrat ho
      if (!selectedAccountId && refreshed.length > 0) {
        selectAccount(refreshed[refreshed.length - 1].id)
      }

      setIsDirty(false)
      toast.showSuccess('Účet uložen')
    } catch (e: any) {
      logger.error('saveBankAccount failed', e)
      toast.showError(e?.message ?? 'Chyba při ukládání účtu')
    } finally {
      setSaving(false)
    }
  }, [selectedAccountId, subjectId, formValue, selectAccount, toast])

  const canGoPrevious = currentIndexRef.current > 0
  const canGoNext = currentIndexRef.current >= 0 && currentIndexRef.current < accounts.length - 1

  return (
    <div className="detail-form">
      {/* Seznam účtů */}
      <section className="detail-form__section">
        <h3 className="detail-form__section-title">Seznam účtů</h3>

        {loading && <div className="detail-form__hint">Načítám účty…</div>}

        {!loading && accounts.length === 0 && <div className="detail-form__hint">Zatím žádné účty.</div>}

        {!loading && accounts.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Název</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Číslo účtu</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Číslo banky</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Název banky</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>IBAN</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>SWIFT</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Poznámka</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Archivováno</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    onClick={() => selectAccount(account.id)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border-soft)',
                      backgroundColor: selectedAccountId === account.id ? 'var(--color-primary-soft)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '8px' }}>{account.label || '—'}</td>
                    <td style={{ padding: '8px' }}>{account.account_number || '—'}</td>
                    <td style={{ padding: '8px' }}>{account.bank_code || '—'}</td>
                    <td style={{ padding: '8px' }}>{account.bank_name || '—'}</td>
                    <td style={{ padding: '8px' }}>{account.iban || '—'}</td>
                    <td style={{ padding: '8px' }}>{account.swift || '—'}</td>
                    <td style={{ padding: '8px' }}>{account.note || '—'}</td>
                    <td style={{ padding: '8px' }}>{account.is_archived ? 'Ano' : 'Ne'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Formulář */}
      <section className="detail-form__section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="detail-form__section-title">Formulář</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                cursor: canGoPrevious ? 'pointer' : 'not-allowed',
                opacity: canGoPrevious ? 1 : 0.5,
              }}
            >
              Předchozí
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                cursor: canGoNext ? 'pointer' : 'not-allowed',
                opacity: canGoNext ? 1 : 0.5,
              }}
            >
              Další
            </button>
            <button
              type="button"
              onClick={handleAdd}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                cursor: 'pointer',
              }}
            >
              Přidat
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--color-primary)',
                borderRadius: '8px',
                background: 'var(--color-primary)',
                color: 'white',
                cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
                opacity: saving || !isDirty ? 0.5 : 1,
              }}
            >
              {saving ? 'Ukládám…' : 'Uložit'}
            </button>
          </div>
        </div>

        <div className="detail-form__grid detail-form__grid--narrow">
          {/* Řádek 1: Název účtu + Archivováno */}
          <div className="detail-form__field">
            <label className="detail-form__label">
              Název účtu <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={100}
              value={formValue.label}
              onChange={(e) => {
                setFormValue((prev) => ({ ...prev, label: e.target.value }))
                setIsDirty(true)
              }}
            />
          </div>
          <div className="detail-form__field">
            <label className="detail-form__label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={formValue.isArchived}
                onChange={(e) => {
                  setFormValue((prev) => ({ ...prev, isArchived: e.target.checked }))
                  setIsDirty(true)
                }}
              />
              Archivováno
            </label>
          </div>

          {/* Řádek 2: Číslo účtu + Kód banky */}
          <div className="detail-form__field">
            <label className="detail-form__label">
              Číslo účtu <span className="detail-form__required">*</span>
            </label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={50}
              value={formValue.accountNumber}
              onChange={(e) => {
                setFormValue((prev) => ({ ...prev, accountNumber: e.target.value }))
                setIsDirty(true)
              }}
            />
          </div>
          <div className="detail-form__field">
            <label className="detail-form__label">
              Kód banky <span className="detail-form__required">*</span>
            </label>
            <select
              className="detail-form__input"
              value={formValue.bankId}
              disabled={loadingBanks}
              onChange={(e) => {
                setFormValue((prev) => ({ ...prev, bankId: e.target.value }))
                setIsDirty(true)
              }}
            >
              <option value="">{loadingBanks ? 'Načítám…' : '— vyber banku —'}</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bank_code} - {bank.bank_name}
                </option>
              ))}
            </select>
          </div>

          {/* Řádek 3: IBAN + SWIFT */}
          <div className="detail-form__field">
            <label className="detail-form__label">IBAN</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={34}
              value={formValue.iban}
              onChange={(e) => {
                setFormValue((prev) => ({ ...prev, iban: e.target.value }))
                setIsDirty(true)
              }}
            />
          </div>
          <div className="detail-form__field">
            <label className="detail-form__label">SWIFT</label>
            <input
              className="detail-form__input"
              type="text"
              maxLength={11}
              value={formValue.swift}
              onChange={(e) => {
                setFormValue((prev) => ({ ...prev, swift: e.target.value }))
                setIsDirty(true)
              }}
            />
          </div>

          {/* Poznámka */}
          <div className="detail-form__field detail-form__field--span-2">
            <label className="detail-form__label">Poznámka</label>
            <textarea
              className="detail-form__input"
              maxLength={255}
              value={formValue.note}
              onChange={(e) => {
                setFormValue((prev) => ({ ...prev, note: e.target.value }))
                setIsDirty(true)
              }}
              rows={3}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

