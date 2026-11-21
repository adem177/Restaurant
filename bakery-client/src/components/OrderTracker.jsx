import { Basket, Check, CheckCircleFill, Fire, Inbox, XCircleFill } from 'react-bootstrap-icons'
import { useLanguage } from '../context/LanguageContext'

const STEP_ICONS = {
  pending: Inbox,
  confirmed: Fire,
  ready: Basket,
  completed: CheckCircleFill,
}

/**
 * Labeled live-tracking timeline for an order.
 *
 * `status` is one of pending / confirmed / ready / completed (or cancelled).
 * For delivery orders the final step reads "Delivered" instead of "Completed".
 * When `live` is true a subtle pulsing "auto-updating" badge is shown.
 */
export default function OrderTracker({ status, type, live = false }) {
  const { t } = useLanguage()
  const track = t.account.tracking
  const steps = ['pending', 'confirmed', 'ready', 'completed']

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
        <XCircleFill className="h-4 w-4 shrink-0" />
        {track.cancelled}
      </div>
    )
  }

  const currentIndex = Math.max(0, steps.indexOf(status))

  return (
    <div className="rounded-xl border border-ink/10 bg-surface/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-ink/70">
          {track.title}
        </h4>
        {live && (
          <span className="flex items-center gap-1.5 text-[10px] uppercase text-accent">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            {track.live}
          </span>
        )}
      </div>

      <ol>
        {steps.map((step, i) => {
          const done = i < currentIndex
          const current = i === currentIndex
          const isLast = i === steps.length - 1
          const label =
            step === 'completed' && type === 'delivery'
              ? track.steps.delivered
              : track.steps[step]
          const Icon = STEP_ICONS[step]

          return (
            <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
              {!isLast && (
                <span
                  className={`absolute left-[11px] top-6 h-full w-0.5 ${
                    done ? 'bg-accent' : 'bg-ink/10'
                  }`}
                />
              )}
              <span
                className={`relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] ${
                  current
                    ? 'bg-accent text-white ring-4 ring-accent/20'
                    : done
                      ? 'bg-accent/20 text-accent'
                      : 'bg-ink/10 text-ink/40'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <div className="pt-0.5">
                <p
                  className={`text-sm ${
                    current
                      ? 'font-semibold text-ink'
                      : done
                        ? 'text-ink/70'
                        : 'text-ink/40'
                  }`}
                >
                  {label}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
