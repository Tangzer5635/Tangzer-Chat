package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.User;

/** Vue publique d'un utilisateur (jamais de mot de passe). */
public record UserDto(Long id, String username, String displayName) {

    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getUsername(), user.getDisplayName());
    }
}
