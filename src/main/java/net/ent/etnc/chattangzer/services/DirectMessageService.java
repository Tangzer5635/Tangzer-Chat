package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.DmDto;
import net.ent.etnc.chattangzer.models.dtos.MessagePreviewDto;
import net.ent.etnc.chattangzer.models.dtos.UnreadDto;
import net.ent.etnc.chattangzer.models.dtos.UserDto;
import net.ent.etnc.chattangzer.models.entities.Channel;
import net.ent.etnc.chattangzer.models.entities.ChannelRead;
import net.ent.etnc.chattangzer.models.entities.ChannelType;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.ChannelReadRepository;
import net.ent.etnc.chattangzer.repositories.ChannelRepository;
import net.ent.etnc.chattangzer.repositories.MessageRepository;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Conversations privées : une conversation est un salon de type DM entre deux
 * utilisateurs. Les messages eux-mêmes passent par MessageService, comme
 * dans un salon de serveur (historique, réponses, réactions…).
 */
@Service
@Transactional
public class DirectMessageService {

    private static final int PREVIEW_LENGTH = 80;

    private final ChannelRepository channelRepository;
    private final MessageRepository messageRepository;
    private final ChannelReadRepository readRepository;
    private final UserRepository userRepository;

    public DirectMessageService(
            ChannelRepository channelRepository,
            MessageRepository messageRepository,
            ChannelReadRepository readRepository,
            UserRepository userRepository
    ) {
        this.channelRepository = channelRepository;
        this.messageRepository = messageRepository;
        this.readRepository = readRepository;
        this.userRepository = userRepository;
    }

    /** Ouvre la conversation avec quelqu'un (la crée si elle n'existe pas encore). */
    public DmDto open(Long userId, Long otherUserId) {
        if (Objects.equals(userId, otherUserId)) {
            throw ApiException.badRequest("Tu ne peux pas t'écrire à toi-même");
        }
        User me = getUser(userId);
        User other = getUser(otherUserId);

        // On range toujours la paire dans le même ordre : une seule conversation possible.
        User first = me.getId() < other.getId() ? me : other;
        User second = first == me ? other : me;

        Channel channel = channelRepository.findByDmUser1IdAndDmUser2Id(first.getId(), second.getId())
                .orElseGet(() -> {
                    Channel created = new Channel(null, "dm", ChannelType.DM, 0);
                    created.setDmUser1(first);
                    created.setDmUser2(second);
                    return channelRepository.save(created);
                });

        long unread = unreadByChannel(userId).getOrDefault(channel.getId(), 0L);
        return toDto(channel, userId, unread);
    }

    /** Mes conversations, la plus récente d'abord. */
    @Transactional(readOnly = true)
    public List<DmDto> list(Long userId) {
        Map<Long, Long> unread = unreadByChannel(userId);
        return channelRepository.findDirectChannels(userId, ChannelType.DM).stream()
                .map(channel -> toDto(channel, userId, unread.getOrDefault(channel.getId(), 0L)))
                .toList();
    }

    private Map<Long, Long> unreadByChannel(Long userId) {
        return messageRepository.countUnread(userId).stream()
                .filter(entry -> entry.serverId() == null)
                .collect(Collectors.toMap(UnreadDto::channelId, UnreadDto::count));
    }

    private DmDto toDto(Channel channel, Long userId, long unread) {
        User other = channel.getDmUser1().getId().equals(userId) ? channel.getDmUser2() : channel.getDmUser1();

        MessagePreviewDto lastMessage = messageRepository.findFirstByChannelIdOrderByIdDesc(channel.getId())
                .map(m -> new MessagePreviewDto(m.getId(), UserDto.from(m.getAuthor()), truncate(m.getContent())))
                .orElse(null);

        Long otherLastRead = readRepository.findByUserIdAndChannelId(other.getId(), channel.getId())
                .map(ChannelRead::getLastReadMessageId)
                .orElse(null);

        return new DmDto(channel.getId(), UserDto.from(other), lastMessage, channel.getLastMessageAt(), unread, otherLastRead);
    }

    private static String truncate(String content) {
        if (content.isBlank()) {
            return "📷 Photo";
        }
        return content.length() <= PREVIEW_LENGTH ? content : content.substring(0, PREVIEW_LENGTH) + "…";
    }

    private User getUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
    }
}
