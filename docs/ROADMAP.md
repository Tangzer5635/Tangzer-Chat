# Feuille de route Tangzer

Chaque phase est livrée dans sa propre branche et sa propre pull request.
Les PR sont empilées : chacune part de la précédente et doit être fusionnée dans l'ordre.

| # | Phase | Branche |
|---|---|---|
| 0 | Fondations : nettoyage, configuration, Docker, CI | `claude/gracious-tesla-xs65x8` |
| 1 | Comptes en base (PostgreSQL, inscription, session persistante) | `claude/phase-1-comptes` |
| 2 | Serveurs, salons, invitations, serveurs publics | `claude/phase-2-serveurs` |
| 3 | Messages persistés, historique, édition, mise en forme | `claude/phase-3-messages` |
| 4 | Messages privés | `claude/phase-4-mp` |
| 5 | Photos (upload, aperçu, stockage) | `claude/phase-5-photos` |
| 6 | Présence et statut | `claude/phase-6-presence` |
| 7 | Appels audio (WebRTC, salons vocaux) | `claude/phase-7-appels-audio` |
| 8 | Appels vidéo et partage d'écran | `claude/phase-8-appels-video` |
| 9 | Personnalisation (profil, avatar, thèmes) | `claude/phase-9-personnalisation` |

## Principes

- On garde la stack : Spring Boot, STOMP, React, Vite.
- Écritures en REST, réception en temps réel via STOMP.
- Logique métier testée (JUnit côté back, Vitest côté front).
- Tout tourne avec `docker compose up`.
