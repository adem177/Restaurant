# Happy Plate — Client

SPA du restaurant **Happy Plate** : site vitrine, carte, panier, commande, réservation, espace client et back-office.

- **React 19** · **React Router 7** · **Vite 8**
- **Tailwind CSS 4** (tokens CSS clair/sombre)
- **Axios** · **react-bootstrap-icons** · **qrcode.react**
- Lint : **oxlint**

---

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
```

L'API doit tourner en parallèle sur `http://127.0.0.1:8000` : Vite proxifie `/api` vers cette adresse (voir `vite.config.js`).

### Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `VITE_API_URL` | `/api` | URL complète de l'API en production |

```bash
# .env
VITE_API_URL=https://api.happyplate.com/api
```

---

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement (HMR) |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualisation du build |
| `npm run lint` | Analyse oxlint |

---

## Structure

```
src/
├── api/client.js        Instance Axios (token admin ou client selon l'URL)
├── components/          Navbar, panier, produits, recherche, toasts…
├── context/             Language, Theme, Cart, Auth, ClientAuth, Toast
├── hooks/useSeo.js      Titre, description et Open Graph par page
├── pages/               Pages publiques
│   ├── admin/           Back-office (/admin)
│   └── client/          Connexion et espace client
└── utils/               Images, traductions, animation panier
```

### Routes

| Route | Accès |
|---|---|
| `/`, `/menu`, `/cart`, `/checkout` | Public |
| `/reservation`, `/account` | Compte client requis |
| `/login`, `/register` | Public |
| `/qr`, `/qr-generator` | Autonome |
| `/admin/login` | Public |
| `/admin/*` | Staff ; `/admin/users` réservé aux admins |

Les pages lourdes (checkout, compte, admin) sont **chargées à la demande** via `React.lazy`.

---

## Thème, langues et PWA

- **Thème clair/sombre** : bouton flottant en bas à gauche de l'accueil, choix persisté dans `happyplate_theme`, appliqué par `data-theme` sur `<html>`.
- **FR / EN / AR** : bascule de langue avec passage en **RTL** et police Cairo.
- **PWA** : `manifest.webmanifest` + service worker `sw.js` + page `offline.html`.
- **SEO** : `robots.txt`, `sitemap.xml`, JSON-LD Restaurant et hook `useSeo`.
