package net.ent.etnc.chattangzer.models.dtos;

/** Modifications du profil et des préférences (null = inchangé). */
public final class ProfileRequests {

    private ProfileRequests() {
    }

    /** {@code avatarId} : une image envoyée via /api/attachments, ou "" pour revenir aux initiales. */
    public record Profile(String displayName, String bio, String bannerColor, String avatarId) {}

    public record Preferences(String theme, Integer fontSize, Boolean compact) {}

    public record Password(String currentPassword, String newPassword) {}
}
