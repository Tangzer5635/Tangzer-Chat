package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.AttachmentDto;
import net.ent.etnc.chattangzer.models.dtos.ChannelActivityDto;
import net.ent.etnc.chattangzer.models.dtos.DmActivityDto;
import net.ent.etnc.chattangzer.models.dtos.MessageDto;
import net.ent.etnc.chattangzer.models.dtos.MessagePreviewDto;
import net.ent.etnc.chattangzer.models.dtos.MessageRequests;
import net.ent.etnc.chattangzer.models.dtos.ReactionDto;
import net.ent.etnc.chattangzer.models.dtos.UnreadDto;
import net.ent.etnc.chattangzer.models.dtos.UserDto;
import net.ent.etnc.chattangzer.models.entities.Channel;
import net.ent.etnc.chattangzer.models.entities.ChannelRead;
import net.ent.etnc.chattangzer.models.entities.ChannelType;
import net.ent.etnc.chattangzer.models.entities.Message;
import net.ent.etnc.chattangzer.models.entities.MessageReaction;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.ChannelReadRepository;
import net.ent.etnc.chattangzer.repositories.MessageReactionRepository;
import net.ent.etnc.chattangzer.repositories.MessageRepository;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Messages des salons : historique, envoi, modification, suppression,
 * réactions et suivi de lecture. Chaque changement est diffusé en temps réel.
 */
@Service
@Transactional
public class MessageService {

    public static final int CONTENT_MAX_LENGTH = 2000;
    public static final int PAGE_MAX_SIZE = 100;
    public static final int REACTIONS_MAX_PER_MESSAGE = 20;
    private static final int PREVIEW_LENGTH = 120;
    private static final Pattern MENTION = Pattern.compile("@([A-Za-z0-9_.]{3,20})");

    private final MessageRepository messageRepository;
    private final MessageReactionRepository reactionRepository;
    private final ChannelReadRepository readRepository;
    private final UserRepository userRepository;
    private final AccessService accessService;
    private final AttachmentService attachmentService;
    private final RealtimeService realtime;

    public MessageService(
            MessageRepository messageRepository,
            MessageReactionRepository reactionRepository,
            ChannelReadRepository readRepository,
            UserRepository userRepository,
            AccessService accessService,
            AttachmentService attachmentService,
            RealtimeService realtime
    ) {
        this.messageRepository = messageRepository;
        this.reactionRepository = reactionRepository;
        this.readRepository = readRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
        this.attachmentService = attachmentService;
        this.realtime = realtime;
    }

    // --------------------------------------------------------------- Lecture

    /** Messages plus anciens que {@code before} (ou les plus récents), du plus ancien au plus récent. */
    @Transactional(readOnly = true)
    public List<MessageDto> history(Long channelId, Long userId, Long before, Integer limit) {
        accessService.requireChannel(channelId, userId);

        int size = limit == null ? 50 : Math.clamp(limit, 1, PAGE_MAX_SIZE);
        List<Message> page = new ArrayList<>(messageRepository.findPage(
                channelId, before == null ? Long.MAX_VALUE : before, PageRequest.of(0, size)));
        Collections.reverse(page);

        return toDtos(page);
    }

    @Transactional(readOnly = true)
    public List<UnreadDto> unread(Long userId) {
        return messageRepository.countUnread(userId);
    }

    // --------------------------------------------------------------- Écriture

    public MessageDto send(Long channelId, Long userId, MessageRequests.Send request) {
        Channel channel = accessService.requireChannel(channelId, userId);
        if (channel.getType() == ChannelType.VOICE) {
            throw ApiException.badRequest("On ne peut pas écrire dans un salon vocal");
        }
        User author = getUser(userId);

        boolean hasAttachments = request.attachmentIds() != null && !request.attachmentIds().isEmpty();
        Message message = new Message(channel, author, validateContent(request.content(), hasAttachments));

        if (request.replyToId() != null) {
            Message replyTo = messageRepository.findById(request.replyToId())
                    .filter(m -> m.getChannel().getId().equals(channelId))
                    .orElseThrow(() -> ApiException.badRequest("Le message auquel tu réponds n'existe plus"));
            message.setReplyTo(replyTo);
        }

        messageRepository.save(message);
        if (channel.isDirect()) {
            channel.setLastMessageAt(message.getCreatedAt());
        }
        List<AttachmentDto> attachments = attachmentService.attachToMessage(message.getId(), userId, request.attachmentIds());
        markRead(channelId, userId, message.getId());

        MessageDto dto = toDto(message, List.of(), attachments, request.nonce());
        realtime.toChannel(channelId, "MESSAGE_CREATED", dto);
        announceActivity(channel, message, dto);
        return dto;
    }

