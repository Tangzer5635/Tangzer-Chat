package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.models.entities.UserStatus;

/** L'utilisateur connecté, avec son profil et ses préférences. */
public record MeDto(
        Long id,
        String username,
        String displayName,
        String avatarUrl,
        UserStatus status,
        String customStatus,
        String bannerColor,
        String bio,
        String theme,
        String accentColor,
        int fontSize,
        boolean compact
) {

    public static MeDto from(User user) {
        return new MeDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                UserDto.imageUrl(user.getAvatarId()),
                user.getStatus(),
                user.getCustomStatus(),
                user.getBannerColor(),
                user.getBio(),
                user.getTheme(),
                user.getAccentColor(),
                user.getFontSize(),
                user.isCompact());
    }
}
