import { useEffect, useRef } from 'react'
import api from '../api/client'
import { useClientAuth } from '../context/ClientAuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'

const POLL_MS = 15000

/**
 * Silently polls the signed-in client's orders and raises an in-app toast
 * whenever an order's status advances (or is cancelled), so the customer is
 * updated even while browsing other pages. Returns nothing; mount it once
 * inside the app shell.
 */
export default function OrderWatcher() {
  const { user } = useClientAuth()
  const { notify } = useToast()
  const { t } = useLanguage()
  // Last-known status per order id; primes on first load without toasting.
  const knownRef = useRef(null)

  useEffect(() => {
    if (!user) {
      knownRef.current = null
      return undefined
    }

    const poll = () =>
      api
        .get('/auth/orders')
        .then((res) => {
          const orders = res.data.data || []
          const previous = knownRef.current

          if (previous) {
            for (const order of orders) {
              const before = previous[order.id]
              if (before && before !== order.status) {
                notify({
                  type: order.status === 'cancelled' ? 'error' : 'success',
                  title: `${t.account.order} #${order.id}`,
                  message: t.account.status[order.status] || order.status,
                })
              }
            }
          }

          knownRef.current = Object.fromEntries(orders.map((o) => [o.id, o.status]))
        })
        .catch(() => {})

    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [user, notify, t])

  return null
}
