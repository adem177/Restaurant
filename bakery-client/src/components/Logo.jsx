import { ForkKnife } from 'react-bootstrap-icons'

/**
 * Real "Happy Plate" badge (circular emblem exported from the brand artwork),
 * cropped to a circle with transparent corners. Loaded as <img> with a srcset
 * so the small navbar/QR renderings only fetch the 128 px file.
 */
const BADGE_SRC = '/logo-badge-128.png'
const BADGE_SRCSET = '/logo-badge-128.png 128w, /logo-badge-256.png 256w'

function BadgeIcon({ className }) {
  return (
    <img
      src={BADGE_SRC}
      srcSet={BADGE_SRCSET}
      sizes="28px"
      width={128}
      height={128}
      alt="Happy Plate"
      className={`${className} shrink-0 rounded-full object-cover`}
      decoding="async"
    />
  )
}

/**
 * Logo réutilisable « HappyPlate ».
 * - iconClass / textClass : classes Tailwind pour la taille de l'icône et du texte
 * - variant : 'utensils' (icône Bootstrap Icons par défaut) ou 'badge' (emblème rond PNG)
 * - stacked : icône au-dessus du texte (layout vertical, centré)
 * - subtitle / subtitleClass : bloc titre + sous-titre avec icône à gauche
 * - className : classes supplémentaires sur le conteneur flex
 */
export default function Logo({
  iconClass = 'h-7 w-7',
  textClass = 'text-xl font-bold',
  variant = 'utensils',
  stacked = false,
  subtitle = null,
  subtitleClass = 'text-[11px] text-ink/50',
  titleClass = 'text-ink',
  className = '',
}) {
  const icon =
    variant === 'badge' ? (
      <BadgeIcon className={iconClass} />
    ) : (
      <ForkKnife className={`${iconClass} text-accent`} />
    )
  const title = (
    <span className={`font-display ${titleClass} ${textClass}`}>
      Happy<span className="text-accent">Plate</span>
    </span>
  )

  // Icône à gauche d'un bloc titre (+ sous-titre éventuel)
  if (subtitle) {
    return (
      <span className={`flex items-center gap-2 ${className}`}>
        {icon}
        <span className="flex flex-col">
          {title}
          <span className={subtitleClass}>{subtitle}</span>
        </span>
      </span>
    )
  }

  // Icône au-dessus du titre (layout vertical)
  if (stacked) {
    return (
      <span className={`flex flex-col items-center gap-1 ${className}`}>
        {icon}
        {title}
      </span>
    )
  }

  // Ligne horizontale : icône + titre
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {icon}
      {title}
    </span>
  )
}
