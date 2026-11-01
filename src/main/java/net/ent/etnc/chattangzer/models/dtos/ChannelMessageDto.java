package net.ent.etnc.chattangzer.models.dtos;

import java.time.Instant;

/** Message diffusé dans un salon. */
public record ChannelMessageDto(String id, Long channelId, UserDto author, String content, Instant createdAt) {
}
