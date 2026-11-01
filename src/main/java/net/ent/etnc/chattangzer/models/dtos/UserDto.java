package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.User;

/** Vue publique d'un utilisateur (jamais de mot de passe). */
public record UserDto(Long id, String username, String displayName, String avatarUrl) {

    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getUsername(), user.getDisplayName(), imageUrl(user.getAvatarId()));
    }

    /** Adresse d'une image envoyée, ou null. */
    public static String imageUrl(String attachmentId) {
        return attachmentId == null ? null : "/api/attachments/" + attachmentId;
    }
}
