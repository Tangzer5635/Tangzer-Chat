package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.MemberRole;

import java.util.List;

/** Serveur tel que le voit l'un de ses membres (avec son rôle et les salons). */
public record ServerDto(
        Long id,
        String name,
        String description,
        String icon,
        String iconUrl,
        String color,
        boolean isPublic,
        boolean isDefault,
        Long ownerId,
        long memberCount,
        MemberRole myRole,
        List<ChannelDto> channels
) {
}
