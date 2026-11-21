import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircleFill, ExclamationTriangleFill, InfoCircleFill, XCircleFill, XLg } from 'react-bootstrap-icons'

const ToastContext = createContext(null)

const TOAST_STYLES = {
  success: 'border-green-500/40 bg-green-50 text-green-700',
  info: 'border-blue-500/40 bg-blue-50 text-blue-700',
  warn: 'border-amber-500/40 bg-amber-50 text-amber-700',
  error: 'border-red-500/40 bg-red-50 text-red-700',
}

const TOAST_ICONS = {
  success: CheckCircleFill,
  info: InfoCircleFill,
  warn: ExclamationTriangleFill,
  error: XCircleFill,
}

/**
 * Lightweight in-app toast notifications. Any component can raise one with
 * `useToast().notify({ type, title, message })`; toasts auto-dismiss after a
 * few seconds and stack in the bottom-right corner.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    ({ type = 'info', title = '', message = '' }) => {
      const id = ++idRef.current
      // Keep at most four on screen at once.
      setToasts((prev) => [...prev.slice(-3), { id, type, title, message }])
      setTimeout(() => dismiss(id), 5000)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function Toasts({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur animate-[toast-in_0.2s_ease-out] ${
              TOAST_STYLES[toast.type] || TOAST_STYLES.info
            }`}
          >
            {(() => {
              const ToastIcon = TOAST_ICONS[toast.type] || TOAST_ICONS.info
              return <ToastIcon className="mt-0.5 h-4 w-4 shrink-0" />
            })()}
            <div className="flex-1">
              {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
              {toast.message && <p className="text-xs opacity-90">{toast.message}</p>}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Close"
              className="opacity-60 transition hover:opacity-100"
            >
              <XLg className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