    public MessageDto edit(Long messageId, Long userId, String content) {
        Message message = getMessage(messageId);
        accessService.requireChannel(message.getChannel().getId(), userId);

        if (!message.getAuthor().getId().equals(userId)) {
            throw ApiException.forbidden("Tu ne peux modifier que tes propres messages");
        }

        boolean hasAttachments = !attachmentService.byMessage(List.of(messageId)).isEmpty();
        message.setContent(validateContent(content, hasAttachments));
        message.setEditedAt(Instant.now());

        MessageDto dto = toDtos(List.of(message)).getFirst();
        realtime.toChannel(message.getChannel().getId(), "MESSAGE_UPDATED", dto);
        return dto;
    }

    public void delete(Long messageId, Long userId) {
        Message message = getMessage(messageId);
        Channel channel = accessService.requireChannel(message.getChannel().getId(), userId);

        boolean isAuthor = message.getAuthor().getId().equals(userId);
        boolean isModerator = channel.getServer() != null
                && accessService.requireMembership(channel.getServer().getId(), userId).getRole().canManageServer();
        if (!isAuthor && !isModerator) {
            throw ApiException.forbidden("Tu ne peux supprimer que tes propres messages");
        }

        Long channelId = channel.getId();
        attachmentService.deleteForMessage(messageId);
        reactionRepository.deleteAllByMessageId(messageId);
        messageRepository.detachReplies(messageId);
        messageRepository.deleteById(messageId);

        realtime.toChannel(channelId, "MESSAGE_DELETED", Map.of("channelId", channelId, "messageId", messageId));
    }

    /** Ajoute la réaction si je ne l'ai pas encore mise, sinon la retire. */
    public List<ReactionDto> toggleReaction(Long messageId, Long userId, String rawEmoji) {
        Message message = getMessage(messageId);
        accessService.requireChannel(message.getChannel().getId(), userId);

        String emoji = rawEmoji == null ? "" : rawEmoji.strip();
        if (emoji.isEmpty() || emoji.length() > 32 || emoji.chars().anyMatch(Character::isWhitespace)) {
            throw ApiException.badRequest("Réaction invalide");
        }

        reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, userId, emoji)
                .ifPresentOrElse(reactionRepository::delete, () -> {
                    boolean newEmoji = !reactionRepository.existsByMessageIdAndEmoji(messageId, emoji);
                    if (newEmoji && reactionRepository.countDistinctEmojis(messageId) >= REACTIONS_MAX_PER_MESSAGE) {
                        throw ApiException.badRequest("Ce message a déjà trop de réactions différentes");
                    }
                    reactionRepository.save(new MessageReaction(message, userId, emoji));
                });
        reactionRepository.flush();

