import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import RequireAuth from './components/RequireAuth'
import RequireClientAuth from './components/RequireClientAuth'
import OrderWatcher from './components/OrderWatcher'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ClientAuthProvider } from './context/ClientAuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import MagneticFX from './components/MagneticFX'
import Home from './pages/Home'
import Menu from './pages/Menu'

// The public bundle only carries what a customer needs; the admin panel, the
// checkout/account flows and the QR tool are loaded on demand.
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const QrMenu = lazy(() => import('./pages/QrMenu'))
const QrGenerator = lazy(() => import('./pages/QrGenerator'))
const Reservation = lazy(() => import('./pages/Reservation'))
const AuthPage = lazy(() => import('./pages/client/AuthPage'))
const AccountPage = lazy(() => import('./pages/client/AccountPage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'))
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'))
const ReservationsPage = lazy(() => import('./pages/admin/ReservationsPage'))
const ReviewsPage = lazy(() => import('./pages/admin/ReviewsPage'))
const PromoPage = lazy(() => import('./pages/admin/PromoPage'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))

function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
        <ClientAuthProvider>
          <CartProvider>
            <ToastProvider>
              <OrderWatcher />
              <MagneticFX />
              <div className="flex min-h-screen flex-col bg-ivory">
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Public site */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route
                      path="/checkout"
                      element={
                        <RequireClientAuth>
                          <Checkout />
                        </RequireClientAuth>
                      }
                    />
                    <Route
                      path="/reservation"
                      element={
                        <RequireClientAuth>
                          <Reservation />
                        </RequireClientAuth>
                      }
                    />
                  </Route>

                  {/* Client account */}
                  <Route path="/login" element={<AuthPage mode="login" />} />
                  <Route path="/register" element={<AuthPage mode="register" />} />
                  <Route
                    path="/account"
                    element={
                      <RequireClientAuth>
                        <AccountPage />
                      </RequireClientAuth>
                    }
                  />

                  {/* Standalone pages (no navbar/footer) */}
                  <Route path="/qr" element={<QrMenu />} />
                  <Route path="/qr-generator" element={<QrGenerator />} />

                  {/* Admin */}
                  <Route path="/admin/login" element={<LoginPage />} />
                  <Route
                    path="/admin"
                    element={
                      <RequireAuth>
                        <AdminLayout />
                      </RequireAuth>
                    }
                  >
                    <Route index element={<DashboardPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="reservations" element={<ReservationsPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="reviews" element={<ReviewsPage />} />
                    <Route path="promos" element={<PromoPage />} />
                    <Route path="users" element={<UsersPage />} />
                  </Route>
                </Routes>
              </Suspense>
              </div>
            </ToastProvider>
          </CartProvider>
        </ClientAuthProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
