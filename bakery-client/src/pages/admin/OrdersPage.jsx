import { useEffect, useState } from 'react'
import { ArrowRight, Bag, Envelope, GeoAlt, Truck } from 'react-bootstrap-icons'
import api from '../../api/client'

const STATUSES = ['pending', 'confirmed', 'ready', 'completed', 'cancelled']

const STATUS_STYLES = {
  pending: 'bg-amber-500/20 text-amber-600',
  confirmed: 'bg-blue-500/20 text-blue-600',
  ready: 'bg-purple-500/20 text-purple-400',
  completed: 'bg-green-500/20 text-green-600',
  cancelled: 'bg-red-500/20 text-red-600',
}

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  ready: 'Prête',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .get('/admin/orders', { params: { page, status: filter || undefined } })
      .then((res) => {
        setOrders(res.data.data)
        setMeta(res.data.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, filter])

  const updateStatus = async (order, status) => {
    await api.patch(`/admin/orders/${order.id}/status`, { status })
    load()
  }

  return (
    <div>
      <h1 className="font-display mb-8 text-3xl font-bold italic text-ink">Commandes</h1>

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => { setFilter(''); setPage(1) }}
          className={`rounded-full px-4 py-1.5 text-xs transition ${
            filter === '' ? 'bg-accent text-white' : 'bg-ivory-dark text-ink/60'
          }`}
        >
          Toutes
        </button>
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setPage(1) }}
            className={`rounded-full px-4 py-1.5 text-xs transition ${
              filter === status ? 'bg-accent text-white' : 'bg-ivory-dark text-ink/60'
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-ivory-dark" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="py-20 text-center text-ink/40">Aucune commande.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl bg-ivory-dark">
              <div
                className="flex cursor-pointer items-center gap-4 p-4"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">#{order.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_STYLES[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-ivory px-2 py-0.5 text-[10px] text-ink/60">
                      {order.type === 'pickup' ? (
                        <>
                          <Bag className="h-3 w-3" /> Emporter
                        </>
                      ) : (
                        <>
                          <Truck className="h-3 w-3" /> Livraison
                        </>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink/60">
                    {order.customer_name} · {order.customer_phone}
                  </p>
                </div>
                <p className="font-display text-lg font-bold text-accent">
                  {parseFloat(order.total).toFixed(2)} DT
                </p>
              </div>

              {expanded === order.id && (
                <div className="border-t border-ink/10 p-4">
                  <div className="mb-4 space-y-1">
                    {order.items?.map((item) => (
                      <div key={item.id}>
                        <div className="flex justify-between text-sm text-ink/70">
                          <span>{item.product?.name_fr} × {item.quantity}</span>
                          <span>{(parseFloat(item.price) * item.quantity).toFixed(2)} DT</span>
                        </div>
                        {(item.options || []).length > 0 && (
                          <p className="pl-3 text-xs text-amber-600/70">
                            {item.options.map((option) => option.name_fr).join(' · ')}
                          </p>
                        )}
                      </div>
                    ))}
                    {order.address && (
                      <p className="flex items-start gap-1.5 pt-2 text-xs text-ink/50">
                        <GeoAlt className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent/70" />
                        {order.address}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 pt-1 text-xs text-ink/40">
                      <Envelope className="h-3.5 w-3.5 shrink-0" />
                      {order.customer_email || '—'} · {new Date(order.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {STATUSES.filter((s) => s !== order.status).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(order, status)}
                        className={`rounded-lg px-3 py-1.5 text-xs transition ${
                          status === 'cancelled'
                            ? 'border border-red-500/40 text-red-600 hover:bg-red-500/10'
                            : 'border border-ink/20 text-ink/60 hover:border-accent hover:text-accent'
                        }`}
                      >
                        <ArrowRight className="mr-1 inline h-3 w-3" />
                        {STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
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
