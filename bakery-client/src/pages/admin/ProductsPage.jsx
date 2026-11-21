import { useEffect, useState } from 'react'
import { Leaf, PencilSquare, StarFill, Trash3 } from 'react-bootstrap-icons'
import api from '../../api/client'

const EMPTY = {
  category_id: '',
  name_fr: '',
  name_ar: '',
  name_en: '',
  description_fr: '',
  description_ar: '',
  description_en: '',
  price: '',
  stock: '',
  calories: '',
  carbs_g: '',
  fat_g: '',
  protein_g: '',
  image: '',
  is_vegetarian: false,
  is_gluten_free: false,
  is_featured: false,
  allergen_codes: [],
}

/**
 * Stock state pill: red = out of stock, amber = low, green = healthy,
 * grey = unlimited (NULL stock is never tracked).
 */
function StockBadge({ product }) {
  if (product.stock === null || product.stock === undefined) {
    return <span className="rounded bg-ivory px-1.5 py-0.5 text-[10px] text-ink/40">∞</span>
  }

  if (product.stock <= 0) {
    return (
      <span className="rounded bg-red-600/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        Épuisé
      </span>
    )
  }

  if (product.stock <= 5) {
    return (
      <span className="rounded bg-amber-500/80 px-1.5 py-0.5 text-[10px] font-semibold text-ink">
        {product.stock}
      </span>
    )
  }

  return <span className="text-[11px] text-ink/60">{product.stock}</span>
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [allergens, setAllergens] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .get('/admin/products', { params: { page, search: search || undefined } })
      .then((res) => {
        setProducts(res.data.data)
        setMeta(res.data.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, search])

  useEffect(() => {
    api.get('/admin/products/categories').then((res) => setCategories(res.data.data))
    api.get('/allergens').then((res) => setAllergens(res.data.data)).catch(() => setAllergens([]))
  }, [])

  const openCreate = () => {
    setForm(EMPTY)
    setEditingId(null)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setForm({
      category_id: product.category_id,
      name_fr: product.name_fr,
      name_ar: product.name_ar,
      name_en: product.name_en || '',
      description_fr: product.description_fr || '',
      description_ar: product.description_ar || '',
      description_en: product.description_en || '',
      price: product.price,
      stock: product.stock ?? '',
      calories: product.calories ?? '',
      carbs_g: product.carbs_g ?? '',
      fat_g: product.fat_g ?? '',
      protein_g: product.protein_g ?? '',
      image: product.image || '',
      is_vegetarian: product.is_vegetarian,
      is_gluten_free: product.is_gluten_free,
      is_featured: product.is_featured,
      allergen_codes: (product.allergens || []).map((a) => a.code),
    })
    setEditingId(product.id)
    setErrors({})
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      // Empty fields mean "unlimited" / "not published" (NULL on the API side).
      const num = (v) => (v === '' || v === null ? null : Number(v))

      const payload = {
        ...form,
        stock: num(form.stock),
        calories: num(form.calories),
        carbs_g: num(form.carbs_g),
        fat_g: num(form.fat_g),
        protein_g: num(form.protein_g),
        allergen_codes: form.allergen_codes || [],
      }

      if (editingId) {
        await api.put(`/admin/products/${editingId}`, payload)
      } else {
        await api.post('/admin/products', payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {})
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Supprimer "${product.name_fr}" ?`)) return
    await api.delete(`/admin/products/${product.id}`)
    load()
  }

  const inputClass =
    'w-full rounded-lg border border-ink/20 bg-ivory px-3 py-2 text-sm text-ink placeholder-ink/40 outline-none focus:border-accent'

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold italic text-ink">Produits</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          + Ajouter
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        placeholder="Rechercher un produit..."
        className="mb-6 w-full max-w-sm rounded-lg border border-ink/20 bg-ivory-dark px-4 py-2.5 text-sm text-ink placeholder-ink/40 outline-none focus:border-accent"
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-ivory-dark" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-ivory-dark">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase text-ink/40">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nom (FR)</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Badges</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-ink/5 text-ink/80">
                  <td className="px-4 py-3 text-ink/40">{product.id}</td>
                  <td className="px-4 py-3">{product.name_fr}</td>
                  <td className="px-4 py-3 text-ink/60">{product.category?.name_fr}</td>
                  <td className="px-4 py-3 font-medium text-accent">
                    {parseFloat(product.price).toFixed(2)} DT
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge product={product} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {product.is_vegetarian && (
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-green-800/60">
                          <Leaf className="h-3 w-3" />
                        </span>
                      )}
                      {product.is_gluten_free && (
                        <span className="rounded bg-green-600/60 px-1.5 py-0.5 text-[10px] font-bold text-white">GF</span>
                      )}
                      {product.is_featured && (
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-accent/60 text-white">
                          <StarFill className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(product)}
                      className="mr-3 text-ink/50 transition hover:text-accent"
                    >
                      <PencilSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="text-ink/50 transition hover:text-red-600"
                    >
                      <Trash3 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm transition ${
                page === p ? 'bg-accent text-white' : 'bg-ivory-dark text-ink/60 hover:text-ink'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-ivory-dark p-6"
          >
            <h2 className="font-display text-xl font-semibold text-ink">
              {editingId ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-ink/60">Nom (FR) *</label>
                <input
                  value={form.name_fr}
                  onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
                  className={inputClass}
                  required
                />
                {errors.name_fr && <p className="mt-1 text-xs text-red-600">{errors.name_fr[0]}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink/60">Nom (AR) *</label>
                <input
                  value={form.name_ar}
                  onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                  className={`${inputClass} text-right`}
                  dir="rtl"
                  required
                />
                {errors.name_ar && <p className="mt-1 text-xs text-red-600">{errors.name_ar[0]}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink/60">Nom (EN)</label>
              <input
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                className={inputClass}
                placeholder="Repli FR si vide"
              />
              {errors.name_en && <p className="mt-1 text-xs text-red-600">{errors.name_en[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-ink/60">Catégorie *</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className={inputClass}
                  required
                >
                  <option value="">— Choisir —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_fr}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="mt-1 text-xs text-red-600">{errors.category_id[0]}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink/60">Prix (DT) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={inputClass}
                  required
                />
                {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price[0]}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink/60">
                Stock (vide = illimité)
              </label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className={inputClass}
                placeholder="∞"
              />
              {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock[0]}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs text-ink/60">
                Nutrition par portion (vide = non publiée)
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  ['calories', 'kcal'],
                  ['carbs_g', 'Glucides (g)'],
                  ['fat_g', 'Lipides (g)'],
                  ['protein_g', 'Protéines (g)'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-[10px] text-ink/40">{label}</label>
                    <input
                      type="number"
                      min="0"
                      step={key === 'calories' ? '1' : '0.1'}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className={inputClass}
                      placeholder="—"
                    />
                    {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key][0]}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs text-ink/60">Allergènes</label>
              {allergens.length === 0 ? (
                <p className="text-xs text-ink/40">Chargement…</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allergens.map((allergen) => {
                    const active = (form.allergen_codes || []).includes(allergen.code)
                    return (
                      <button
                        key={allergen.id}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            allergen_codes: active
                              ? form.allergen_codes.filter((c) => c !== allergen.code)
                              : [...(form.allergen_codes || []), allergen.code],
                          })
                        }
                        className={`rounded-full px-3 py-1 text-xs transition ${
                          active
                            ? 'bg-amber-500 text-ink font-semibold'
                            : 'bg-ivory text-ink/60 hover:text-ink'
                        }`}
                      >
                        {allergen.name_fr}
                      </button>
                    )
                  })}
                </div>
              )}
              {errors.allergen_codes && (
                <p className="mt-1 text-xs text-red-600">{errors.allergen_codes[0]}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink/60">Image (nom de fichier ou URL)</label>
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className={inputClass}
                placeholder="plat.jpg"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink/60">Description (FR)</label>
              <textarea
                value={form.description_fr}
                onChange={(e) => setForm({ ...form, description_fr: e.target.value })}
                className={inputClass}
                rows={2}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink/60">Description (AR)</label>
              <textarea
                value={form.description_ar}
                onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                className={`${inputClass} text-right`}
                dir="rtl"
                rows={2}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-ink/60">Description (EN)</label>
              <textarea
                value={form.description_en}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                className={inputClass}
                rows={2}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              {[
                ['is_vegetarian', Leaf, 'Végétarien'],
                ['is_gluten_free', null, 'GF Sans gluten'],
                ['is_featured', StarFill, 'Vedette'],
              ].map(([key, BadgeIcon, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="accent-accent"
                  />
                  {BadgeIcon && <BadgeIcon className="h-4 w-4 text-accent" />}
                  {label}
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-ink/20 px-5 py-2.5 text-sm text-ink/60 transition hover:text-ink"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
              >
                {saving ? '...' : editingId ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
