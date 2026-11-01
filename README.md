# ⚡ Tangzer

Tangzer est une messagerie instantanée inspirée de Discord, développée avec
**Spring Boot**, **Spring Security / JWT**, **STOMP sur WebSocket** et **React + TypeScript**.

![Tangzer](tangzer-front/public/favicon.jpg)

La feuille de route complète est dans [`docs/ROADMAP.md`](docs/ROADMAP.md).

## 🚀 Lancer avec Docker (recommandé)

```bash
cp .env.example .env   # puis changer JWT_SECRET
docker compose up -d --build
```

Ouvrir ensuite **https://localhost** (le certificat est auto-signé : accepter
l'avertissement du navigateur une première fois).

| Service    | Rôle                                                    |
|------------|---------------------------------------------------------|
| `frontend` | nginx : sert le front React, relaie `/api` et `/ws`     |
| `backend`  | API Spring Boot + WebSocket STOMP (non exposé)          |
| `db`       | PostgreSQL 16 (données dans le volume `db-data`)        |

### Accès depuis un autre appareil du réseau

Ajouter l'IP de la machine dans `.env`, supprimer le dossier `certs/` puis relancer :

```bash
TLS_EXTRA_SAN=IP:192.168.1.20
```

Pour un certificat reconnu sans avertissement, déposer `tangzer.crt` et
`tangzer.key` (par exemple générés avec [mkcert](https://github.com/FiloSottile/mkcert))
dans `certs/`.

> Le HTTPS n'est pas un luxe : les navigateurs n'autorisent le micro et la
> caméra (appels) qu'en HTTPS ou sur `localhost`.

## 🛠️ Lancer en développement

Base de données seule, publiée sur `localhost:5432` grâce à `docker-compose.dev.yml`
(en mode « tout Docker », la base n'est pas exposée sur la machine) :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
```

Si le port 5432 est déjà pris (PostgreSQL installé en local, port réservé par Windows),
mettre `DB_PORT=5433` dans `.env` et lancer le backend avec
`DB_URL=jdbc:postgresql://localhost:5433/tangzer`.

Backend (port 8080, applique les migrations Flyway au démarrage) :

```bash
./mvnw spring-boot:run
```

Frontend (port 5173, relaie `/api` et `/ws` vers le backend) :

```bash
cd tangzer-front
npm install
npm run dev
```

## 🔑 Comptes

Chacun peut créer son compte depuis la page d'inscription. Les comptes de
démonstration suivants sont créés au démarrage (désactivable avec `APP_DEMO_DATA=false`) :

| Utilisateur | Mot de passe |
|---|---|
| admin | admin |
| user | user |
| tanguy | 1234 |
| pigloo | 127845 |

## ⚙️ Configuration

| Variable | Défaut | Rôle |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/tangzer` | Base PostgreSQL (fixé par compose) |
| `DB_USERNAME` / `DB_PASSWORD` | `tangzer` / `tangzer` | Identifiants de la base |
| `APP_DEMO_DATA` | `true` | Crée les comptes de démonstration |
| `JWT_SECRET` | secret de dev | Clé de signature des JWT (32 caractères min.) |
| `JWT_EXPIRATION_MS` | `604800000` (7 j) | Durée de validité d'une session |
| `ALLOWED_ORIGINS` | `*` | Origines autorisées (CORS + WebSocket) |
| `HTTP_PORT` / `HTTPS_PORT` | `80` / `443` | Ports exposés par nginx |
| `TLS_EXTRA_SAN` | vide | IP/DNS à ajouter au certificat auto-signé |

## 🧪 Tests

```bash
./mvnw test                      # backend (H2 en mémoire, aucune base à installer)
cd tangzer-front && npm test     # frontend (Vitest)
```

La CI GitHub Actions lance les tests, le lint, le build du front et le build des images Docker.

## 🧱 Architecture

```text
Navigateur ──HTTPS──▶ nginx (frontend) ──▶ /api  ──▶ Spring Boot (REST)
                                       └─▶ /ws   ──▶ Spring Boot (STOMP)
```

- **Écritures** : REST (`/api/...`), authentifiées par `Authorization: Bearer <jwt>`.
- **Temps réel** : STOMP sur WebSocket (`/ws`), le JWT est envoyé dans la trame `CONNECT`
  et vérifié par `JwtChannelInterceptor`.

```text
src/main/java/net/ent/etnc/chattangzer/
├── config/        configuration (WebSocket, mots de passe, données de démo)
├── controllers/   REST et STOMP
├── exceptions/    erreurs métier → JSON {"message": "..."}
├── models/        entités JPA et DTO
├── repositories/  accès base (Spring Data JPA)
├── security/      Spring Security + JWT
└── services/      logique métier

src/main/resources/db/migration/   schéma SQL versionné (Flyway)

tangzer-front/src/
├── api/         appels REST (client http.ts commun)
├── components/  context/  layout/  pages/  routes/
├── lib/         fonctions pures testées
└── services/    STOMP
```
