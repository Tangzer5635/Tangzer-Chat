package net.ent.etnc.chattangzer.models.dtos;

/** Création ou modification d'un serveur (en modification, null = inchangé). */
public record ServerRequest(String name, String description, String icon, String color, Boolean isPublic) {
}
