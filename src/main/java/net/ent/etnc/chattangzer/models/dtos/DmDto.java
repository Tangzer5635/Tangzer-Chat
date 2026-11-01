package net.ent.etnc.chattangzer.models.dtos;

import java.time.Instant;

/**
 * Une conversation privée vue par l'un des deux participants.
 * {@code otherLastReadMessageId} : jusqu'où l'autre a lu (pour afficher « Vu »).
 */
public record DmDto(
        Long channelId,
        UserDto otherUser,
        MessagePreviewDto lastMessage,
        Instant lastMessageAt,
        long unreadCount,
        Long otherLastReadMessageId
) {
}
