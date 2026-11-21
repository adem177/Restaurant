# 🍽️ Happy Plate

> Site vitrine, réservation et commande en ligne d'un restaurant international — API Laravel + SPA React dans un seul dépôt.

![PHP](https://img.shields.io/badge/PHP-8.3+-777BB4?logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-168_passing-2ea44f)
![Langues](https://img.shields.io/badge/langues-FR_·_EN_·_AR-c05621)

---

## 📑 Sommaire

- [Le problème résolu](#-le-problème-résolu)
- [Démarrage rapide](#-démarrage-rapide)
- [Comptes de démonstration](#-comptes-de-démonstration)
- [Stack technique](#-stack-technique)
- [Structure du projet](#-structure-du-projet)
- [Fonctionnalités](#-fonctionnalités)
- [Tests](#-tests)
- [CI (GitHub Actions)](#-ci-github-actions)
- [Documentation](#-documentation)

---

## 🎯 Le problème résolu

Un restaurant indépendant veut vendre en ligne sans multiplier les outils : présenter sa carte, prendre des réservations, gérer les commandes à emporter ou en livraison, fidéliser ses clients et suivre son activité depuis un seul back-office.

Happy Plate réunit tout cela dans une application unique :

- une **carte vivante** pilotée par la base de données (42 produits, options, allergènes, stock) ;
- un **parcours client complet** — réservation, panier, commande, suivi en temps réel, fidélité ;
- un **back-office** pour les commandes, réservations, produits, avis, promotions et comptes staff ;
- le tout en **français, anglais et arabe (RTL)**, avec thème **clair ou sombre**.

---

## 🚀 Démarrage rapide

```bash
git clone https://github.com/adem177/Restaurant.git
cd Restaurant

# ── 1. API Laravel (:8000) ──────────────────────────────
cd bakery-api
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite     # Windows : type nul > database\database.sqlite
php artisan migrate:fresh --seed
php artisan serve

# ── 2. Client React (:5173) — dans un second terminal ───
cd bakery-client
npm install
npm run dev
```

> **Prérequis** : PHP 8.3+ avec `pdo_sqlite`, Composer 2, Node.js 20+ et npm.

Ensuite : ouvre **http://localhost:5173**, crée un compte client via `/register`, puis commande ou réserve. Vite proxifie automatiquement `/api` vers l'API locale, les deux serveurs doivent donc tourner en même temps.

Back-office : **http://localhost:5173/admin/login**

---

## 🔐 Comptes de démonstration

Créés automatiquement par `php artisan migrate:fresh --seed` :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@happyplate.com` | `password` |
| Employé | `employe@happyplate.com` | `password` |

L'admin accède à tout le back-office, y compris la gestion des comptes staff (`/admin/users`) : création, modification, activation/désactivation et suppression, avec protection du dernier admin actif. Aucun compte client n'est pré-créé : utilise `/register`.

---

## ⚙️ Stack technique

| Côté | Technologie | Version |
|---|---|---|
| **Backend** | PHP | `^8.3` |
| | Laravel | `^13.17` |
| | Laravel Sanctum (tokens) | `^4.3` |
| | SQLite | — |
| | PHPUnit · Laravel Pint | `^12.5` · `^1.27` |
| **Frontend** | React | `^19.2` |
| | React Router | `^7.18` |
| | Vite | `^8.3` |
| | Tailwind CSS | `^4.3` |
| | Axios · react-bootstrap-icons · qrcode.react | `^1.20` · `^1.11` · `^4.2` |
| | oxlint | `^1.81` |

**Design** : tokens CSS clair/sombre (`data-theme`), accent orange `#c05621`, Playfair Display (titres), Poppins (texte), Cairo (arabe).

---

## 📁 Structure du projet

```
Restaurant/
├── bakery-api/                  API Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/    Public, Auth, Admin
│   │   ├── Http/Middleware/         staff, admin
│   │   ├── Http/Resources/          Réponses JSON
│   │   └── Models/                  User, Product, Order…
│   ├── database/
│   │   ├── migrations/              29 migrations
│   │   └── seeders/                 Carte, options, promos, démo
│   ├── routes/api.php               Toutes les routes /api
│   └── tests/                       168 tests (Feature + Unit)
│
├── bakery-client/               SPA React
│   ├── src/
│   │   ├── pages/                   Public + admin/ + client/
│   │   ├── components/              Navbar, panier, recherche…
│   │   ├── context/                 Langue, thème, panier, auth…
│   │   ├── hooks/useSeo.js
│   │   └── utils/
│   └── public/                      PWA, sitemap, robots.txt
│
└── cachier de charge/           Cahier des charges (local, ignoré)
```

---

## ✨ Fonctionnalités

**Côté client**

- ✅ Carte de **42 produits** en 5 catégories (entrées, plats, desserts, boissons, formules) avec recherche et filtres
- ✅ Filtres végétarien, sans gluten, allergènes à éviter, plats épuisés
- ✅ Fiche produit avec **options** (taille, cuisson, suppléments, formules) et prix calculé en direct
- ✅ Panier persistant, **retrait ou livraison**, code promo et remise par points
- ✅ **Paiement simulé** — aucun vrai débit, la commande passe en `pending`
- ✅ **Réservation** avec confirmation par email, compte requis
- ✅ **Suivi de commande** en temps réel (timeline + toasts automatiques)
- ✅ **Fidélité** : 100 points = 5 DT, plafonnés à 20 % du sous-total
- ✅ **Menu QR** par table (`/qr?table=N`) et générateur de QR
- ✅ Avis produits modérés, un avis par client et par produit
- ✅ **FR / EN / AR** avec bascule RTL
- ✅ **Thème clair/sombre** persistant
- ✅ **PWA installable** et page hors-ligne, SEO (sitemap, robots, JSON-LD)

**Côté staff**

- ✅ Dashboard : chiffre d'affaires, commandes, panier moyen, top produits
- ✅ Commandes : changement de statut, retour du stock à l'annulation
- ✅ Réservations : confirmer / annuler
- ✅ Produits : CRUD complet (prix, catégorie, traductions, stock, images)
- ✅ Avis : modération · Promotions : CRUD
- ✅ **Comptes staff** : création, édition, activation/désactivation, suppression, garde-fous sur le dernier admin

---

## 🧪 Tests

```bash
# API — 168 tests, 537 assertions
cd bakery-api
php artisan test --compact

# Style PHP
vendor/bin/pint --dirty

# Client
cd bakery-client
npm run build
npm run lint
```

Les tests couvrent l'API publique, l'authentification, le compte client, la fidélité, les commandes, les réservations, les avis, le stock et l'administration (dont la gestion des comptes staff).

---

## 🔄 CI (GitHub Actions)

Deux workflows existent, un par application :

- **API** : Pint + PHPUnit (SQLite en mémoire)
- **Client** : `npm ci` + `npm run build` + artefact `dist`

⚠️ Depuis le passage au dépôt unique, ils se trouvent dans `bakery-api/.github/workflows/ci.yml` et `bakery-client/.github/workflows/ci.yml`. GitHub ne lit que `.github/workflows/` **à la racine** : ils doivent y être déplacés avec un `working-directory` adapté pour s'exécuter.

---

## 📚 Documentation

Le cahier des charges complet (périmètre, architecture, API, modèle de données, limitations) est dans `cachier de charge/CAHIER_DE_CHARGE.md`. Ce dossier est **local** et n'est pas versionné.

Documentation par application : [`bakery-api/README.md`](bakery-api/README.md) · [`bakery-client/README.md`](bakery-client/README.md)
