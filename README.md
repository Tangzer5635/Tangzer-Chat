# ⚡ Tangzer

Tangzer est une application de messagerie instantanée développée avec **Spring Boot**, **Spring Security**, **JWT**, **WebSocket/STOMP** et **React + TypeScript**.

Le projet propose :
- 💬 un chat public en temps réel ;
- 👤 des messages privés entre utilisateurs ;
- #️⃣ des salons dynamiques ;
- 🔐 une authentification JWT ;
- 🔌 une connexion WebSocket/STOMP sécurisée ;
- 🔴 des notifications et compteurs de messages privés non lus ;
- 🕐 l'affichage de l'heure des messages ;
- 🎨 une interface sombre inspirée de Discord.

> Projet pédagogique / démonstration. Les utilisateurs et les membres des salons sont actuellement gérés en mémoire.

![Tangzer](tangzer-front/public/favicon.jpg)

## 🧱 Architecture

```text
┌──────────────────────────── FRONTEND ────────────────────────────┐
│ React + TypeScript + Vite                                       │
│                                                                 │
│ Pages → Chat / DM / Salons                                      │
│ Context → état global des messages et notifications             │
│ Services → REST Auth + STOMP/SockJS                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP / STOMP
                            ▼
┌──────────────────────────── BACKEND ────────────────────────────┐
│ Spring Boot                                                    │
│                                                                 │
│ AuthController → JWT                                           │
│ SecurityConfig → Spring Security                               │
│ JwtAuthFilter → authentification REST                          │
│ JwtChannelInterceptor → authentification STOMP                 │
│ WebSocketConfig → broker / destinations                        │
│ ChatController → chat public + DM                              │
│ RoomController → salons                                        │
│ RoomService → membres en mémoire                               │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Technologies

### Backend
- Java 21
- Spring Boot 4.1.1
- Spring Security
- Spring Web
- Spring WebSocket
- STOMP
- SockJS
- JJWT 0.13.0
- Maven

### Frontend
- React 19
- TypeScript 6
- Vite 8
- React Router 7
- `@stomp/stompjs`
- `sockjs-client`

## 🚀 Lancer le projet

### 1. Backend

Depuis la racine :

```bash
./mvnw spring-boot:run
```

Sous Windows :

```powershell
.\mvnw.cmd spring-boot:run
```

Le backend démarre sur :

```text
http://localhost:8080
```

### 2. Frontend

```bash
cd tangzer-front
npm install
npm run dev
```

Le frontend démarre généralement sur :

```text
http://localhost:5173
```

## 🔑 Comptes de démonstration

Les comptes sont définis dans `CustomUserDetailsService`.

| Utilisateur | Mot de passe |
|---|---|
| admin | admin |
| user | user |
| tanguy | 1234 |

⚠️ Ces identifiants sont uniquement destinés à la démonstration locale. Ils ne doivent pas être utilisés pour une application en production.

## 🔐 Authentification

Le login REST est effectué sur :

```text
POST /auth/login/
```

Le serveur renvoie un JWT. Le frontend le conserve dans `localStorage`.

Lors de la connexion STOMP, le JWT est envoyé dans :

```text
Authorization: Bearer <token>
```

Le `JwtChannelInterceptor` valide le token et place l'utilisateur authentifié dans le `Principal`.

## 💬 Destinations STOMP

### Chat public

```text
Client SEND /app/chat.send
        ↓
ChatController.sendMessage()
        ↓
@SendTo("/topic/public")
        ↓
Tous les abonnés
```

### Message privé

```text
Client SEND /app/chat.direct
        ↓
ChatController.directMessage()
        ↓
convertAndSendToUser()
        ↓
/user/queue/private
        ↓
Destinataire
```

### Salon

```text
JOIN  /app/room/{id}/join
SUB   /topic/room/{id}
SEND  /app/room/{id}/send
```

Le backend vérifie qu'un utilisateur est membre du salon avant d'accepter son message.

## 📁 Organisation principale

```text
src/main/java/net/ent/etnc/chattangzer/
├── controllers/
│   ├── ChatController.java
│   ├── RoomController.java
│   ├── WebSocketConfig.java
│   └── security/AuthController.java
├── models/dtos/
│   ├── ChatMessage.java
│   ├── DirectMessage.java
│   └── MessageType.java
├── security/
│   ├── CustomUserDetailsService.java
│   ├── SecurityConfig.java
│   └── jwt/
│       ├── JwtAuthFilter.java
│       ├── JwtChannelInterceptor.java
│       └── JwtUtils.java
└── services/
    └── RoomService.java

tangzer-front/src/
├── components/
├── context/
├── layout/
├── pages/
├── routes/
├── services/
└── types/
```

## ⚠️ État actuel / limites

Cette version est fonctionnelle pour une démonstration locale.

Pour une version production, il faudrait notamment :
- déplacer le secret JWT dans une variable d'environnement ;
- remplacer les comptes en mémoire par une base de données ;
- persister les messages ;
- persister les salons et leurs membres ;
- gérer l'inscription et les rôles de façon dynamique ;
- remplacer les URLs `localhost` par une configuration d'environnement ;
- restreindre les origines WebSocket au domaine réel ;
- ajouter des tests métier et d'intégration ;
- mettre en place une gestion plus complète de l'expiration / renouvellement JWT.

## 📚 Documentation

- `docs/ARCHITECTURE.md` : architecture et rôle des classes.
- `docs/PRESENTATION_ORALE.md` : préparation pour présenter le projet.
- `docs/GITHUB_CHECKLIST.md` : checklist avant publication GitHub.

## 👨‍💻 Projet

**Tangzer** — application de chat temps réel pédagogique.
