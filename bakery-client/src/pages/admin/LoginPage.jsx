import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          'Identifiants incorrects',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <Logo stacked iconClass="h-10 w-10" textClass="text-2xl font-bold" />
          </div>
          <p className="mt-1 text-sm text-ink/50">Espace administration</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl bg-ivory-dark p-8"
        >
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-ink/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-ivory px-4 py-2.5 text-sm text-ink placeholder-ink/40 outline-none focus:border-accent"
              placeholder="admin@happyplate.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink/70">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-ivory px-4 py-2.5 text-sm text-ink placeholder-ink/40 outline-none focus:border-accent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-3 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? '...' : 'Se connecter'}
          </button>

          <div className="rounded-lg bg-ivory px-4 py-3 text-xs leading-relaxed text-ink/40">
            <p className="mb-1 font-medium text-ink/60">Comptes de démo :</p>
            <p>admin@happyplate.com / password</p>
            <p>employe@happyplate.com / password</p>
          </div>
        </form>
      </div>
    </div>
  )
}
