import { useEffect, useState } from 'react'
import { Check2, Star, StarFill, Trash3, XLg } from 'react-bootstrap-icons'
import api from '../../api/client'

const STATUS_STYLES = {
  approved: 'bg-green-500/20 text-green-600',
  rejected: 'bg-red-500/20 text-red-600',
}

const STATUS_LABELS = {
  approved: 'Approuvé',
  rejected: 'Rejeté',
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api
      .get('/admin/reviews', { params: { page, status: filter || undefined } })
      .then((res) => {
        setReviews(res.data.data)
        setMeta(res.data.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, filter])

  const updateStatus = async (review, status) => {
    await api.patch(`/admin/reviews/${review.id}/status`, { status })
    load()
  }

  const remove = async (review) => {
    if (!window.confirm('Supprimer cet avis ?')) return
    await api.delete(`/admin/reviews/${review.id}`)
    load()
  }

  return (
    <div>
      <h1 className="font-display mb-8 text-3xl font-bold italic text-ink">Avis clients</h1>

      <div className="mb-6 flex gap-2">
        {[['', 'Tous'], ['approved', 'Approuvés'], ['rejected', 'Rejetés']].map(([value, label]) => (
          <button
            key={value}
            onClick={() => { setFilter(value); setPage(1) }}
            className={`rounded-full px-4 py-1.5 text-xs transition ${
              filter === value ? 'bg-accent text-white' : 'bg-ivory-dark text-ink/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-ivory-dark" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="py-20 text-center text-ink/40">Aucun avis.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-ivory-dark">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase text-ink/40">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Avis</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b border-ink/5 text-ink/80">
                  <td className="px-4 py-3 font-medium text-ink">{review.product?.name_fr}</td>
                  <td className="px-4 py-3 text-ink/60">{review.author || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-0.5 text-amber-600">
                      {Array.from({ length: review.rating }, (_, i) => (
                        <StarFill key={`f${i}`} className="h-3.5 w-3.5" />
                      ))}
                      <span className="inline-flex gap-0.5 text-ink/25">
                        {Array.from({ length: 5 - review.rating }, (_, i) => (
                          <Star key={`e${i}`} className="h-3.5 w-3.5" />
                        ))}
                      </span>
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-ink/60">
                    <span className="line-clamp-2">{review.comment || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_STYLES[review.status]}`}>
                      {STATUS_LABELS[review.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {review.status === 'approved' ? (
                        <button
                          onClick={() => updateStatus(review, 'rejected')}
                          className="rounded-lg bg-red-600/20 px-3 py-1 text-xs text-red-600 transition hover:bg-red-600/40"
                        >
                          <XLg className="mr-1 inline h-3 w-3" />
                          Rejeter
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatus(review, 'approved')}
                          className="rounded-lg bg-green-600/20 px-3 py-1 text-xs text-green-600 transition hover:bg-green-600/40"
                        >
                          <Check2 className="mr-1 inline h-3.5 w-3.5" />
                          Approuver
                        </button>
                      )}
                      <button
                        onClick={() => remove(review)}
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
    </div>
  )
}
