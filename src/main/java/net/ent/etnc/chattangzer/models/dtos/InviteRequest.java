package net.ent.etnc.chattangzer.models.dtos;

/** Options d'une invitation : null = sans limite. */
public record InviteRequest(Integer maxAgeHours, Integer maxUses) {
}
