import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bag,
  Calendar3,
  Cart3,
  GearFill,
  People,
  StarFill,
  Truck,
} from 'react-bootstrap-icons'
import api from '../../api/client'
import { useClientAuth } from '../../context/ClientAuthContext'
import { useLanguage } from '../../context/LanguageContext'
import OrderTracker from '../../components/OrderTracker'

const ORDER_STATUS_COLOR = {
  pending: 'bg-amber-500/20 text-amber-600',
  confirmed: 'bg-blue-500/20 text-blue-600',
  ready: 'bg-purple-500/20 text-purple-300',
  completed: 'bg-green-600/20 text-green-600',
  cancelled: 'bg-red-500/20 text-red-600',
}
const RESERVATION_STATUS_COLOR = {
  pending: 'bg-amber-500/20 text-amber-600',
  confirmed: 'bg-green-600/20 text-green-600',
  cancelled: 'bg-red-500/20 text-red-600',
}

const TABS = [
  ['orders', Cart3],
  ['reservations', Calendar3],
  ['loyalty', StarFill],
  ['profile', GearFill],
]

export default function AccountPage() {
  const { t, lang } = useLanguage()
  const { user, logout, updateProfile } = useClientAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [reservations, setReservations] = useState([])
  const [loyalty, setLoyalty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    locale: user?.locale || 'fr',
    password: '',
    password_confirmation: '',
  })
  const [profileMsg, setProfileMsg] = useState(null)
  const [profileErr, setProfileErr] = useState(null)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(null)

  // Poll orders while any are still active so the tracker updates live.
  const hasActive = orders.some((o) =>
    ['pending', 'confirmed', 'ready'].includes(o.status),
  )

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/auth/orders').then((res) => setOrders(res.data.data)).catch(() => setOrders([])),
      api.get('/auth/reservations').then((res) => setReservations(res.data.data)).catch(() => setReservations([])),
      api.get('/auth/loyalty').then((res) => setLoyalty(res.data)).catch(() => setLoyalty(null)),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!hasActive) return undefined
    const id = setInterval(() => {
      api.get('/auth/orders').then((res) => setOrders(res.data.data)).catch(() => {})
    }, 8000)
    return () => clearInterval(id)
  }, [hasActive])

  const statusLabel = (status, kind) => {
    const key = kind === 'reservation' ? `res_${status}` : status
    return t.account.status[key] || status
  }

  const handleCancel = async (id) => {
    if (!window.confirm(t.account.confirmCancel)) return
    setCancelling(id)
    try {
      await api.patch(`/auth/reservations/${id}/cancel`)
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)),
      )
    } catch {
      // ignore — row will refresh on next load
    } finally {
      setCancelling(null)
    }
  }

  const handleProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setProfileMsg(null)
    setProfileErr(null)
    try {
      const payload = {
        name: profile.name,
        phone: profile.phone,
        locale: profile.locale,
      }
      if (profile.password) {
        payload.password = profile.password
        payload.password_confirmation = profile.password_confirmation
      }
      await updateProfile(payload)
      setProfile({ ...profile, password: '', password_confirmation: '' })
      setProfileMsg(t.account.profile.saved)
    } catch (err) {
      const data = err.response?.data
      if (err.response?.status === 422) {
        setProfileErr(Object.values(data.errors || {}).flat().join(' '))
      } else {
        setProfileErr(data?.message || 'Erreur')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const inputClass =
    'w-full rounded-lg border border-ink/20 bg-surface px-4 py-2.5 text-sm text-ink placeholder-ink/40 outline-none focus:border-accent'

  return (
    <section className="mx-auto max-w-3xl px-6 pb-20 pt-28">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold italic text-ink">
            {t.account.title}
          </h1>
          <p className="text-sm text-ink/50">{user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-ink/20 px-4 py-2 text-sm text-ink/70 transition hover:border-accent hover:text-accent"
        >
          {t.nav.logout}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2">
        {TABS.map(([key, TabIcon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition ${
              tab === key
                ? 'bg-accent text-white'
                : 'bg-surface text-ink/60 hover:text-ink'
            }`}
          >
            <TabIcon className="h-4 w-4" />
            {t.account[`tab_${key}`]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : tab === 'orders' ? (
        orders.length === 0 ? (
          <EmptyBox label={t.account.emptyOrders} to="/menu" cta={t.cart.continue} />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl bg-surface p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-lg font-semibold text-ink">
                    {t.account.order} <span className="text-accent">#{order.id}</span>
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${ORDER_STATUS_COLOR[order.status] || ''}`}>
                    {statusLabel(order.status, 'order')}
                  </span>
                </div>

                {/* Live tracking timeline */}
                <div className="mb-4">
                  <OrderTracker status={order.status} type={order.type} live={hasActive} />
                </div>

                <div className="space-y-1 text-sm text-ink/60">
                  {(order.items || []).map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between">
                        <span>
                          {(lang === 'ar' ? item.product?.name_ar : item.product?.name_fr) || item.product?.name_fr} ×{' '}
                          {item.quantity}
                        </span>
                        <span>{(parseFloat(item.price) * item.quantity).toFixed(2)} DT</span>
                      </div>
                      {(item.options || []).length > 0 && (
                        <p className="pl-3 text-xs text-amber-600/70">
                          {item.options
                            .map((option) => lang === 'ar' ? option.name_ar : option.name_fr)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                  <span className="flex items-center gap-1.5 text-xs uppercase text-ink/40">
                    {order.type === 'delivery' ? (
                      <>
                        <Truck className="h-3.5 w-3.5" /> {t.checkout.delivery}
                      </>
                    ) : (
                      <>
                        <Bag className="h-3.5 w-3.5" /> {t.checkout.pickup}
                      </>
                    )}
                  </span>
                  <span className="font-display text-lg font-bold text-accent">
                    {parseFloat(order.total).toFixed(2)} DT
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'reservations' ? (
        reservations.length === 0 ? (
          <EmptyBox label={t.account.emptyReservations} to="/reservation" cta={t.nav.reservation} />
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => (
              <div key={res.id} className="flex items-center justify-between rounded-xl bg-surface p-5">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Calendar3 className="h-4 w-4 text-accent" />
                    <span className="font-medium text-ink">
                      {res.date} · {res.time}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${RESERVATION_STATUS_COLOR[res.status] || ''}`}>
                      {statusLabel(res.status, 'reservation')}
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-ink/50">
                    <People className="h-4 w-4 text-ink/40" />
                    {res.guests} · {res.phone}
                  </p>
                </div>
                {['pending', 'confirmed'].includes(res.status) && (
                  <button
                    onClick={() => handleCancel(res.id)}
                    disabled={cancelling === res.id}
                    className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {cancelling === res.id ? '...' : t.account.cancel}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : tab === 'loyalty' ? (
        <LoyaltyPanel loyalty={loyalty} t={t} />
      ) : (
        <form onSubmit={handleProfile} className="space-y-5 rounded-xl bg-surface p-6">
          {profileMsg && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600">
              {profileMsg}
            </div>
          )}
          {profileErr && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {profileErr}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-ink/70">{t.account.profile.name}</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink/70">{t.account.profile.phone}</label>
              <input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink/70">{t.account.profile.language}</label>
            <select
              value={profile.locale}
              onChange={(e) => setProfile({ ...profile, locale: e.target.value })}
              className={inputClass}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
            <p className="mt-1 text-xs text-ink/40">{t.account.profile.languageHint}</p>
          </div>

          <div className="border-t border-ink/10 pt-5">
            <p className="mb-3 text-sm text-ink/60">{t.account.profile.changePassword}</p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-ink/70">{t.account.profile.newPassword}</label>
                <input
                  type="password"
                  value={profile.password}
                  onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                  className={inputClass}
                  minLength={8}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink/70">{t.account.profile.confirmPassword}</label>
                <input
                  type="password"
                  value={profile.password_confirmation}
                  onChange={(e) => setProfile({ ...profile, password_confirmation: e.target.value })}
                  className={inputClass}
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent py-3 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? '...' : t.account.profile.save}
          </button>
        </form>
      )}
    </section>
  )
}

function EmptyBox({ label, to, cta }) {
  return (
    <div className="rounded-xl bg-surface px-6 py-16 text-center">
      <p className="mb-6 text-ink/50">{label}</p>
      <Link
        to={to}
        className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
      >
        {cta}
      </Link>
    </div>
  )
}

function LoyaltyPanel({ loyalty, t }) {
  const points = loyalty?.points || 0
  const step = loyalty?.next_reward_points || 100
  const inStep = points % step
  const pct = Math.round((inStep / step) * 100)

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-gradient-to-br from-accent/15 to-surface p-6 text-center">
        <p className="text-sm uppercase tracking-wider text-ink/50">{t.account.loyalty.balance}</p>
        <p className="font-display my-1 text-5xl font-bold italic text-amber-600">{points}</p>
        <p className="text-sm text-ink/50">{t.account.loyalty.per100}</p>
      </div>

      <div className="rounded-xl bg-surface p-5">
        <div className="mb-2 flex justify-between text-sm text-ink/60">
          <span>{t.account.loyalty.progress}</span>
          <span>{inStep} / {step}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="rounded-xl bg-surface p-5">
        <h3 className="font-display mb-3 text-lg font-semibold text-ink">{t.account.loyalty.history}</h3>
        {!loyalty?.transactions?.length ? (
          <p className="text-sm text-ink/40">{t.account.loyalty.emptyHistory}</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {loyalty.transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="text-ink/70">{tx.description}</p>
                  <p className="text-xs text-ink/30">{tx.date}</p>
                </div>
                <span className={`font-medium ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.points >= 0 ? '+' : ''}{tx.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
