package net.ent.etnc.chattangzer.models.dtos;

/**
 * Création ou modification d'un serveur (en modification, null = inchangé).
 * {@code iconImageId} : une image envoyée via /api/attachments, ou "" pour la retirer.
 */
public record ServerRequest(String name, String description, String icon, String color, Boolean isPublic, String iconImageId) {

    public ServerRequest(String name, String description, String icon, String color, Boolean isPublic) {
        this(name, description, icon, color, isPublic, null);
    }
}
