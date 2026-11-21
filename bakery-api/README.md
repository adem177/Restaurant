# Happy Plate — API

API REST du restaurant **Happy Plate** : carte, commandes, réservations, fidélité, avis, promotions et back-office.

- **Laravel 13** · PHP **8.3** · **Sanctum** (tokens personnels) · **SQLite**
- Réponses JSON via les **Ressources Eloquent**
- Rôles : `admin`, `employee` (staff) et `client`

---

## Installation

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
php artisan serve            # http://localhost:8000
```

La base par défaut est SQLite (`DB_CONNECTION=sqlite`), aucun serveur de base de données n'est nécessaire.

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@happyplate.com` | `password` |
| Employé | `employe@happyplate.com` | `password` |

---

## Authentification

Toutes les routes protégées attendent un **Bearer token Sanctum** :

```http
Authorization: Bearer <token>
```

- `POST /api/auth/login` — connexion (un compte désactivé est refusé)
- `GET /api/auth/me` — profil courant
- `POST /api/auth/logout` — révocation du token

Middlewares :

- `auth:sanctum` — utilisateur authentifié
- `staff` — rôle `admin` ou `employee` **et** compte actif
- `admin` — rôle `admin` **et** compte actif

---

## Modules

| Préfixe | Contenu |
|---|---|
| `/api/products`, `/api/categories`, `/api/allergens` | Carte publique, filtres, options, avis |
| `/api/orders` | Création, aperçu de prix, détail |
| `/api/reservations` | Réservation et annulation |
| `/api/auth/*` | Inscription, connexion, profil, historique, fidélité |
| `/api/admin/*` | Dashboard, commandes, réservations, produits, avis, promos (staff) |
| `/api/admin/users` | Gestion des comptes staff (**admin uniquement**) |

La gestion des comptes staff permet de créer, modifier, activer/désactiver et supprimer un compte. Un compte désactivé ne peut plus se connecter et ses tokens sont révoqués. Le dernier admin actif ne peut être ni rétrogradé, ni désactivé, ni supprimé.

Le détail complet des endpoints figure dans `cachier de charge/CAHIER_DE_CHARGE.md` (section 5).

---

## Tests et style

```bash
php artisan test --compact          # PHPUnit — 168 tests
vendor/bin/pint --dirty            # Laravel Pint
```

Les tests utilisent SQLite en mémoire et couvrent l'API publique, le compte client, la fidélité, les commandes, les réservations, les avis, le stock et l'administration.
