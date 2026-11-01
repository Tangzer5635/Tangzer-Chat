package net.ent.etnc.chattangzer.models.dtos;

/**
 * Enveloppe de tous les événements temps réel envoyés aux clients.
 * Exemple : {"type": "CHANNEL_CREATED", "payload": {...}}
 */
public record RealtimeEvent(String type, Object payload) {
}
