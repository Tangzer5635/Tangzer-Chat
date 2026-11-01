package net.ent.etnc.chattangzer.models.entities;

/**
 * Statut d'un utilisateur.
 * Les quatre premiers se choisissent ; OFFLINE est calculé (aucune connexion ouverte).
 */
public enum UserStatus {
    /** En ligne. */
    ONLINE,
    /** Inactif : choisi, ou automatique après quelques minutes sans activité. */
    IDLE,
    /** Ne pas déranger : pas de notifications. */
    DND,
    /** Invisible : connecté mais vu « hors ligne » par les autres. */
    INVISIBLE,
    /** Hors ligne (jamais choisi, toujours calculé). */
    OFFLINE
}
