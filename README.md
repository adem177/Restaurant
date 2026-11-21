# Happy Plate

> « Le goût du monde, dans votre assiette » — site vitrine, réservation et commande en ligne d'un restaurant international.

Application **full-stack** répartie en deux projets dans un même dépôt :

| Dossier | Rôle | Stack |
|---|---|---|
| [`bakery-api/`](bakery-api/) | API REST, authentification, back-office | **Laravel 13** · PHP 8.3 · Sanctum · SQLite |
| [`bakery-client/`](bakery-client/) | Site public + espace client + admin | **React 19** · Vite 8 · Tailwind CSS 4 |

- **Langues** : français, anglais, arabe (RTL)
- **Thème** : clair par défaut, mode sombre persistant
- **Paiement** : simulé (aucune transaction réelle)

---

## Structure du dépôt

```
restaurant/
├── bakery-api/          API Laravel (backend)
│   ├── app/             Contrôleurs, modèles, middlewares, ressources
│   ├── database/        Migrations, seeders, base SQLite locale
│   ├── routes/api.php   Toutes les routes /api
│   └── tests/           Tests PHPUnit (Feature + Unit)
├── bakery-client/       SPA React (frontend)
│   ├── src/pages/        Pages publiques, client et admin
│   ├── src/components/  Composants réutilisables
│   ├── src/context/     État global (panier, auth, langue, thème)
│   └── public/          PWA, SEO, icônes
└── cachier de charge/   Cahier des charges (local, non versionné)
```

---

## Prérequis

- **PHP** ≥ 8.3 avec l'extension `pdo_sqlite`
- **Composer** 2
- **Node.js** ≥ 20 et **npm**
- (optionnel) **Docker** pour l'image de l'API

---

## Installation

### 1. API — `bakery-api`

```bash
cd bakery-api
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite      # si le fichier n'existe pas
php artisan migrate:fresh --seed    # crée le schéma et les données de démo
php artisan serve                   # http://localhost:8000
```

> Sous Windows (cmd/PowerShell), remplacez `cp` par `copy` et `touch` par `type nul > database\database.sqlite`.

### 2. Frontend — `bakery-client`

```bash
cd bakery-client
npm install
npm run dev                          # http://localhost:5173
```

En développement, Vite **proxifie `/api`** vers `http://127.0.0.1:8000` : les deux serveurs doivent tourner en même temps.

En production, définissez `VITE_API_URL` avec l'URL complète de l'API :

```bash
# bakery-client/.env
VITE_API_URL=https://api.happyplate.com/api
```

---

## Accès

| URL | Description |
|---|---|
| http://localhost:5173 | Site public |
| http://localhost:5173/menu | Carte et filtres |
| http://localhost:5173/account | Espace client (compte requis) |
| http://localhost:5173/qr?table=1 | Menu QR de table |
| http://localhost:5173/admin/login | Back-office (staff) |
| http://localhost:8000/api | API REST |

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@happyplate.com` | `password` |
| Employé | `employe@happyplate.com` | `password` |

Les comptes **clients** se créent depuis `/register`. Depuis le back-office, un admin peut créer, modifier, désactiver ou supprimer les comptes staff dans **Comptes** (`/admin/users`).

---

## Fonctionnalités principales

- **Carte** : catégories, recherche, filtres végétarien / sans gluten / allergènes, badges stock.
- **Options produits** : taille, cuisson, suppléments, formules — prix calculés en direct.
- **Commande** : retrait ou livraison, code promo, remise par points, suivi en temps réel (polling + toasts).
- **Réservation** : compte requis, confirmation par email, annulation.
- **Fidélité** : 100 points = 5 DT, plafonnés à 20 % du sous-total.
- **Menu QR** : page autonome par table, code QR généré.
- **Avis** : un avis par produit, modération côté admin.
- **Back-office** : dashboard, commandes, réservations, produits, avis, promotions, comptes staff.

---

## Qualité et tests

```bash
# API — 168 tests
cd bakery-api
php artisan test --compact
vendor/bin/pint --dirty            # style PHP

# Client
cd bakery-client
npm run build
npm run lint
```

Les workflows GitHub Actions sont encore placés dans chaque sous-projet ; depuis le passage au dépôt unique, ils ne sont plus exécutés par GitHub (à déplacer dans `.github/workflows/` à la racine).

---

## Documentation

Le cahier des charges complet (périmètre, architecture, API, modèle de données) se trouve dans `cachier de charge/CAHIER_DE_CHARGE.md`. Ce dossier reste **local** et n'est pas versionné.
