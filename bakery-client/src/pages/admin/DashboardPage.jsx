import { useEffect, useState } from 'react'
import {
  Bag,
  Calendar3,
  CalendarCheck,
  CashStack,
  ExclamationTriangleFill,
  HourglassSplit,
  XOctagonFill,
} from 'react-bootstrap-icons'
import api from '../../api/client'

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-xl bg-ivory-dark p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/50">{label}</p>
        {Icon && <Icon className="h-5 w-5 text-ink/40" />}
      </div>
      <p className={`font-display mt-2 text-3xl font-bold ${accent || 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}

function BarChart({ data, labelKey, valueKey, unit, color }) {
  const max = Math.max(...data.map((d) => parseFloat(d[valueKey]) || 0), 1)
  return (
    <div className="flex h-48 items-end gap-1.5">
      {data.map((item, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-ink/0 transition group-hover:text-ink/70">
            {item[valueKey]}
            {unit}
          </span>
          <div
            className={`w-full rounded-t ${color || 'bg-accent'} transition-all group-hover:opacity-80`}
            style={{ height: `${(parseFloat(item[valueKey]) / max) * 100}%`, minHeight: 2 }}
          />
          <span className="text-[9px] text-ink/40">{item[labelKey]}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-ivory-dark" />
        ))}
      </div>
    )
  }

  if (!stats) return <p className="text-ink/50">Erreur de chargement.</p>

  const { overview, top_products, peak_hours, daily_revenue } = stats

  return (
    <div>
      <h1 className="font-display mb-8 text-3xl font-bold italic text-ink">
        Tableau de bord
      </h1>

      {/* Overview cards */}
      <div className="mb-8 grid grid-cols-2 gap-5 lg:grid-cols-5">
        <StatCard label="CA aujourd'hui" value={`${parseFloat(overview.today_revenue).toFixed(0)} DT`} icon={CashStack} accent="text-accent" />
        <StatCard label="Commandes auj." value={overview.today_orders} icon={Bag} />
        <StatCard label="En attente" value={overview.pending_orders} icon={HourglassSplit} accent="text-amber-600" />
        <StatCard label="Réserv. auj." value={overview.today_reservations} icon={Calendar3} />
        <StatCard label="Réserv. à venir" value={overview.upcoming_reservations} icon={CalendarCheck} accent="text-green-600" />
      </div>

      {/* Stock alerts */}
      {(overview.out_of_stock > 0 || overview.low_stock > 0) && (
        <div className="mb-8 flex flex-wrap gap-3">
          {overview.out_of_stock > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <XOctagonFill className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-600">
                  {overview.out_of_stock} produit{overview.out_of_stock > 1 ? 's' : ''} épuisé
                  {overview.out_of_stock > 1 ? 's' : ''}
                </p>
                <a href="/admin/products" className="text-xs text-red-600/70 underline hover:text-red-600">
                  Voir les produits
                </a>
              </div>
            </div>
          )}
          {overview.low_stock > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <ExclamationTriangleFill className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-600">
                  {overview.low_stock} produit{overview.low_stock > 1 ? 's' : ''} en stock bas
                </p>
                <a href="/admin/products" className="text-xs text-amber-600/70 underline hover:text-amber-600">
                  Voir les produits
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily revenue */}
        <div className="rounded-xl bg-ivory-dark p-6">
          <h2 className="font-display mb-4 text-lg font-semibold text-ink">
            Revenus (7 jours)
          </h2>
          {daily_revenue.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/40">Aucune donnée</p>
          ) : (
            <BarChart
              data={daily_revenue.map((d) => ({ ...d, label: d.day.slice(5) }))}
              labelKey="label"
              valueKey="revenue"
              unit="DT"
              color="bg-accent"
            />
          )}
        </div>

        {/* Peak hours */}
        <div className="rounded-xl bg-ivory-dark p-6">
          <h2 className="font-display mb-4 text-lg font-semibold text-ink">
            Heures de pointe
          </h2>
          {peak_hours.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/40">Aucune donnée</p>
          ) : (
            <BarChart
              data={peak_hours}
              labelKey="hour"
              valueKey="orders_count"
              color="bg-amber-500"
            />
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="mt-6 rounded-xl bg-ivory-dark p-6">
        <h2 className="font-display mb-4 text-lg font-semibold text-ink">
          Produits les plus vendus
        </h2>
        {top_products.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/40">Aucune donnée</p>
        ) : (
          <div className="space-y-3">
            {top_products.map((product, i) => {
              const maxSold = top_products[0].total_sold
              return (
                <div key={product.id} className="flex items-center gap-4">
                  <span className="w-6 text-sm font-semibold text-accent">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-ink">{product.name_fr}</span>
                      <span className="text-ink/50">
                        {product.total_sold} vendus · {parseFloat(product.revenue).toFixed(0)} DT
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ivory">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(product.total_sold / maxSold) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
