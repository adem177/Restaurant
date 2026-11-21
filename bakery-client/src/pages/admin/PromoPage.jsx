import { useEffect, useState } from 'react'
import { PencilSquare, Trash3 } from 'react-bootstrap-icons'
import api from '../../api/client'

const EMPTY = {
  code: '',
  type: 'percent',
  value: '',
  min_total: '',
  max_uses: '',
  is_active: true,
}

const inputClass =
  'w-full rounded-lg border border-ink/20 bg-surface px-3 py-2 text-sm text-ink placeholder-ink/40 outline-none focus:border-accent'

export default function PromoPage() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .get('/admin/promos')
      .then((res) => setPromos(res.data.data))
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

  const openEdit = (promo) => {
    setForm({
      code: promo.code,
      type: promo.type,
      value: promo.value,
      min_total: promo.min_total || '',
      max_uses: promo.max_uses ?? '',
      is_active: promo.is_active,
    })
    setEditingId(promo.id)
    setErrors({})
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      min_total: form.min_total === '' ? null : parseFloat(form.min_total),
      max_uses: form.max_uses === '' ? null : parseInt(form.max_uses, 10),
      is_active: form.is_active,
    }
    try {
      if (editingId) {
        await api.put(`/admin/promos/${editingId}`, payload)
      } else {
        await api.post('/admin/promos', payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (promo) => {
    if (!window.confirm(`Supprimer le code "${promo.code}" ?`)) return
    await api.delete(`/admin/promos/${promo.id}`)
    load()
  }

  const toggleActive = async (promo) => {
    await api.put(`/admin/promos/${promo.id}`, { is_active: !promo.is_active })
    load()
  }

  const fmt = (v) => (v === null || v === undefined ? '—' : `${parseFloat(v).toFixed(2)} DT`)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold italic text-ink">Codes promo</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          + Nouveau code
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-ivory-dark" />
          ))}
        </div>
      ) : promos.length === 0 ? (
        <p className="py-20 text-center text-ink/40">Aucun code promo.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-ivory-dark">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase text-ink/40">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Réduction</th>
                <th className="px-4 py-3">Min. panier</th>
                <th className="px-4 py-3">Utilisations</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => (
                <tr key={promo.id} className="border-b border-ink/5 text-ink/80">
                  <td className="px-4 py-3 font-mono font-semibold text-accent">{promo.code}</td>
                  <td className="px-4 py-3">
                    {promo.type === 'percent' ? `${parseFloat(promo.value)} %` : fmt(promo.value)}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{fmt(promo.min_total)}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {promo.used_count}
                    {promo.max_uses !== null && ` / ${promo.max_uses}`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        promo.is_usable_now
                          ? 'bg-green-500/20 text-green-600'
                          : 'bg-red-500/20 text-red-600'
                      }`}
                    >
                      {promo.is_usable_now ? 'Actif' : 'Inactif/expiré'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleActive(promo)}
                        className="rounded-lg bg-surface px-3 py-1 text-xs text-ink/50 transition hover:text-accent"
                      >
                        {promo.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => openEdit(promo)}
                        className="rounded-lg bg-accent/20 px-3 py-1 text-xs text-accent transition hover:bg-accent/40"
                      >
                        <PencilSquare className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(promo)}
                        className="rounded-lg bg-surface px-3 py-1 text-xs text-ink/50 transition hover:text-red-600"
                      >
                        <Trash3 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setModalOpen(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-ivory-dark p-6"
          >
            <h2 className="font-display text-xl font-semibold text-ink">
              {editingId ? 'Modifier le code' : 'Nouveau code promo'}
            </h2>

            <div>
              <label className="mb-1 block text-xs text-ink/60">Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className={`${inputClass} font-mono uppercase`}
                required
              />
              {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-ink/60">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className={inputClass}
                >
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (DT)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink/60">Valeur *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className={inputClass}
                  required
                />
                {errors.value && <p className="mt-1 text-xs text-red-600">{errors.value[0]}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-ink/60">Min. panier (DT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.min_total}
                  onChange={(e) => setForm({ ...form, min_total: e.target.value })}
                  className={inputClass}
                  placeholder="Aucun"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink/60">Max utilisations</label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  className={inputClass}
                  placeholder="Illimité"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="accent-accent"
              />
              Code actif
            </label>

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
