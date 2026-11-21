import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'react-bootstrap-icons'
import { useClientAuth } from '../../context/ClientAuthContext'
import Logo from '../../components/Logo'

/**
 * Client account page: login or register.
 * mode = 'login' | 'register'
 */
export default function AuthPage({ mode = 'login' }) {
  const { login, register } = useClientAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/reservation'
  // Carried back to /checkout so the filled-in form is restored.
  const returnState = location.state
  const forOrder = from === '/checkout'

  const [tab, setTab] = useState(mode)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Back to wherever the visitor came from (checkout, reservation...).
  // `location.key === 'default'` means this is the first entry of the SPA:
  // there is no previous in-app page, so fall back to the home page.
  const goBack = () => {
    if (location.key && location.key !== 'default') {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (tab === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form)
      }
      navigate(from, { replace: true, state: returnState })
    } catch (err) {
      const data = err.response?.data
      setError(
        data?.errors?.email?.[0] ||
          data?.errors?.password?.[0] ||
          data?.message ||
          'Une erreur est survenue',
      )
    } finally {
      setSubmitting(false)
    }
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
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <div className="mb-6 text-center">
          <button
            type="button"
            onClick={goBack}
            className="group relative mb-6 inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-ink/10 bg-surface/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70 shadow-[0_2px_12px_-8px_rgb(34_27_22_/_0.5)] backdrop-blur-sm transition-[transform,border-color,color,box-shadow] duration-300 ease-out hover:border-accent/50 hover:text-accent hover:shadow-[0_12px_32px_-16px_rgb(192_86_33_/_0.8)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {/* Sheen sweeping across on hover */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:left-full"
            />
            <ArrowLeft className="relative h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:-translate-x-1" />
            <span className="relative">Retour</span>
          </button>
          <Link to="/">
            <Logo iconClass="h-8 w-8" textClass="text-2xl font-bold" />
          </Link>
          <p className="mt-2 text-sm text-ink/50">
            {forOrder
              ? 'Connectez-vous pour confirmer votre commande'
              : tab === 'login'
                ? 'Connectez-vous pour réserver votre table'
                : 'Créez votre compte pour réserver'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-lg bg-ivory-dark p-1">
          {[
            ['login', 'Connexion'],
            ['register', 'Inscription'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => { setTab(value); setError('') }}
              className={`flex-1 rounded-md py-2 text-sm transition ${
                tab === value ? 'bg-accent text-white' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-ivory-dark/90 p-6 backdrop-blur">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="mb-1 block text-sm text-ink/70">Nom complet</label>
              <input name="name" value={form.name} onChange={handleChange} className={inputClass} required />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-ink/70">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} required />
          </div>

          {tab === 'register' && (
            <div>
              <label className="mb-1 block text-sm text-ink/70">Téléphone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} required />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-ink/70">Mot de passe</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className={inputClass}
              minLength={tab === 'register' ? 8 : undefined}
              required
            />
          </div>

          {tab === 'register' && (
            <div>
              <label className="mb-1 block text-sm text-ink/70">Confirmer le mot de passe</label>
              <input
                name="password_confirmation"
                type="password"
                value={form.password_confirmation}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-3 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? '...' : tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>

          <p className="text-center text-xs text-ink/40">
            {tab === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button type="button" onClick={() => setTab('register')} className="text-accent hover:underline">
                  Inscrivez-vous
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button type="button" onClick={() => setTab('login')} className="text-accent hover:underline">
                  Connectez-vous
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </section>
  )
}
