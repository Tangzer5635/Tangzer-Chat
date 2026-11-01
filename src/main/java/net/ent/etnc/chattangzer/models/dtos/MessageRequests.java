package net.ent.etnc.chattangzer.models.dtos;

/** Corps des requêtes sur les messages. */
public final class MessageRequests {

    private MessageRequests() {
    }

    public record Send(String content, Long replyToId, String nonce) {}

    public record Edit(String content) {}

    public record React(String emoji) {}

    public record Read(Long messageId) {}
}
