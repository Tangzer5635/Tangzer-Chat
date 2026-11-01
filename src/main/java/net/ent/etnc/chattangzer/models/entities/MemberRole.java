package net.ent.etnc.chattangzer.models.entities;

/**
 * Rôle d'un membre dans un serveur.
 * OWNER : tout, y compris supprimer le serveur et nommer des admins.
 * ADMIN : gérer le serveur, les salons et expulser des membres.
 * MEMBER : discuter et inviter.
 */
public enum MemberRole {
    OWNER,
    ADMIN,
    MEMBER;

    public boolean canManageServer() {
        return this == OWNER || this == ADMIN;
    }
}
