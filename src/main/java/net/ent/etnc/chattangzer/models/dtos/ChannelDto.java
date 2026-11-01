package net.ent.etnc.chattangzer.models.dtos;

import net.ent.etnc.chattangzer.models.entities.Channel;
import net.ent.etnc.chattangzer.models.entities.ChannelType;

public record ChannelDto(Long id, Long serverId, String name, String topic, ChannelType type, int position) {

    public static ChannelDto from(Channel channel) {
        return new ChannelDto(
                channel.getId(),
                channel.getServer() == null ? null : channel.getServer().getId(),
                channel.getName(),
                channel.getTopic(),
                channel.getType(),
                channel.getPosition()
        );
    }
}
