package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.ChannelType;

/** Création ou modification d'un salon (en modification, null = inchangé). */
public record ChannelRequest(String name, String topic, ChannelType type) {
}
