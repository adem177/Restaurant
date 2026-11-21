import { Link } from 'react-router-dom'
import { Facebook, X, Telephone, Instagram } from 'react-bootstrap-icons'
import { useLanguage } from '../context/LanguageContext'
import Logo from './Logo'

const SOCIALS = [
  { Icon: Facebook, label: 'Facebook' },
  { Icon: X, label: 'X' },
  { Icon: Telephone, label: 'Téléphone' },
  { Icon: Instagram, label: 'Instagram' },
]

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-night pt-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-center gap-3 pb-10">
          <Logo
            iconClass="h-7 w-7"
            textClass="text-lg"
            titleClass="text-on-night"
          />
          <span className="mx-2 text-on-night/40">|</span>
          <span className="text-sm text-on-night/60">{t.footer.follow}</span>
          <div className="flex gap-2">
            {SOCIALS.map(({ Icon, label }) => (
              <span
                key={label}
                aria-label={label}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-hover"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 border-t border-on-night/15 py-10 md:grid-cols-2">
          <div>
            <h4 className="font-display mb-4 text-lg font-semibold text-on-night">
              {t.footer.explore}
            </h4>
            <ul className="space-y-2 text-sm text-on-night/60">
              <li><Link to="/" className="transition hover:text-accent">{t.nav.home}</Link></li>
              <li><Link to="/menu" className="transition hover:text-accent">{t.nav.menu}</Link></li>
              <li><Link to="/reservation" className="transition hover:text-accent">{t.nav.reservation}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display mb-4 text-lg font-semibold text-on-night">
              {t.footer.contact}
            </h4>
            <p className="text-sm leading-relaxed text-on-night/60">
              Lun – Ven : 7h – 20h
              <br />
              Sam – Dim : 8h – 22h
            </p>
          </div>
        </div>

        <div className="border-t border-on-night/15 py-6 text-center text-xs text-on-night/40">
          © 2026 Happy Plate. {t.footer.rights}
        </div>
      </div>
    </footer>
  )
}
