package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.User;

import java.time.Instant;

/** Carte de profil d'un utilisateur. */
public record ProfileDto(UserDto user, String bannerColor, String bio, Instant createdAt) {

    public static ProfileDto from(User user) {
        return new ProfileDto(UserDto.from(user), user.getBannerColor(), user.getBio(), user.getCreatedAt());
    }
}