        List<ReactionDto> reactions = reactionsByMessage(List.of(messageId)).getOrDefault(messageId, List.of());
        realtime.toChannel(message.getChannel().getId(), "REACTIONS_UPDATED",
                Map.of("channelId", message.getChannel().getId(), "messageId", messageId, "reactions", reactions));
        return reactions;
    }

    /** Enregistre que j'ai lu le salon jusqu'à ce message (jamais en arrière). */
    public void markRead(Long channelId, Long userId, Long messageId) {
        Channel channel = accessService.requireChannel(channelId, userId);
        if (messageId == null) {
            return;
        }
        ChannelRead read = readRepository.findByUserIdAndChannelId(userId, channelId)
                .orElseGet(() -> new ChannelRead(userId, channelId, 0L));
        if (messageId > read.getLastReadMessageId()) {
            read.setLastReadMessageId(messageId);
            readRepository.save(read);
            // En message privé, l'autre voit « Vu » sous son message.
            if (channel.isDirect()) {
                realtime.toChannel(channelId, "READ",
                        Map.of("channelId", channelId, "userId", userId, "lastReadMessageId", messageId));
            }
        }
    }

    // ------------------------------------------------------------------ Outils

    /**
     * Prévient qu'il y a du nouveau : les membres du serveur (badges, mentions),
     * ou les deux participants d'une conversation privée (liste des MP, notification).
     */
    private void announceActivity(Channel channel, Message message, MessageDto dto) {
        if (channel.isDirect()) {
            DmActivityDto activity = new DmActivityDto(channel.getId(),
                    List.of(UserDto.from(channel.getDmUser1()), UserDto.from(channel.getDmUser2())), dto);
            realtime.toUser(channel.getDmUser1().getUsername(), "DM_ACTIVITY", activity);
            realtime.toUser(channel.getDmUser2().getUsername(), "DM_ACTIVITY", activity);
            return;
        }
        Long serverId = channel.getServer().getId();
        realtime.toServer(serverId, "CHANNEL_ACTIVITY", new ChannelActivityDto(
                serverId, channel.getId(), message.getId(), message.getAuthor().getId(),
                extractMentions(message.getContent())));
    }

    /** « salut @Tanguy et @pigloo » → [tanguy, pigloo]. */
    static List<String> extractMentions(String content) {
        Set<String> mentions = new LinkedHashSet<>();
        Matcher matcher = MENTION.matcher(content);
        while (matcher.find()) {
            mentions.add(matcher.group(1).toLowerCase(Locale.ROOT));
        }
        return List.copyOf(mentions);
    }

    /** Un message peut être vide s'il contient des photos. */
    static String validateContent(String raw, boolean hasAttachments) {
        String content = raw == null ? "" : raw.strip();
        if (content.isEmpty() && !hasAttachments) {
            throw ApiException.badRequest("Le message est vide");
        }
        if (content.length() > CONTENT_MAX_LENGTH) {
            throw ApiException.badRequest("Un message ne doit pas dépasser " + CONTENT_MAX_LENGTH + " caractères");
        }
        return content;
    }

    private List<MessageDto> toDtos(List<Message> messages) {
        List<Long> ids = messages.stream().map(Message::getId).toList();
        Map<Long, List<ReactionDto>> reactions = reactionsByMessage(ids);
        Map<Long, List<AttachmentDto>> attachments = attachmentService.byMessage(ids);
        return messages.stream()
                .map(m -> toDto(m, reactions.getOrDefault(m.getId(), List.of()),
                        attachments.getOrDefault(m.getId(), List.of()), null))
                .toList();
    }

    private MessageDto toDto(Message message, List<ReactionDto> reactions, List<AttachmentDto> attachments, String nonce) {
        Message replyTo = message.getReplyTo();
        MessagePreviewDto preview = replyTo == null ? null : new MessagePreviewDto(
                replyTo.getId(),
                UserDto.from(replyTo.getAuthor()),
                truncate(replyTo.getContent()));

        return new MessageDto(
                message.getId(),
                message.getChannel().getId(),
                UserDto.from(message.getAuthor()),
                message.getContent(),
                message.getCreatedAt(),
                message.getEditedAt(),
                preview,
                reactions,
                attachments,
                nonce);
    }

    /** Regroupe les réactions par message puis par emoji, dans l'ordre où elles ont été ajoutées. */
    private Map<Long, List<ReactionDto>> reactionsByMessage(List<Long> messageIds) {
        if (messageIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Map<String, List<Long>>> grouped = new LinkedHashMap<>();
        for (MessageReaction reaction : reactionRepository.findAllByMessageIdInOrderByCreatedAtAscIdAsc(messageIds)) {
            grouped.computeIfAbsent(reaction.getMessage().getId(), id -> new LinkedHashMap<>())
                    .computeIfAbsent(reaction.getEmoji(), emoji -> new ArrayList<>())
                    .add(reaction.getUserId());
        }

        Map<Long, List<ReactionDto>> result = new LinkedHashMap<>();
        grouped.forEach((messageId, byEmoji) -> result.put(messageId,
                byEmoji.entrySet().stream().map(e -> new ReactionDto(e.getKey(), e.getValue())).toList()));
        return result;
    }

    /** Aperçu court d'un message ; une photo seule devient « 📷 Photo ». */
    static String truncate(String content) {
        if (content.isBlank()) {
            return "📷 Photo";
        }
        return content.length() <= PREVIEW_LENGTH ? content : content.substring(0, PREVIEW_LENGTH) + "…";
    }

    private Message getMessage(Long messageId) {
        return messageRepository.findById(messageId)
                .orElseThrow(() -> ApiException.notFound("Message introuvable"));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
    }
}
