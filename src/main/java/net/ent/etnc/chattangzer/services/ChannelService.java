package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.ChannelDto;
import net.ent.etnc.chattangzer.models.dtos.ChannelRequest;
import net.ent.etnc.chattangzer.models.entities.Channel;
import net.ent.etnc.chattangzer.models.entities.ChannelType;
import net.ent.etnc.chattangzer.models.entities.Membership;
import net.ent.etnc.chattangzer.repositories.ChannelRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Map;

/**
 * Salons d'un serveur : création, renommage, suppression.
 */
@Service
@Transactional
public class ChannelService {

    public static final int NAME_MAX_LENGTH = 32;
    public static final int TOPIC_MAX_LENGTH = 200;

    private final ChannelRepository channelRepository;
    private final AccessService accessService;
    private final RealtimeService realtime;

    public ChannelService(ChannelRepository channelRepository, AccessService accessService, RealtimeService realtime) {
        this.channelRepository = channelRepository;
        this.accessService = accessService;
        this.realtime = realtime;
    }

    public ChannelDto create(Long serverId, Long userId, ChannelRequest request) {
        Membership membership = accessService.requireManager(serverId, userId);

        ChannelType type = request.type() == null ? ChannelType.TEXT : request.type();
        int position = (int) channelRepository.countByServerId(serverId);

        Channel channel = new Channel(membership.getServer(), normalizeName(request.name()), type, position);
        channel.setTopic(Texts.optional(request.topic(), TOPIC_MAX_LENGTH, "Le sujet"));
        channelRepository.save(channel);

        ChannelDto dto = ChannelDto.from(channel);
        realtime.toServer(serverId, "CHANNEL_CREATED", dto);
        return dto;
    }

    public ChannelDto update(Long channelId, Long userId, ChannelRequest request) {
        Channel channel = requireManagedChannel(channelId, userId);

        if (request.name() != null) {
            channel.setName(normalizeName(request.name()));
        }
        if (request.topic() != null) {
            channel.setTopic(Texts.optional(request.topic(), TOPIC_MAX_LENGTH, "Le sujet"));
        }

        ChannelDto dto = ChannelDto.from(channel);
        realtime.toServer(channel.getServer().getId(), "CHANNEL_UPDATED", dto);
        return dto;
    }

    public void delete(Long channelId, Long userId) {
        Channel channel = requireManagedChannel(channelId, userId);
        Long serverId = channel.getServer().getId();

        long textChannels = channelRepository.findAllByServerIdOrderByPositionAscIdAsc(serverId).stream()
                .filter(c -> c.getType() == ChannelType.TEXT)
                .count();
        if (channel.getType() == ChannelType.TEXT && textChannels <= 1) {
            throw ApiException.badRequest("Un serveur doit garder au moins un salon textuel");
        }

        channelRepository.delete(channel);
        realtime.toServer(serverId, "CHANNEL_DELETED", Map.of("serverId", serverId, "channelId", channelId));
    }

    private Channel requireManagedChannel(Long channelId, Long userId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> ApiException.notFound("Salon introuvable"));
        accessService.requireManager(channel.getServer().getId(), userId);
        return channel;
    }

    /**
     * Les noms de salon suivent le style Discord : « Mon Salon » devient « mon-salon ».
     * Accents et emojis sont conservés ; seuls quelques caractères gênants sont retirés.
     */
    static String normalizeName(String raw) {
        String name = (raw == null ? "" : raw.strip())
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", "-")
                .replaceAll("[#/\\\\?%&<>\"'`]", "")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-+|-+$", "");

        int length = Texts.length(name);
        if (length < 1 || length > NAME_MAX_LENGTH) {
            throw ApiException.badRequest("Le nom du salon doit faire entre 1 et " + NAME_MAX_LENGTH + " caractères");
        }
        return name;
    }
}
