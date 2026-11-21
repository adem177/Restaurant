import { Star, StarFill } from 'react-bootstrap-icons'

/**
 * Read-only star rating.
 * @param {{ value?: number|null, count?: number, size?: string }} props
 */
export default function Stars({ value, count, size = 'text-sm' }) {
  if (!value) {
    return (
      <span className={`text-ink/30 ${size}`}>
        {count > 0 ? `— ${count}` : ''}
      </span>
    )
  }
  const rounded = Math.round(value)
  return (
    <span className={`inline-flex items-center gap-1 ${size}`}>
      <span className="inline-flex tracking-tighter text-amber-600">
        {Array.from({ length: rounded }, (_, i) => (
          <StarFill key={`f${i}`} className="h-[1em] w-[1em]" />
        ))}
        <span className="inline-flex text-ink/25">
          {Array.from({ length: 5 - rounded }, (_, i) => (
            <Star key={`e${i}`} className="h-[1em] w-[1em]" />
          ))}
        </span>
      </span>
      <span className="text-ink/50">
        {value.toFixed(1)}
        {typeof count === 'number' && ` (${count})`}
      </span>
    </span>
  )
}
