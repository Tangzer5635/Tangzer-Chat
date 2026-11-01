package net.ent.etnc.chattangzer.models.dtos;

import java.util.List;

/** Corps des requêtes sur les messages. */
public final class MessageRequests {

    private MessageRequests() {
    }

    /** {@code attachmentIds} : photos déjà envoyées via POST /api/attachments. */
    public record Send(String content, Long replyToId, String nonce, List<String> attachmentIds) {

        public Send(String content, Long replyToId, String nonce) {
            this(content, replyToId, nonce, List.of());
        }
    }

    public record Edit(String content) {}

    public record React(String emoji) {}

    public record Read(Long messageId) {}
}
