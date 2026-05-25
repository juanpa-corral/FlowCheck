import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useAccounts, ACCOUNT_DEFAULTS, type Account, type AccountType, type AccountInput } from '../../hooks/useAccounts'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState'
import { Colors, Radius, Font } from '../../constants/theme'
import { parseAmount } from '../../utils/formatters'

// ── Helpers ───────────────────────────────────────────────────

function formatCOP(v: number) {
  return `$${Math.abs(v).toLocaleString('es-CO')}`
}

// ── Tipos locales ─────────────────────────────────────────────

type ModalMode = 'create' | 'edit' | 'balance' | null

interface FormState {
  name:         string
  type:         AccountType
  balance:      string
  credit_limit: string
  icon:         string
  color:        string
}

const DEFAULT_FORM: FormState = {
  name:         '',
  type:         'banco',
  balance:      '',
  credit_limit: '',
  icon:         '🏦',
  color:        '#157A5A',
}

const TYPE_OPTIONS: { value: AccountType; label: string; emoji: string; desc: string }[] = [
  { value: 'efectivo',        label: 'Efectivo',          emoji: '💵', desc: 'Dinero en físico' },
  { value: 'banco',           label: 'Cuenta Bancaria',   emoji: '🏦', desc: 'Nequi, Bancolombia, Daviplata…' },
  { value: 'tarjeta_credito', label: 'Tarjeta de Crédito',emoji: '💳', desc: 'Saldo pendiente = deuda' },
]

// ── Tarjeta de cuenta ─────────────────────────────────────────

