package net.ent.etnc.chattangzer.models.dtos;

/** Serveur vu de l'extérieur (page Explorer, aperçu d'invitation). */
public record DiscoverServerDto(
        Long id,
        String name,
        String description,
        String icon,
        String iconUrl,
        String color,
        long memberCount,
        boolean joined
) {
}
