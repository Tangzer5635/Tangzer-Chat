# Préau

<img src="tangzer-front/public/icon-192.png" alt="" width="64" height="64" align="right" />

Préau est une messagerie instantanée (serveurs, salons, messages privés, appels),
développée avec **Spring Boot**, **Spring Security / JWT**, **STOMP sur WebSocket**
et **React + TypeScript**. L'interface est sobre et accessible : contrastes WCAG AA,
navigation au clavier, formulaires étiquetés.

Le dépôt et le code gardent leur nom d'origine (`Tangzer-Chat`) ; seul le nom affiché change.

La feuille de route complète est dans [`docs/ROADMAP.md`](docs/ROADMAP.md),
et la liste de tout ce qu'il y a à essayer dans [`docs/GUIDE_DE_TEST.md`](docs/GUIDE_DE_TEST.md).

## ✨ Fonctionnalités

- **Comptes** : inscription, connexion, session conservée au rechargement.
- **Serveurs** : création (nom, emoji, couleur, description), serveurs publics ou privés,
  page « Explorer » pour trouver les serveurs publics, serveur public par défaut (« Préau »
  sur une nouvelle installation) rejoint automatiquement par chaque inscrit.
- **Invitations** : liens `/invite/CODE` avec durée de validité et nombre d'utilisations.
- **Salons** : création, renommage, sujet, suppression (style Discord : `mon-salon`).
- **Rôles** : propriétaire, admins, membres ; nommer/retirer un admin, expulser.
- **Temps réel** : messages, arrivées/départs, nouveaux salons, changements de rôle…
  sans recharger la page ; reconnexion automatique.
