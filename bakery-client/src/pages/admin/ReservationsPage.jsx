import { useEffect, useState } from 'react'
import { Check2, PersonFill, XLg } from 'react-bootstrap-icons'
import api from '../../api/client'

const STATUS_STYLES = {
  pending: 'bg-amber-500/20 text-amber-600',
  confirmed: 'bg-green-500/20 text-green-600',
  cancelled: 'bg-red-500/20 text-red-600',
}

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api
      .get('/admin/reservations', { params: { page, status: filter || undefined } })
      .then((res) => {
        setReservations(res.data.data)
        setMeta(res.data.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, filter])

  const updateStatus = async (reservation, status) => {
    await api.patch(`/admin/reservations/${reservation.id}/status`, { status })
    load()
  }

  return (
    <div>
      <h1 className="font-display mb-8 text-3xl font-bold italic text-ink">Réservations</h1>

      <div className="mb-6 flex gap-2">
        {[['', 'Toutes'], ['pending', 'En attente'], ['confirmed', 'Confirmées'], ['cancelled', 'Annulées']].map(
          ([value, label]) => (
            <button
              key={value}
              onClick={() => { setFilter(value); setPage(1) }}
              className={`rounded-full px-4 py-1.5 text-xs transition ${
                filter === value ? 'bg-accent text-white' : 'bg-ivory-dark text-ink/60'
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-ivory-dark" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <p className="py-20 text-center text-ink/40">Aucune réservation.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-ivory-dark">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase text-ink/40">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Heure</th>
                <th className="px-4 py-3">Pers.</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="border-b border-ink/5 text-ink/80">
                  <td className="px-4 py-3 font-medium text-ink">{reservation.name}</td>
                  <td className="px-4 py-3 text-ink/60">
                    <div>{reservation.phone}</div>
                    <div className="text-xs text-ink/40">{reservation.email}</div>
                  </td>
                  <td className="px-4 py-3">{reservation.date}</td>
                  <td className="px-4 py-3">{reservation.time}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      {reservation.guests}
                      <PersonFill className="h-3.5 w-3.5 text-ink/40" />
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_STYLES[reservation.status]}`}>
                      {STATUS_LABELS[reservation.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {reservation.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => updateStatus(reservation, 'confirmed')}
                          className="rounded-lg bg-green-600/20 px-3 py-1 text-xs text-green-600 transition hover:bg-green-600/40"
                        >
                          <Check2 className="mr-1 inline h-3.5 w-3.5" />
                          Confirmer
                        </button>
                        <button
                          onClick={() => updateStatus(reservation, 'cancelled')}
                          className="rounded-lg bg-red-600/20 px-3 py-1 text-xs text-red-600 transition hover:bg-red-600/40"
                        >
                          <XLg className="mr-1 inline h-3 w-3" />
                          Annuler
                        </button>
                      </div>
                    )}
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
                page === p ? 'bg-accent text-white' : 'bg-ivory-dark text-ink/60'
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
