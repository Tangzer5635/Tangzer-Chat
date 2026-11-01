package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.UserStatus;

/** Présence d'un utilisateur telle que les autres la voient. */
public record PresenceDto(Long userId, UserStatus status, String customStatus) {
}
