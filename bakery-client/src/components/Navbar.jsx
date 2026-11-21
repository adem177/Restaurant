import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Cart3, Person, BoxArrowRight, PersonFill, Search } from 'react-bootstrap-icons'
import { useCart } from '../context/CartContext'
import { useClientAuth } from '../context/ClientAuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import { useLanguage } from '../context/LanguageContext'
import Logo from './Logo'
import CartDrawer from './CartDrawer'
import SearchOverlay from './SearchOverlay'

export default function Navbar() {
  const { t } = useLanguage()
  const { count, cartOpen, openCart, closeCart } = useCart()
  const { user, logout } = useClientAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
    <nav className="fixed inset-x-0 top-0 z-50 bg-ivory/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/">
          <Logo variant="badge" iconClass="h-7 w-7" textClass="text-xl font-bold" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm text-ink/80 transition hover:text-accent">
            {t.nav.home}
          </Link>
          <Link to="/menu" className="text-sm text-ink/80 transition hover:text-accent">
            {t.nav.menu}
          </Link>
          <Link
            to="/reservation"
            className="text-sm text-ink/80 transition hover:text-accent"
          >
            {t.nav.reservation}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label={t.search.open}
            title={t.search.open}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-hover"
          >
            <Search className="h-4 w-4" />
          </button>

          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/account"
                className="max-w-[10rem] truncate text-sm text-ink/70 transition hover:text-accent"
                title={t.account.title}
              >
                <span className="flex items-center gap-1.5">
                  <PersonFill className="h-3.5 w-3.5" />
                  {user.name}
                </span>
              </Link>
              <button
                onClick={logout}
                className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs text-ink/70 transition hover:border-accent hover:text-accent"
              >
                {t.nav.logout || 'Déconnexion'}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white transition hover:bg-accent-hover md:block"
            >
              {t.nav.login || 'Connexion'}
            </Link>
          )}

          <button
            onClick={openCart}
            data-fly-cart
            aria-label={t.cart.title}
            className="relative text-ink transition hover:text-accent"
          >
            <Cart3 className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </button>

          {/* Mobile auth */}
          {user ? (
            <Link
              to="/account"
              className="text-ink/70 transition hover:text-accent md:hidden"
              aria-label="Account"
            >
              <Person className="h-6 w-6" />
            </Link>
          ) : (
            <Link to="/login" className="text-ink/70 transition hover:text-accent md:hidden" aria-label="Login">
              <BoxArrowRight className="h-6 w-6" />
            </Link>
          )}
        </div>
      </div>
    </nav>

    <CartDrawer open={cartOpen} onClose={closeCart} />
    {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}
