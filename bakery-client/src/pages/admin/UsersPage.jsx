import { useEffect, useState } from 'react'
import { PencilSquare, PersonCheck, PersonDash, PersonPlus, Trash3 } from 'react-bootstrap-icons'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'employee',
}

const inputClass =
  'w-full rounded-lg border border-ink/20 bg-surface px-3 py-2 text-sm text-ink placeholder-ink/40 outline-none focus:border-accent'

/** First readable message from a Laravel 422/403/500 response. */
const readableError = (err) => {
  const errors = err.response?.data?.errors
  if (errors) {
    const first = Object.values(errors).flat()[0]
    if (first) return first
  }
  return err.response?.data?.message || 'Une erreur est survenue.'
}

export default function UsersPage() {
  const { user: me } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .get('/admin/users')
      .then((res) => {
        setMembers(res.data.data)
        setForbidden(false)
      })
      .catch((err) => {
        if (err.response?.status === 403) setForbidden(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setForm(EMPTY)
    setEditingId(null)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (member) => {
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      password: '',
      role: member.role,
    })
    setEditingId(member.id)
    setErrors({})
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setNotice(null)

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      role: form.role,
    }

    if (form.password) {
      payload.password = form.password
      payload.password_confirmation = form.password
    }

    try {
      if (editingId) {
        await api.put(`/admin/users/${editingId}`, payload)
        setNotice({ type: 'success', text: 'Membre mis à jour.' })
      } else {
        await api.post('/admin/users', payload)
        setNotice({ type: 'success', text: 'Membre ajouté à l’équipe.' })
      }
      setModalOpen(false)
      load()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else {
        setNotice({ type: 'error', text: readableError(err) })
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (member) => {
    setNotice(null)
    try {
      await api.patch(`/admin/users/${member.id}/status`, { is_active: !member.is_active })
      setNotice({
        type: 'success',
        text: member.is_active
          ? `${member.name} a été désactivé.`
          : `${member.name} a été réactivé.`,
      })
      load()
    } catch (err) {
      setNotice({ type: 'error', text: readableError(err) })
    }
  }

  const remove = async (member) => {
    if (!window.confirm(`Supprimer définitivement le membre "${member.name}" ?`)) return
    setNotice(null)
    try {
      await api.delete(`/admin/users/${member.id}`)
      setNotice({ type: 'success', text: 'Membre supprimé.' })
      load()
    } catch (err) {
      setNotice({ type: 'error', text: readableError(err) })
    }
  }

  const roleLabel = (role) => (role === 'admin' ? 'Administrateur' : 'Employé')

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold italic text-ink">Équipe</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          <PersonPlus className="h-4 w-4" />
          Nouveau membre
        </button>
      </div>

      {notice && (
        <div
          className={notice.type === 'success' ? 'alert-success mb-6' : 'alert-error mb-6'}
          role="status"
        >
          {notice.text}
        </div>
      )}

      {forbidden ? (
        <div className="alert-error">Accès réservé aux administrateurs.</div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-ivory-dark" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="py-20 text-center text-ink/40">Aucun membre dans l’équipe.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-ivory-dark">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase text-ink/40">
                <th className="px-4 py-3">Membre</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isSelf = member.id === me?.id

                return (
                  <tr key={member.id} className="border-b border-ink/5 text-ink/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                          {member.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">
                            {member.name}
                            {isSelf && <span className="ml-2 text-xs text-ink/40">(vous)</span>}
                          </p>
                          <p className="truncate text-xs text-ink/50">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/60">{member.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          member.role === 'admin'
                            ? 'bg-accent/15 text-accent'
                            : 'bg-ink/10 text-ink/60'
                        }`}
                      >
                        {roleLabel(member.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          member.is_active
                            ? 'bg-green-500/20 text-green-600'
                            : 'bg-red-500/20 text-red-600'
                        }`}
                      >
                        {member.is_active ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActive(member)}
                          disabled={isSelf}
                          title={
                            isSelf
                              ? 'Vous ne pouvez pas désactiver votre propre compte'
                              : member.is_active
                                ? 'Désactiver'
                                : 'Réactiver'
                          }
                          className="rounded-lg bg-surface px-3 py-1 text-xs text-ink/50 transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {member.is_active ? (
                            <PersonDash className="h-4 w-4" />
                          ) : (
                            <PersonCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(member)}
                          className="rounded-lg bg-accent/20 px-3 py-1 text-xs text-accent transition hover:bg-accent/40"
                        >
                          <PencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(member)}
                          disabled={isSelf}
                          title={isSelf ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer'}
                          className="rounded-lg bg-surface px-3 py-1 text-xs text-ink/50 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash3 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setModalOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-ivory-dark p-6"
          >
            <h2 className="font-display text-xl font-semibold text-ink">
              {editingId ? 'Modifier le membre' : 'Nouveau membre'}
            </h2>

            <div>
              <label className="mb-1 block text-xs text-ink/60">Nom complet *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                required
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink/60">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                required
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email[0]}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink/60">Téléphone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
                placeholder="Optionnel"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone[0]}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink/60">
                Mot de passe {editingId ? '' : '*'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputClass}
                placeholder={editingId ? 'Laisser vide pour ne pas changer' : '8 caractères minimum'}
                required={!editingId}
                minLength={editingId ? undefined : 8}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password[0]}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink/60">Rôle *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputClass}
                disabled={editingId === me?.id}
              >
                <option value="employee">Employé</option>
                <option value="admin">Administrateur</option>
              </select>
              {editingId === me?.id && (
                <p className="mt-1 text-xs text-ink/40">
                  Vous ne pouvez pas modifier votre propre rôle.
                </p>
              )}
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role[0]}</p>}
            </div>

            {errors.user && <div className="alert-error">{errors.user[0]}</div>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
              >
                {saving ? '...' : editingId ? 'Enregistrer' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-ink/20 px-5 py-2.5 text-sm text-ink/70 transition hover:border-accent hover:text-accent"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
