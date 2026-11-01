package net.ent.etnc.chattangzer.models.dtos;

/** Nombre de messages non lus d'un salon (serverId null pour un message privé). */
public record UnreadDto(Long channelId, Long serverId, long count) {
}
