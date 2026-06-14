# SUPCONTENT / SUPMOVIES

SUPCONTENT, également présenté sous le nom **SUPMOVIES**, est une plateforme
sociale de découverte de films. Elle permet de rechercher des films, gérer une
bibliothèque, publier des critiques, créer des listes, suivre d'autres membres
et échanger par messagerie privée.

Le projet comprend une application web, une application mobile, une API REST
et une base de données PostgreSQL.

## Fonctionnalités

- Inscription et connexion sécurisées avec JWT.
- Authentification OAuth avec Google, GitHub et Facebook.
- Réinitialisation du mot de passe par e-mail.
- Recherche et découverte de films avec l'API TMDB.
- Films populaires, tendances, mieux notés et actuellement au cinéma.
- Bibliothèque personnelle : à voir, en cours, terminé ou abandonné.
- Listes de films publiques ou privées.
- Critiques, notes sur 5, commentaires et mentions « J'aime ».
- Profils, abonnements et fil d'activité.
- Messagerie privée en temps réel avec Socket.IO.
- Notifications dans l'application et par e-mail.
- Signalement, modération et espace d'administration.
- Export et suppression des données personnelles.
- Thème et préférences de notification.

## Technologies

| Partie | Technologies |
| --- | --- |
| API | Node.js, Express 5, Passport, JWT, Socket.IO |
| Client web | React 19, Vite, React Router, Tailwind CSS, Recharts |
| Application mobile | React Native, Expo, Expo Router |
| Base de données | PostgreSQL 16 |
| API externe | TMDB |
| Infrastructure | Docker, Docker Compose |
| E-mails | Nodemailer, SMTP |

## Architecture

```text
SUPCONTENT/
|-- backend/                 # API REST, WebSocket et logique métier
|   |-- src/
|   |   |-- config/          # Base de données, Passport et TMDB
|   |   |-- controllers/     # Contrôleurs HTTP
|   |   |-- middlewares/     # Authentification, rôles et validation
|   |   |-- models/          # Accès aux données
|   |   |-- routes/          # Routes de l'API
|   |   |-- services/        # Services métier
|   |   `-- server.js        # Point d'entrée
|   `-- uploads/             # Avatars téléversés
|-- database/init/init.sql   # Initialisation de PostgreSQL
|-- docker/                  # Dockerfiles
|-- mobile/                  # Application React Native / Expo
|-- web-client/              # Application React / Vite
|-- docker-compose.yml       # Orchestration des services
`-- .env.example             # Modèle de configuration
```

## Prérequis

Avec Docker :

- Git ;
- Docker Desktop avec Docker Compose.

Sans Docker :

- Node.js 20 ou une version compatible ;
- npm ;
- PostgreSQL 16 ;
- Expo Go ou un émulateur Android/iOS pour l'application mobile ;
- une clé d'API [TMDB](https://www.themoviedb.org/settings/api).

## Installation avec Docker

### 1. Cloner le dépôt

```bash
git clone https://github.com/sfdhafsa/SupContentProject.git
cd SupContentProject
```

### 2. Configurer l'environnement

Sous Windows PowerShell :

```powershell
Copy-Item .env.example .env
```

Sous Linux ou macOS :

```bash
cp .env.example .env
```

Compléter les valeurs sensibles dans `.env` :

```dotenv
DB_PASSWORD=mot_de_passe_postgresql
JWT_SECRET=secret_jwt_long_et_aleatoire
TMDB_API_KEY=cle_api_tmdb
ADMIN_PASSWORD=mot_de_passe_administrateur
PGADMIN_DEFAULT_PASSWORD=mot_de_passe_pgadmin
```

Les variables OAuth et SMTP sont nécessaires pour les connexions sociales et
les e-mails :

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Créer aussi les fichiers suivants, contenant chacun uniquement le mot de passe
correspondant :

```text
secrets/db_password.txt
secrets/postgres_password.txt
```

Le fichier `.env` et le dossier `secrets/` ne doivent jamais être publiés.

### 3. Démarrer les services

```bash
docker compose up --build
```

| Service | Adresse |
| --- | --- |
| Client web | http://localhost:5173 |
| API | http://localhost:3000 |
| État de l'API | http://localhost:3000/api/health |
| pgAdmin | http://localhost:5050 |
| PostgreSQL | `localhost:5432` |

Arrêter les services :

```bash
docker compose down
```

Supprimer aussi les données PostgreSQL locales :

```bash
docker compose down -v
```

> Attention : cette dernière commande supprime définitivement le volume de la
> base de données locale.

## Installation manuelle

### Backend

```bash
cd backend
npm install
npm run dev
```

L'API démarre par défaut sur `http://localhost:3000`.