- **Messages** enregistrés avec historique (on remonte le fil à l'infini), mise en forme
  (`**gras**`, `*italique*`, `__souligné__`, `~~barré~~`, `||spoiler||`, `` `code` ``, blocs de code,
  liens), mentions `@pseudo`, réponses, réactions emoji, modification (flèche ↑) et suppression
  (auteur ou modérateurs), indicateur « en train d'écrire », cartes pour les liens d'invitation.
- **Photos** : bouton +, glisser-déposer ou coller une capture d'écran ; aperçu et progression
  avant l'envoi ; jusqu'à 4 images (PNG, JPEG, GIF, WEBP, 10 Mo) par message ; grille et
  visionneuse plein écran. Le serveur vérifie le vrai type du fichier, pas son nom.
- **Appels audio et vidéo** : salons vocaux (à plusieurs) et appels en message privé avec sonnerie,
  accepter/refuser, micro et casque coupables, indicateur de qui parle, sons d'arrivée/départ,
  **caméra** et **partage d'écran**, grille vidéo, tuile agrandie au clic, plein écran.
  Le son et l'image vont directement d'un navigateur à l'autre (WebRTC), le serveur ne fait
  que mettre en relation. Conçu pour de petits groupes (chacun est relié à chacun).
- **Présence** : en ligne, inactif (automatique après 5 min), ne pas déranger (plus de
  notifications), invisible ; statut personnalisé (« 🎮 En partie ») ; plusieurs onglets gérés ;
  membres hors ligne regroupés et grisés.
- **Personnalisation** : photo de profil (recadrée automatiquement), nom affiché, bio, couleur
  de bannière, carte de profil ; thème clair, sombre ou selon l'appareil, taille du texte,
  mode compact ; notifications du bureau et sons ; choix du micro et de la caméra avec test ;
  changement de mot de passe ; image d'icône pour les serveurs.
- **Mobile** : la navigation s'ouvre en tiroir (☰).
- **Non-lus** : salons en gras, badges de mentions, titre de l'onglet « (3) Préau ».
- **Messages privés** enregistrés, avec les mêmes possibilités que les salons, accusé « Vu »,
  recherche d'utilisateurs, notifications avec aperçu (voir [`docs/MESSAGES_PRIVES.md`](docs/MESSAGES_PRIVES.md)).

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

Les photos envoyées sont stockées dans le volume `uploads`.

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

### Appels entre réseaux différents (TURN)

Sur un même réseau local, les appels se connectent directement. Si des participants
sont sur des réseaux différents (4G, autre box), il faut parfois un relais **TURN** :

```bash
# dans .env
WEBRTC_TURN_URL=turn:IP_DE_LA_MACHINE:3478
TURN_PASSWORD=un-mot-de-passe
```

```bash
docker compose --profile turn up -d
```

Ouvrir les ports `3478` (TCP/UDP) et `49160-49200` (UDP) sur la machine.

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
| `STORAGE_DIR` | `./data/uploads` | Dossier des photos (fixé par compose sur le volume `uploads`) |
| `JWT_SECRET` | secret de dev | Clé de signature des JWT (32 caractères min.) |
| `JWT_EXPIRATION_MS` | `604800000` (7 j) | Durée de validité d'une session |
| `ALLOWED_ORIGINS` | `*` | Origines autorisées (CORS + WebSocket) |
| `HTTP_PORT` / `HTTPS_PORT` | `80` / `443` | Ports exposés par nginx |
| `TLS_EXTRA_SAN` | vide | IP/DNS à ajouter au certificat auto-signé |
| `WEBRTC_STUN_URLS` | STUN public de Google | Serveurs STUN pour les appels |
| `WEBRTC_TURN_URL` / `TURN_USERNAME` / `TURN_PASSWORD` | vide | Relais TURN facultatif |

## 🧪 Tests

```bash
./mvnw test                      # backend (H2 en mémoire, aucune base à installer)
cd tangzer-front && npm test     # frontend (Vitest)
```

La CI GitHub Actions lance les tests, le lint, le build du front et le build des images Docker.

## 🎨 Design

Toutes les couleurs, tailles de texte et espacements sont dans un seul fichier,
[`tangzer-front/src/styles/tokens.css`](tangzer-front/src/styles/tokens.css). Chaque couleur
y est écrite une fois sous la forme `light-dark(clair, sombre)`.
Le test `tokens.test.ts` vérifie que chaque association texte/fond atteint le niveau
WCAG AA dans les deux modes : une couleur trop pâle fait échouer la CI.

- Composants communs dans `tangzer-front/src/components/ui/` et `styles/components.css` :
  fenêtres modales natives (`<dialog>` : focus enfermé, Échap, retour du focus), champs
  avec libellé, aide et erreur reliés (`Field`), onglets au clavier (`Tabs`), alertes
  annoncées (`Alert`), menus qui se ferment avec Échap (`useDismiss`). Icônes Lucide
  (licence ISC) plutôt que des emojis.
- Police : Source Sans 3 (licence OFL), servie avec l'application.
- Charte : prune `#6b2f73` et ocre `#9a5500`, angles droits, filets plutôt qu'ombres.
- Le style s'inspire des principes des systèmes de design publics (lisibilité, sobriété,
  accessibilité) sans en reprendre ni les composants, ni la police, ni aucun emblème.

## 🧱 Architecture

```text
Navigateur ──HTTPS──▶ nginx (frontend) ──▶ /api  ──▶ Spring Boot (REST)
                                       └─▶ /ws   ──▶ Spring Boot (STOMP)
```

- **Écritures** : REST (`/api/...`), authentifiées par `Authorization: Bearer <jwt>`.
- **Temps réel** : STOMP sur WebSocket (`/ws`), le JWT est envoyé dans la trame `CONNECT`
  et vérifié par `JwtChannelInterceptor`. Chaque abonnement est contrôlé par
  `StompSubscriptionGuard` : on n'écoute que les serveurs et salons dont on est membre.

| Destination STOMP | Contenu |
|---|---|
| `/topic/servers/{id}` | événements d'un serveur (salons, membres, paramètres, activité) |
| `/topic/channels/{id}` | événements d'un salon (messages, réactions, saisie) |
| `/user/queue/events` | événements personnels (serveur rejoint, expulsion, nouveau MP) |
| `/topic/presence` | changements de présence (en ligne, inactif, statut personnalisé…) |
| `/topic/users` | profils modifiés (nom affiché, photo) |
| `/user/queue/calls` | signalisation WebRTC des appels (offre, réponse, candidats) |
| `/user/queue/errors` | erreurs d'une action STOMP |

Tous les événements ont la forme `{"type": "CHANNEL_CREATED", "payload": {...}}`.

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
├── lib/         fonctions pures testées (reducers, permissions, formats)
└── realtime/    client STOMP partagé + hooks useSubscription
```
