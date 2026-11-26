import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BalloonFill,
  CalendarCheck,
  CheckCircleFill,
  PersonFill,
} from 'react-bootstrap-icons'
import api from '../api/client'
import { useClientAuth } from '../context/ClientAuthContext'
import { useLanguage } from '../context/LanguageContext'
import useSeo from '../hooks/useSeo'

const TIMES = ['12:00', '12:30', '13:00', '13:30', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']

export default function Reservation() {
  const { t } = useLanguage()
  const { user, logout } = useClientAuth()
  useSeo({ title: t.reservation?.title, path: '/reservation' })
  // Contact fields always start blank, even when logged in.
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '19:30',
    guests: 2,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      const { data } = await api.post('/reservations', form)
      setSuccess(data.data)
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
          <BalloonFill className="h-16 w-16 text-accent" />
        </div>
        <h1 className="font-display mb-3 text-4xl font-bold italic text-ink">
          {t.reservation.success}
        </h1>
        <p className="mb-2 text-ink/60">{t.reservation.successNote}</p>
        <p className="mb-8 flex items-center justify-center gap-1.5 text-sm text-accent">
          {success.date} à {success.time} — {success.guests}
          <PersonFill className="h-4 w-4" />
        </p>
        <Link
          to="/"
          className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          {t.checkout.backHome}
        </Link>
      </section>
    )
  }

  const inputClass =
    'w-full rounded-lg border border-ink/20 bg-surface px-4 py-2.5 text-sm text-ink placeholder-ink/40 outline-none focus:border-accent'

  return (
    <section className="relative min-h-screen">
      <img
        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-ivory/85" />
      <div className="relative mx-auto max-w-xl px-6 pb-20 pt-32">
        <h1 className="font-display mb-2 text-center text-4xl font-bold italic text-ink">
          {t.reservation.title}
        </h1>
        <p className="mb-6 text-center text-sm text-ink/60">
          {t.reservation.subtitle}
        </p>

        {/* Logged-in account bar */}
        {user && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
            <span className="flex items-center gap-1.5 text-ink/80">
              <CheckCircleFill className="h-4 w-4 text-green-600" />
              {t.reservation.loggedInAs || 'Connecté en tant que'}{' '}
              <span className="font-medium text-accent">{user.name}</span>
            </span>
            <button
              onClick={logout}
              className="text-ink/50 transition hover:text-accent"
            >
              {t.nav.logout}
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-ivory-dark/90 p-8 backdrop-blur"
        >
          <div>
            <label className="mb-1 block text-sm text-ink/70">{t.reservation.name} *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputClass}
              required
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-ink/70">{t.reservation.phone} *</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={inputClass}
                required
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone[0]}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink/70">{t.reservation.email} *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
                required
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-ink/70">{t.reservation.date} *</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={inputClass}
                required
              />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date[0]}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink/70">{t.reservation.time} *</label>
              <select
                name="time"
                value={form.time}
                onChange={handleChange}
                className={inputClass}
              >
                {TIMES.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink/70">
                {t.reservation.guests} *
              </label>
              <select
                name="guests"
                value={form.guests}
                onChange={handleChange}
                className={inputClass}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {errors.guests && (
                <p className="mt-1 text-xs text-red-600">{errors.guests[0]}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-3.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? '...' : (
              <span className="inline-flex items-center justify-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                {t.reservation.submit}
              </span>
            )}
          </button>
        </form>
      </div>
    </section>
  )
}
