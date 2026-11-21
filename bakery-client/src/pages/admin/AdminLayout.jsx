import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Speedometer2, Bag, Calendar3, CupHot, Star, Tag, People } from 'react-bootstrap-icons'
import Logo from '../../components/Logo'

const NAV_ITEMS = [
  { to: '/admin', label: 'Tableau de bord', icon: Speedometer2, end: true },
  { to: '/admin/orders', label: 'Commandes', icon: Bag },
  { to: '/admin/reservations', label: 'Réservations', icon: Calendar3 },
  { to: '/admin/products', label: 'Produits', icon: CupHot },
  { to: '/admin/reviews', label: 'Avis clients', icon: Star },
  { to: '/admin/promos', label: 'Codes promo', icon: Tag },
  // Staff management stays hidden from employees: the API refuses them anyway.
  { to: '/admin/users', label: 'Équipe', icon: People, adminOnly: true },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 z-30 flex w-60 flex-col border-r border-ink/10 bg-ivory-dark">
        <div className="flex items-center gap-2 px-6 py-6">
          <Logo
            iconClass="h-7 w-7"
            textClass="text-sm font-bold"
            subtitle="Admin"
            subtitleClass="text-[10px] uppercase tracking-wider text-ink/40"
          />
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-accent/15 font-medium text-accent'
                    : 'text-ink/60 hover:bg-surface hover:text-ink'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{user?.name}</p>
              <p className="text-xs text-ink/40 capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/"
              className="flex-1 rounded-lg border border-ink/20 py-2 text-center text-xs text-ink/60 transition hover:border-accent hover:text-accent"
            >
              Voir le site
            </a>
            <button
              onClick={handleLogout}
              className="flex-1 rounded-lg border border-ink/20 py-2 text-xs text-ink/60 transition hover:border-red-400 hover:text-red-600"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
