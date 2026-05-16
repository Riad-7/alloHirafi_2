# AloHirafi

Plateforme full stack de mise en relation entre clients et artisans au Maroc.

Le projet a ete reconstruit en mode plus realiste avec un vrai backend Laravel API et un vrai frontend React SPA, centre sur l'interaction humaine:

- authentification client / artisan
- recherche d'artisans par ville, metier et note
- recherche "IA" par phrase libre avec interpretation de besoin
- annonces publiees par les artisans
- messagerie client <-> artisan
- devis avec acceptation / refus
- avis et notes
- notifications in-app
- dashboard avec statistiques simples

## Stack

- Backend: Laravel 12 + Sanctum
- Frontend: React 19 + Vite + React Router
- Base locale: SQLite
- API: REST JSON

## Structure

```text
backend/
  app/
    Http/Controllers/Api/
    Models/
    Services/
  database/
    migrations/
    seeders/
  routes/api.php

frontend/
  src/
    components/
    context/
    pages/
    services/
```

## Fonctionnalites implementees

### Backend API

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`
- `GET /api/artisans`
- `GET /api/artisans/{id}`
- `POST /api/search/ai`
- `GET /api/posts`
- `POST /api/posts`
- `GET /api/conversations`
- `POST /api/conversations`
- `POST /api/conversations/{id}/messages`
- `POST /api/quotes`
- `PATCH /api/quotes/{id}/status`
- `POST /api/artisans/{id}/reviews`
- `GET /api/notifications`
- `PATCH /api/notifications/{id}/read`
- `GET /api/dashboard`

### Frontend

- landing page orientee produit
- page login / register
- page recherche avec filtres classiques et prompt libre
- dashboard selon le role
- inbox pour messages et devis

## Base de donnees

Tables principales:

- `users`
- `artisans`
- `posts`
- `post_images`
- `conversations`
- `messages`
- `quotes`
- `reviews`
- `app_notifications`
- `personal_access_tokens`

## Comptes seedes

Apres seed, tu peux tester avec:

- client: `client@alohirafi.ma` / `password`
- artisan: `artisan1@alohirafi.ma` / `password`

## Installation

### 1. Backend

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Le frontend appelle par defaut:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## Important: SQLite + OneDrive

Si ton projet est lance depuis un dossier OneDrive, SQLite peut provoquer un `disk I/O error`.

Dans ce cas:

1. soit tu mets le projet hors OneDrive
2. soit tu utilises MySQL
3. soit tu pointes `DB_DATABASE` vers un fichier local hors OneDrive, par exemple:

```env
DB_CONNECTION=sqlite
DB_DATABASE=C:\Users\riado\AppData\Local\Temp\alohirafi.sqlite
```

La structure Laravel a ete verifiee avec succes sur un fichier SQLite temporaire hors OneDrive.

## Idee produit

AloHirafi ne doit pas ressembler a un simple annuaire. Le but est de creer un flux humain:

1. le client cherche ou decrit son besoin
2. il contacte un artisan
3. la discussion commence
4. l'artisan envoie un devis
5. le client accepte ou refuse
6. la confiance se construit avec l'avis et les notifications

## Suite recommandee

Si tu veux pousser le projet encore plus loin, les prochaines etapes logiques sont:

- upload reel d'images avec Cloudinary
- vraie integration OpenAI API
- policies Laravel
- tests API
- websocket / temps reel pour messagerie
- deploiement Railway + Vercel
