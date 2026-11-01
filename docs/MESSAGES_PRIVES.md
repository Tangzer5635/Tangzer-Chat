# Messages privés

Une conversation privée est un **salon de type `DM`** sans serveur, réservé à deux
utilisateurs (`dm_user1_id < dm_user2_id`, une seule conversation par paire).
Tout le moteur des salons s'applique donc aussi aux MP : historique, réponses,
réactions, modification, suppression, mise en forme, « en train d'écrire ».

## Flux

```text
Tanguy ouvre la conversation
   POST /api/dms {"userId": 1}  →  {channelId, otherUser, lastMessage, unreadCount, …}

Tanguy écrit
   POST /api/channels/{channelId}/messages
      ├── /topic/channels/{channelId}   MESSAGE_CREATED  (les deux s'ils regardent)
      └── /user/queue/events            DM_ACTIVITY      (les deux participants :
                                                          liste des MP, badge, toast)

Admin lit la conversation
   POST /api/channels/{channelId}/read {"messageId"}
      └── /topic/channels/{channelId}   READ  → Tanguy voit « ✓✓ Vu »
```

## Règles

- Seuls les deux participants peuvent lire, écrire et s'abonner (`AccessService`).
- Personne ne modère une conversation privée : chacun ne supprime que ses messages.
- On ne peut pas s'écrire à soi-même.
- Les non-lus des MP s'additionnent sur l'icône « Messages privés » du rail
  et dans le titre de l'onglet.
