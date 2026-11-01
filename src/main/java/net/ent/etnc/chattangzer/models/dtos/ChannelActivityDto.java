package net.ent.etnc.chattangzer.models.dtos;

import java.util.List;

/** « Nouveau message dans tel salon » : sert aux badges de non-lus et aux mentions. */
public record ChannelActivityDto(Long serverId, Long channelId, Long messageId, Long authorId, List<String> mentions) {
}