function AccountCard({
  account,
  onEdit,
  onUpdateBalance,
  onDelete,
}: {
  account: Account
  onEdit:          (a: Account) => void
  onUpdateBalance: (a: Account) => void
  onDelete:        (id: string)  => void
}) {
  const isCredit = account.type === 'tarjeta_credito'
  const cardColor = isCredit ? Colors.red : Colors.primary
  const utilPct   = isCredit && account.credit_limit
    ? (account.balance / account.credit_limit) * 100
    : 0

  return (
    <div
      style={{
        backgroundColor: Colors.card,
        borderRadius: Radius.card,
        border: `1.5px solid ${isCredit ? Colors.redA30 : Colors.border}`,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header colorido */}
      <div
        style={{
          background: isCredit
            ? `linear-gradient(135deg, ${Colors.redDark} 0%, ${Colors.red} 100%)`
            : `linear-gradient(135deg, ${Colors.primaryDark} 0%, ${Colors.primary} 100%)`,
          padding: '16px 16px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>{account.icon}</span>
            <span style={{ fontSize: 13, fontWeight: Font.weightBold, color: 'rgba(255,255,255,0.9)' }}>
              {account.name}
            </span>
            {isCredit && (
              <span
                style={{
                  fontSize: 9, fontWeight: Font.weightBold,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  color: Colors.white, borderRadius: 4,
                  padding: '1px 5px', textTransform: 'uppercase',
                }}
              >
                DEUDA
              </span>
            )}
          </div>
          <p style={{ fontSize: 26, fontWeight: Font.weightBlack, color: Colors.white, margin: 0 }}>
            {isCredit ? '- ' : ''}{formatCOP(account.balance)}
          </p>
          {isCredit && account.credit_limit && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>
              Límite: {formatCOP(account.credit_limit)}
            </p>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {TYPE_OPTIONS.find((t) => t.value === account.type)?.label}
        </span>
      </div>

      {/* Barra de utilización para tarjeta */}
      {isCredit && account.credit_limit && (
        <div style={{ padding: '10px 16px 0', backgroundColor: Colors.card }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: Colors.textMuted }}>Utilización del crédito</span>
            <span
              style={{
                fontSize: 11, fontWeight: Font.weightBold,
                color: utilPct > 70 ? Colors.red : utilPct > 30 ? Colors.yellow : Colors.green,
              }}
            >
              {utilPct.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, utilPct)}%`,
                backgroundColor: utilPct > 70 ? Colors.red : utilPct > 30 ? Colors.yellow : Colors.green,
                borderRadius: 3,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          {utilPct > 30 && (
            <p style={{ fontSize: 11, color: utilPct > 70 ? Colors.red : Colors.yellow, margin: '4px 0 0', fontWeight: Font.weightBold }}>
              {utilPct > 70
                ? '⚠️ Utilización crítica — impacta tu salud crediticia'
                : '💡 Mantener bajo el 30% mejora tu score'}
            </p>
          )}
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', borderTop: `1px solid ${Colors.border}`, marginTop: 10 }}>
        <button
          onClick={() => onUpdateBalance(account)}
          style={{
            flex: 1, padding: '10px 0',
            border: 'none', backgroundColor: 'transparent',
            color: Colors.primary, fontSize: 13, fontWeight: Font.weightBold,
            cursor: 'pointer', fontFamily: Font.family,
          }}
        >
          💰 Actualizar saldo
        </button>
        <div style={{ width: 1, backgroundColor: Colors.border }} />
        <button
          onClick={() => onEdit(account)}
          style={{
            flex: 1, padding: '10px 0',
            border: 'none', backgroundColor: 'transparent',
            color: Colors.textSecondary, fontSize: 13,
            cursor: 'pointer', fontFamily: Font.family,
          }}
        >
          ✏️ Editar
        </button>
        <div style={{ width: 1, backgroundColor: Colors.border }} />
        <button
          onClick={() => {
            if (window.confirm(`¿Eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`)) {
              onDelete(account.id)
            }
          }}
          style={{
            flex: 1, padding: '10px 0',
            border: 'none', backgroundColor: 'transparent',
            color: Colors.red, fontSize: 13,
            cursor: 'pointer', fontFamily: Font.family,
          }}
        >
          🗑️ Borrar
        </button>
      </div>
    </div>
  )
}

// ── Modal: crear / editar cuenta ──────────────────────────────

function AccountModal({
  mode,
  account,
  onClose,
  onSave,
}: {
  mode:    'create' | 'edit'
  account: Account | null
  onClose: () => void
  onSave:  (form: FormState) => Promise<void>
}) {
  const [form, setForm] = useState<FormState>(
    account
      ? {
          name:         account.name,
          type:         account.type,
          balance:      String(account.balance),
          credit_limit: account.credit_limit ? String(account.credit_limit) : '',
          icon:         account.icon,
          color:        account.color,
        }
      : DEFAULT_FORM,
  )
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState<string | null>(null)

  const handleTypeChange = (t: AccountType) => {
    const def = ACCOUNT_DEFAULTS[t]
    setForm((f) => ({ ...f, type: t, icon: def.icon, color: def.color }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim())      { setErr('Ingresa un nombre para la cuenta.'); return }
    if (!parseAmount(form.balance) && parseAmount(form.balance) !== 0)
                                 { setErr('Ingresa un saldo válido (puede ser 0).'); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          backgroundColor: Colors.card,
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 40px',
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, margin: '0 auto 18px' }} />

        <p style={{ fontSize: 18, fontWeight: Font.weightBlack, color: Colors.textPrimary, margin: '0 0 20px' }}>
          {mode === 'create' ? '➕ Nueva cuenta' : '✏️ Editar cuenta'}
        </p>

        {/* Tipo de cuenta */}
        <label style={{ fontSize: 13, fontWeight: Font.weightBold, color: Colors.textPrimary, display: 'block', marginBottom: 8 }}>
          Tipo de cuenta *
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTypeChange(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderRadius: Radius.input,
                border: `1.5px solid ${form.type === opt.value ? Colors.primary : Colors.border}`,
                backgroundColor: form.type === opt.value ? Colors.primaryLight : Colors.card,
                cursor: 'pointer', textAlign: 'left', fontFamily: Font.family,
              }}
            >
              <span style={{ fontSize: 20 }}>{opt.emoji}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: Font.weightBold, color: Colors.textPrimary, margin: 0 }}>{opt.label}</p>
                <p style={{ fontSize: 12, color: Colors.textMuted, margin: 0 }}>{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Aviso tarjeta de crédito */}
        {form.type === 'tarjeta_credito' && (
          <div style={{ backgroundColor: Colors.redLight, borderRadius: 10, padding: 12, marginBottom: 16, border: `1px solid ${Colors.redA30}` }}>
            <p style={{ fontSize: 12, color: Colors.redDark, margin: 0, lineHeight: '17px', fontWeight: Font.weightBold }}>
              💳 El saldo de tarjeta de crédito representa una <strong>deuda</strong> y se resta de tu patrimonio neto.
              La utilización {'>'}30% afecta tu score crediticio simulado.
            </p>
          </div>
        )}

        {/* Nombre */}
        <label style={{ fontSize: 13, fontWeight: Font.weightBold, color: Colors.textPrimary, display: 'block', marginBottom: 6 }}>
          Nombre *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder={form.type === 'banco' ? 'Ej: Nequi, Bancolombia' : form.type === 'tarjeta_credito' ? 'Ej: Visa Bancolombia' : 'Ej: Billetera'}
          style={{
            width: '100%', height: 48,
            border: `1.5px solid ${Colors.border}`,
            borderRadius: Radius.input, padding: '0 14px',
            fontSize: 15, fontFamily: Font.family, color: Colors.textPrimary,
            backgroundColor: Colors.card, outline: 'none', boxSizing: 'border-box',
            marginBottom: 16,
          }}
        />

        {/* Saldo */}
        <label style={{ fontSize: 13, fontWeight: Font.weightBold, color: Colors.textPrimary, display: 'block', marginBottom: 6 }}>
          {form.type === 'tarjeta_credito' ? 'Saldo pendiente (deuda actual) *' : 'Saldo actual *'}
        </label>
        <div
          style={{
            display: 'flex', alignItems: 'center',
            border: `1.5px solid ${Colors.border}`,
            borderRadius: Radius.input, padding: '0 14px',
            height: 48, gap: 6, marginBottom: 16, backgroundColor: Colors.card,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: Font.weightBold, color: Colors.primary }}>$</span>
          <input
            type="text" inputMode="numeric"
            value={form.balance}
            onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value.replace(/[^0-9.]/g, '') }))}
            placeholder="0"
            style={{ flex: 1, fontSize: 18, fontWeight: Font.weightBold, border: 'none', outline: 'none', backgroundColor: 'transparent', color: Colors.textPrimary, fontFamily: Font.family }}
          />
        </div>

        {/* Límite de crédito */}
        {form.type === 'tarjeta_credito' && (
          <>
            <label style={{ fontSize: 13, fontWeight: Font.weightBold, color: Colors.textPrimary, display: 'block', marginBottom: 6 }}>
              Límite de crédito (opcional)
            </label>
            <div
              style={{
                display: 'flex', alignItems: 'center',
                border: `1.5px solid ${Colors.border}`,
                borderRadius: Radius.input, padding: '0 14px',
                height: 48, gap: 6, marginBottom: 16, backgroundColor: Colors.card,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: Font.weightBold, color: Colors.red }}>$</span>
              <input
                type="text" inputMode="numeric"
                value={form.credit_limit}
                onChange={(e) => setForm((f) => ({ ...f, credit_limit: e.target.value.replace(/[^0-9.]/g, '') }))}
                placeholder="0"
                style={{ flex: 1, fontSize: 18, fontWeight: Font.weightBold, border: 'none', outline: 'none', backgroundColor: 'transparent', color: Colors.textPrimary, fontFamily: Font.family }}
              />
            </div>
          </>
        )}

        {err && (
          <p style={{ fontSize: 13, color: Colors.red, marginBottom: 12, backgroundColor: Colors.redLight, padding: '8px 12px', borderRadius: 8 }}>
            {err}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: '100%', height: 52,
            backgroundColor: saving ? Colors.border : Colors.primary,
            color: saving ? Colors.textMuted : Colors.white,
            borderRadius: Radius.button, border: 'none',
            fontSize: 15, fontWeight: Font.weightBold,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: Font.family, marginBottom: 10,
          }}
        >
          {saving ? '⏳ Guardando…' : mode === 'create' ? '✅ Crear cuenta' : '✅ Guardar cambios'}
        </button>
        <button
          onClick={onClose}
          style={{ width: '100%', border: 'none', backgroundColor: 'transparent', color: Colors.textMuted, fontSize: 14, cursor: 'pointer', fontFamily: Font.family }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Modal: actualizar saldo ───────────────────────────────────

function BalanceModal({
  account,
  onClose,
  onSave,
}: {
  account: Account
  onClose: () => void
  onSave:  (newBalance: number) => Promise<void>
}) {
  const [newBal, setNewBal] = useState(String(account.balance))
  const [saving, setSaving] = useState(false)
  const isCredit = account.type === 'tarjeta_credito'

  const handleSave = async () => {
    const parsed = parseAmount(newBal)
    if (parsed < 0) return
    setSaving(true)
    await onSave(parsed)
    setSaving(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: Colors.card, borderRadius: Radius.card, padding: 24, width: '100%', maxWidth: 360 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: 18, fontWeight: Font.weightBlack, color: Colors.textPrimary, margin: '0 0 4px' }}>
          {account.icon} {account.name}
        </p>
        <p style={{ fontSize: 13, color: Colors.textMuted, margin: '0 0 20px' }}>
          {isCredit ? 'Nuevo saldo pendiente (deuda)' : 'Nuevo saldo de la cuenta'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${Colors.primary}`, borderRadius: Radius.input, padding: '0 14px', height: 56, gap: 6, marginBottom: 20 }}>
          <span style={{ fontSize: 22, fontWeight: Font.weightBold, color: isCredit ? Colors.red : Colors.primary }}>$</span>
          <input
            type="text" inputMode="numeric"
            value={newBal}
            onChange={(e) => setNewBal(e.target.value.replace(/[^0-9.]/g, ''))}
            autoFocus
            style={{ flex: 1, fontSize: 22, fontWeight: Font.weightBold, border: 'none', outline: 'none', backgroundColor: 'transparent', color: Colors.textPrimary, fontFamily: Font.family }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', height: 52, backgroundColor: Colors.primary, color: Colors.white, borderRadius: Radius.button, border: 'none', fontSize: 15, fontWeight: Font.weightBold, cursor: 'pointer', fontFamily: Font.family, marginBottom: 10 }}
        >
          {saving ? '⏳…' : '✅ Actualizar saldo'}
        </button>
        <button onClick={onClose} style={{ width: '100%', border: 'none', backgroundColor: 'transparent', color: Colors.textMuted, fontSize: 14, cursor: 'pointer', fontFamily: Font.family }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function CuentasPage() {
  const navigate    = useNavigate()
  const { session } = useAuthStore()
  const {
    accounts, loading, error,
    assets, creditDebt, netWorth, creditUtilization,
    createAccount, updateAccount, updateBalance, deleteAccount,
  } = useAccounts(session?.user?.id)

  const [modal,           setModal]           = useState<ModalMode>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [toast,           setToast]           = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const handleCreate = async (form: FormState) => {
    const input: AccountInput = {
      name:         form.name.trim(),
      type:         form.type,
      balance:      parseAmount(form.balance),
      credit_limit: form.type === 'tarjeta_credito' && form.credit_limit ? parseAmount(form.credit_limit) : null,
      icon:         form.icon,
      color:        form.color,
    }
    const { error: err } = await createAccount(input)
    if (!err) { setModal(null); showToast('✅ Cuenta creada con éxito') }
    else showToast(`❌ ${err}`)
  }

  const handleEdit = async (form: FormState) => {
    if (!selectedAccount) return
    const patch = {
      name:         form.name.trim(),
      type:         form.type,
      balance:      parseAmount(form.balance),
      credit_limit: form.type === 'tarjeta_credito' && form.credit_limit ? parseAmount(form.credit_limit) : null,
      icon:         form.icon,
      color:        form.color,
    }
    const { error: err } = await updateAccount(selectedAccount.id, patch)
    if (!err) { setModal(null); setSelectedAccount(null); showToast('✅ Cuenta actualizada') }
    else showToast(`❌ ${err}`)
  }

  const handleUpdateBalance = async (newBalance: number) => {
    if (!selectedAccount) return
    const { error: err } = await updateBalance(selectedAccount.id, newBalance)
    if (!err) { setModal(null); setSelectedAccount(null); showToast('✅ Saldo actualizado') }
    else showToast(`❌ ${err}`)
  }

  const handleDelete = async (id: string) => {
    const { error: err } = await deleteAccount(id)
    if (!err) showToast('🗑️ Cuenta eliminada')
    else showToast(`❌ ${err}`)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: Colors.background }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', backgroundColor: Colors.card, borderBottom: `1px solid ${Colors.border}` }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: Colors.textPrimary }}>←</button>
        <p style={{ fontSize: 18, fontWeight: Font.weightBlack, color: Colors.textPrimary, margin: 0, flex: 1 }}>Mis Cuentas 💼</p>
        <button
          onClick={() => { setSelectedAccount(null); setModal('create') }}
          style={{ height: 36, paddingLeft: 14, paddingRight: 14, backgroundColor: Colors.primary, color: Colors.white, borderRadius: Radius.button, border: 'none', fontSize: 13, fontWeight: Font.weightBold, cursor: 'pointer', fontFamily: Font.family }}
        >
          + Nueva
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Cargando tus cuentas…" />
      ) : (
        <div style={{ padding: '16px 16px 80px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Resumen patrimonial */}
          {accounts.length > 0 && (
            <div style={{ backgroundColor: Colors.card, borderRadius: Radius.card, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${Colors.border}` }}>
              <p style={{ fontSize: 12, color: Colors.textMuted, margin: '0 0 12px', fontWeight: Font.weightBold, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Resumen patrimonial
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Activos',    value: formatCOP(assets),    color: Colors.primary },
                  { label: 'Deudas TC',  value: `- ${formatCOP(creditDebt)}`, color: Colors.red },
                  { label: 'Neto',       value: formatCOP(netWorth),  color: netWorth >= 0 ? Colors.primary : Colors.red },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', backgroundColor: Colors.background, borderRadius: 10, padding: '8px 4px' }}>
                    <p style={{ fontSize: 13, fontWeight: Font.weightBold, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: Colors.textMuted, margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {creditUtilization > 30 && (
                <div style={{ marginTop: 12, backgroundColor: creditUtilization > 70 ? Colors.redLight : Colors.yellowLight, borderRadius: 8, padding: '8px 12px', border: `1px solid ${creditUtilization > 70 ? Colors.redA30 : Colors.yellowA40}` }}>
                  <p style={{ fontSize: 12, color: creditUtilization > 70 ? Colors.redDark : Colors.yellowDark, margin: 0, fontWeight: Font.weightBold }}>
                    {creditUtilization > 70
                      ? `⚠️ Utilización TC: ${creditUtilization.toFixed(0)}% — zona crítica para tu historial`
                      : `💡 Utilización TC: ${creditUtilization.toFixed(0)}% — idealmente < 30%`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Lista de cuentas */}
          {accounts.length === 0 ? (
            <EmptyState
              emoji="💼"
              title="Aún no tienes cuentas"
              subtitle="Agrega tu efectivo, cuentas bancarias o tarjetas para llevar un control de tu patrimonio."
              action={{ label: '+ Agregar primera cuenta', onClick: () => setModal('create') }}
            />
          ) : (
            accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                account={acc}
                onEdit={(a) => { setSelectedAccount(a); setModal('edit') }}
                onUpdateBalance={(a) => { setSelectedAccount(a); setModal('balance') }}
                onDelete={handleDelete}
              />
            ))
          )}

          {/* Info educativa tarjeta */}
          <div style={{ backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 14, border: `1px solid ${Colors.primaryA30}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: Font.weightBold, color: Colors.primaryDark, margin: '0 0 3px' }}>Mantén el control de tu crédito</p>
              <p style={{ fontSize: 12, color: Colors.textSecondary, margin: 0, lineHeight: '17px' }}>
                Una utilización de tarjeta de crédito menor al 30% es ideal para mantener un buen historial. Paga el total antes de la fecha de pago para no generar intereses.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Modales */}
      {(modal === 'create' || modal === 'edit') && (
        <AccountModal
          mode={modal}
          account={modal === 'edit' ? selectedAccount : null}
          onClose={() => { setModal(null); setSelectedAccount(null) }}
          onSave={modal === 'create' ? handleCreate : handleEdit}
        />
      )}

      {modal === 'balance' && selectedAccount && (
        <BalanceModal
          account={selectedAccount}
          onClose={() => { setModal(null); setSelectedAccount(null) }}
          onSave={handleUpdateBalance}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', backgroundColor: Colors.textPrimary, color: Colors.white, borderRadius: Radius.button, padding: '12px 20px', fontSize: 14, fontWeight: Font.weightBold, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 2000, whiteSpace: 'nowrap', animation: 'slideUp 0.3s ease' }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity:0; transform: translateX(-50%) translateY(12px) } to { opacity:1; transform: translateX(-50%) translateY(0) } }
      `}</style>
    </div>
  )
}
