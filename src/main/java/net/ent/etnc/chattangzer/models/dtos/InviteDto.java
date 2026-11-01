package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.Invite;

import java.time.Instant;

public record InviteDto(String code, Long serverId, Instant expiresAt, Integer maxUses, int uses) {

    public static InviteDto from(Invite invite) {
        return new InviteDto(
                invite.getCode(),
                invite.getServer().getId(),
                invite.getExpiresAt(),
                invite.getMaxUses(),
                invite.getUses()
        );
    }
}
