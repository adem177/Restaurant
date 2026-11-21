import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bag,
  CheckCircleFill,
  CreditCard,
  PersonFill,
  StarFill,
  TagFill,
  Truck,
  XCircleFill,
  XLg,
} from 'react-bootstrap-icons'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useClientAuth } from '../context/ClientAuthContext'
import { useLanguage } from '../context/LanguageContext'
import { localizedName } from '../utils/localize'
import OrderTracker from '../components/OrderTracker'

const REDEEM_STEP = 100 // points per block
const STEP_VALUE = 5 // DT per block
const CAP = 0.20 // max points discount vs subtotal

export default function Checkout() {
  const { t, lang } = useLanguage()
  const { items, total, clearCart } = useCart()
  const { user } = useClientAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Draft handed back by the login page so nothing typed is lost.
  const draft = location.state?.draft

  const [form, setForm] = useState(() => ({
    customer_name: draft?.form?.customer_name ?? user?.name ?? '',
    customer_phone: draft?.form?.customer_phone ?? user?.phone ?? '',
    customer_email: draft?.form?.customer_email ?? user?.email ?? '',
    type: draft?.form?.type ?? 'pickup',
    address: draft?.form?.address ?? '',
  }))

  const [loyalty, setLoyalty] = useState(null)
  const [usePoints, setUsePoints] = useState(!!draft?.usePoints)
  const [redeemPoints, setRedeemPoints] = useState(draft?.redeemPoints || 0)
  const [promoInput, setPromoInput] = useState(draft?.promoInput || '')
  const [appliedPromo, setAppliedPromo] = useState(draft?.appliedPromo || '')
  const [promoResult, setPromoResult] = useState(draft?.promoResult || null)
  const [promoBusy, setPromoBusy] = useState(false)
  const [promoError, setPromoError] = useState(null)

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (user) {
      api.get('/auth/loyalty').then((res) => setLoyalty(res.data)).catch(() => setLoyalty(null))
    } else {
      setLoyalty(null)
    }
  }, [user])

  const subtotal = total
  const balance = loyalty?.points || 0
  const maxByCap = Math.floor((subtotal * CAP) / STEP_VALUE) * REDEEM_STEP
  const maxRedeemable = Math.min(balance, maxByCap)
  const canRedeem = maxRedeemable >= REDEEM_STEP

  const itemsPayload = items.map((item) => ({
    product_id: item.id,
    quantity: item.quantity,
    // Option value ids the server re-validates and prices itself.
    options: (item.options || []).map((option) => option.id),
  }))

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const togglePoints = (checked) => {
    setUsePoints(checked)
    if (checked) {
      setAppliedPromo('')
      setPromoResult(null)
      setPromoError(null)
      setRedeemPoints(checked && canRedeem ? maxRedeemable : 0)
    } else {
      setRedeemPoints(0)
    }
  }

  const applyPromo = async () => {
    const code = promoInput.trim()
    if (!code) return
    setPromoBusy(true)
    setPromoError(null)
    try {
      const { data } = await api.post('/orders/preview', {
        items: itemsPayload,
        promo_code: code,
      })
      setAppliedPromo(code)
      setPromoResult(data)
      setUsePoints(false)
      setRedeemPoints(0)
    } catch (err) {
      const data = err.response?.data
      setPromoError(
        err.response?.status === 422
          ? Object.values(data?.errors || {}).flat().join(' ')
          : data?.message || 'Erreur',
      )
      setAppliedPromo('')
      setPromoResult(null)
    } finally {
      setPromoBusy(false)
    }
  }

  const clearPromo = () => {
    setPromoInput('')
    setAppliedPromo('')
    setPromoResult(null)
    setPromoError(null)
  }

  const pointsDiscount = usePoints ? (redeemPoints / REDEEM_STEP) * STEP_VALUE : 0
  const promoDiscount = !usePoints && promoResult ? promoResult.discount : 0
  const discount = usePoints ? pointsDiscount : promoDiscount
  const finalTotal = Math.max(0, subtotal - discount)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Guests must sign in first: keep everything they typed and come back here.
    if (!user) {
      navigate('/login', {
        state: {
          from: '/checkout',
          draft: {
            form,
            promoInput,
            appliedPromo,
            promoResult,
            usePoints,
            redeemPoints,
          },
        },
      })
      return
    }

    setSubmitting(true)
    setErrors({})

    try {
      const payload = {
        ...form,
        customer_email: form.customer_email || null,
        address: form.type === 'delivery' ? form.address : null,
        items: itemsPayload,
      }

      if (usePoints && redeemPoints > 0) {
        payload.redeem_points = redeemPoints
      } else if (appliedPromo) {
        payload.promo_code = appliedPromo
      }

      const { data } = await api.post('/orders', payload)
      setSuccess(data.data)
      clearCart()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <section className="mx-auto max-w-2xl px-6 pb-20 pt-32 text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircleFill className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="font-display mb-3 text-4xl font-bold italic text-ink">
          {t.checkout.success}
        </h1>
        <p className="mb-2 text-ink/60">{t.checkout.successNote}</p>
        <p className="mb-4 text-sm text-accent">
          {t.checkout.orderNumber}: <strong>#{success.id}</strong> — {success.total} DT
        </p>
        {parseFloat(success.points_earned) > 0 && (
          <p className="mb-4 flex items-center justify-center gap-1.5 text-sm text-amber-600">
            <StarFill className="h-4 w-4" /> +{success.points_earned} {t.checkout.pointsEarned}
          </p>
        )}
        <div className="mx-auto mb-6 max-w-sm text-start">
          <OrderTracker status={success.status} type={success.type} live />
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {user && (
            <Link
              to="/account"
              className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              {t.account.viewOrders}
            </Link>
          )}
          <Link
            to="/"
            className="inline-block rounded-lg border border-ink/20 px-6 py-3 text-sm font-medium text-ink/70 transition hover:border-accent hover:text-accent"
          >
            {t.checkout.backHome}
          </Link>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-6 pb-20 pt-32 text-center">
        <p className="mb-8 text-ink/50">{t.cart.empty}</p>
        <Link
          to="/menu"
          className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          {t.cart.continue}
        </Link>
      </section>
    )
  }

  const inputClass =
    'w-full rounded-lg border border-ink/20 bg-surface px-4 py-2.5 text-sm text-ink placeholder-ink/40 outline-none focus:border-accent'

  return (
    <section className="mx-auto max-w-2xl px-6 pb-20 pt-32">
      <h1 className="font-display mb-8 text-4xl font-bold italic text-ink">
        {t.checkout.title}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.items && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            <XCircleFill className="mt-0.5 h-4 w-4 shrink-0" />
            {errors.items[0]}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm text-ink/70">{t.checkout.name} *</label>
          <input name="customer_name" value={form.customer_name} onChange={handleChange} className={inputClass} required />
          {errors.customer_name && <p className="mt-1 text-xs text-red-600">{errors.customer_name[0]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm text-ink/70">{t.checkout.phone} *</label>
          <input name="customer_phone" value={form.customer_phone} onChange={handleChange} className={inputClass} required />
          {errors.customer_phone && <p className="mt-1 text-xs text-red-600">{errors.customer_phone[0]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm text-ink/70">{t.checkout.email}</label>
          <input name="customer_email" type="email" value={form.customer_email} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label className="mb-2 block text-sm text-ink/70">{t.checkout.type} *</label>
          <div className="grid grid-cols-2 gap-3">
            {['pickup', 'delivery'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, type })}
                className={`rounded-lg border px-4 py-3 text-sm transition ${
                  form.type === type
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-ink/20 text-ink/60 hover:border-ink/40'
                }`}
              >
                {type === 'pickup' ? (
                  <span className="inline-flex items-center gap-2">
                    <Bag className="h-4 w-4" /> {t.checkout.pickup}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Truck className="h-4 w-4" /> {t.checkout.delivery}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {form.type === 'delivery' && (
          <div>
            <label className="mb-1 block text-sm text-ink/70">{t.checkout.address} *</label>
            <input name="address" value={form.address} onChange={handleChange} className={inputClass} required={form.type === 'delivery'} />
            {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address[0]}</p>}
          </div>
        )}

        {/* Loyalty points */}
        {user && loyalty && balance > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
                <StarFill className="h-4 w-4" /> {loyalty.points} {t.checkout.pointsAvailable}
              </span>
              {appliedPromo && <span className="text-xs text-ink/50">{t.checkout.promoActive}</span>}
            </div>
            {canRedeem ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/70">
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(e) => togglePoints(e.target.checked)}
                  disabled={!!appliedPromo}
                  className="accent-accent"
                />
                {t.checkout.usePoints} ({REDEEM_STEP} {t.checkout.points} = {STEP_VALUE} DT)
              </label>
            ) : (
              <p className="text-xs text-ink/50">{t.checkout.notEnough}</p>
            )}
            {usePoints && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  step={REDEEM_STEP}
                  min={REDEEM_STEP}
                  max={maxRedeemable}
                  value={redeemPoints}
                  onChange={(e) => {
                    const v = parseInt(e.target.value || '0', 10)
                    setRedeemPoints(Math.max(0, Math.min(maxRedeemable, v)))
                  }}
                  className={`${inputClass} w-32`}
                />
                <span className="text-sm text-accent">− {pointsDiscount.toFixed(2)} DT</span>
              </div>
            )}
            {errors.redeem_points && <p className="mt-2 text-xs text-red-600">{errors.redeem_points[0]}</p>}
          </div>
        )}

        {/* Promo code */}
        <div className="rounded-xl border border-ink/15 bg-surface p-4">
          <label className="mb-2 block text-sm text-ink/70">{t.checkout.promoLabel}</label>
          {appliedPromo ? (
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-sm font-medium text-accent">
                <TagFill className="h-3.5 w-3.5" /> {appliedPromo} {promoResult ? `− ${parseFloat(promoResult.discount).toFixed(2)} DT` : ''}
              </span>
              <button
                type="button"
                onClick={clearPromo}
                className="text-xs text-ink/50 transition hover:text-red-600"
                aria-label={t.checkout.promoRemove}
              >
                <XLg className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder={t.checkout.promoPlaceholder}
                disabled={usePoints}
                className={`${inputClass} flex-1 uppercase`}
              />
              <button
                type="button"
                onClick={applyPromo}
                disabled={promoBusy || usePoints || !promoInput.trim()}
                className="rounded-lg border border-ink/20 px-4 py-2 text-sm text-ink/70 transition hover:border-accent hover:text-accent disabled:opacity-40"
              >
                {promoBusy ? '...' : t.checkout.promoApply}
              </button>
            </div>
          )}
          {promoError && <p className="mt-2 text-xs text-red-600">{promoError}</p>}
          {errors.promo_code && <p className="mt-2 text-xs text-red-600">{errors.promo_code[0]}</p>}
        </div>

        {/* Order summary */}
        <div className="rounded-xl bg-surface p-5">
          <h3 className="font-display mb-3 text-lg font-semibold text-ink">{t.cart.title}</h3>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between py-1 text-sm text-ink/70">
              <span>{localizedName(item, lang)} × {item.quantity}</span>
              <span>{(parseFloat(item.price) * item.quantity).toFixed(2)} DT</span>
            </div>
          ))}
          {discount > 0 && (
            <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 text-sm text-green-600">
              <span>{t.checkout.discount}</span>
              <span>− {discount.toFixed(2)} DT</span>
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-ink/10 pt-3">
            <span className="font-semibold text-ink">{t.cart.total}</span>
            <span className="font-display text-xl font-bold text-accent">
              {finalTotal.toFixed(2)} DT
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-600">
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
          {t.checkout.mockNote}
        </div>

        {!user && (
          <div className="flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm text-accent">
            <PersonFill className="mt-0.5 h-4 w-4 shrink-0" />
            {t.checkout.loginRequired}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-accent py-3.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting
            ? '...'
            : !user
              ? t.checkout.loginToConfirm
              : t.checkout.confirm}
        </button>
      </form>
    </section>
  )
}
