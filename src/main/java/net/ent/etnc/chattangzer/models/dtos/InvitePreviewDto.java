package net.ent.etnc.chattangzer.models.dtos;

import java.time.Instant;

/** Ce qu'on affiche sur la page /invite/{code} avant d'accepter. */
public record InvitePreviewDto(
        String code,
        DiscoverServerDto server,
        UserDto inviter,
        Instant expiresAt,
        boolean valid
) {
}
