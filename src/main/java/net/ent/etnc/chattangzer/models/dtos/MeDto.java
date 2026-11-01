package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.models.entities.UserStatus;

/** L'utilisateur connecté, avec ses préférences. */
public record MeDto(Long id, String username, String displayName, UserStatus status, String customStatus) {

    public static MeDto from(User user) {
        return new MeDto(user.getId(), user.getUsername(), user.getDisplayName(), user.getStatus(), user.getCustomStatus());
    }
}
