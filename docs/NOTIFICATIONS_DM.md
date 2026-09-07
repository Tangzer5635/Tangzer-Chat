# Notifications DM — écriture, distribution et lecture

Les messages privés disposent maintenant de trois informations côté interface :

- `✓` : message envoyé par le client ;
- `✓✓` gris : message distribué au destinataire ;
- `✓✓` bleu : message lu ;
- `X est en train d’écrire…` : indicateur de saisie.

## Flux

```text
Tanguy écrit
   ↓
/app/chat.typing
   ↓
ChatController.typing()
   ↓
/user/queue/private-typing
   ↓
Admin voit « Tanguy est en train d’écrire… »

Tanguy envoie
   ↓
/app/chat.direct
   ↓
ChatController.directMessage()
   ├── message → /user/queue/private
   └── DELIVERED → /user/queue/private-status
                         ↓
                     Tanguy voit ✓✓

Admin ouvre la conversation
   ↓
/app/chat.read
   ↓
ChatController.read()
   ↓
/user/queue/private-status
   ↓
Tanguy voit ✓✓ bleu = LU
```

Le système reste en mémoire / temps réel : les statuts ne sont pas persistés en base de données.
