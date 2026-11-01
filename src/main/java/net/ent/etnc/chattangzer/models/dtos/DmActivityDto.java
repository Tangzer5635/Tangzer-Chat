package net.ent.etnc.chattangzer.models.dtos;

import java.util.List;

/** Nouveau message privé, envoyé aux deux participants (liste des conversations, non-lus, notification). */
public record DmActivityDto(Long channelId, List<UserDto> participants, MessageDto message) {
}
