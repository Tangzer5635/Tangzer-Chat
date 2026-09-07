package net.ent.etnc.chattangzer.models.dtos;

public record TypingStatus(
        String username,
        String recipient,
        boolean typing
) {
}