### Client web

Dans un second terminal :

```bash
cd web-client
npm install
npm run dev
```

Le site est accessible sur `http://localhost:5173`.

### Application mobile

Créer le fichier de configuration :

```powershell
Copy-Item mobile/.env.example mobile/.env
```

Pour un émulateur ou le navigateur local :

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

Pour un téléphone physique, remplacer `localhost` par l'adresse IP locale de
l'ordinateur ou utiliser le tunnel fourni par le projet.

```bash
cd mobile
npm install
npm start
```

Autres commandes Expo :

```bash
npm run android
npm run ios
npm run web
npm run start:tunnel
```

## Scripts

### Backend

| Commande | Description |
| --- | --- |
| `npm start` | Démarre l'API avec Node.js |
| `npm run dev` | Démarre l'API avec rechargement automatique |

### Client web

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance le serveur Vite |
| `npm run build` | Génère la version de production |
| `npm run preview` | Prévisualise la version de production |
| `npm run lint` | Analyse le code avec ESLint |

## Principales routes de l'API

| Préfixe | Domaine |
| --- | --- |
| `/api/auth` | Inscription, connexion, OAuth et mot de passe |
| `/api/users` | Profils et préférences |
| `/api/movies` | Recherche et découverte de films |
| `/api/reviews` | Critiques, commentaires et mentions « J'aime » |
| `/api/library` | Bibliothèque personnelle |
| `/api/lists` | Listes personnalisées |
| `/api/social` | Abonnements, fil, messages et notifications |
| `/api/reports` | Signalements |
| `/api/moderation` | Modération |
| `/api/admin` | Administration |

Les routes privées nécessitent un jeton JWT :

```http
Authorization: Bearer <token>
```

## Base de données

Le script `database/init/init.sql` est exécuté à la première création du
conteneur PostgreSQL. Il initialise notamment :

- les utilisateurs, rôles et comptes OAuth ;
- les films et catégories ;
- les bibliothèques et listes personnalisées ;
- les critiques, commentaires et mentions « J'aime » ;
- les abonnements, notifications et messages ;
- les signalements et jetons de réinitialisation.

Le compte administrateur initial est créé au démarrage du backend avec
`ADMIN_USERNAME`, `ADMIN_EMAIL` et `ADMIN_PASSWORD`.

## Sécurité

- Ne jamais versionner `.env`, les secrets Docker ou les mots de passe.
- Utiliser un `JWT_SECRET` long, unique et aléatoire.
- En production, utiliser HTTPS et restreindre les origines CORS.
- Configurer les URL OAuth avec le domaine exact du déploiement.
- Utiliser un mot de passe d'application SMTP.
- Remplacer toutes les valeurs d'exemple avant le déploiement.

## Équipe du projet

| Nom du membre | Compte GitHub |
| --- | --- |
| Hafsa SIF-EDDINE | [@sfdhafsa](https://github.com/sfdhafsa) |
| Ikram Lotfi | [@Lotfi207](https://github.com/Lotfi207) |
| Mehdi Fertoune | [@Mehdi07-hub](https://github.com/Mehdi07-hub) |
| Oussama Elazizi | [@Oelaz](https://github.com/Oelaz) |

## Contribution

1. Créer une branche depuis `main`.
2. Utiliser un nom explicite, par exemple `feature/messagerie-mobile`.
3. Effectuer des commits courts et descriptifs.
4. Vérifier le lint et le build avant de pousser les changements.
5. Ouvrir une pull request avec une description claire.

## Licence

Aucune licence publique n'est actuellement définie pour ce dépôt. Tous droits
réservés à l'équipe SUPCONTENT.
