package net.ent.etnc.chattangzer.models.entities;

public enum ChannelType {
    /** Salon de discussion écrite d'un serveur. */
    TEXT,
    /** Salon vocal d'un serveur : on y entre pour parler (appel de groupe). */
    VOICE,
    /** Conversation privée entre deux utilisateurs (sans serveur). */
    DM
}
