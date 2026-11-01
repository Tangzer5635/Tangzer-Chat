package net.ent.etnc.chattangzer.security;

import net.ent.etnc.chattangzer.services.AccessService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Vérifie chaque abonnement STOMP : on ne peut écouter un salon ou un
 * serveur que si l'on en est membre. Toute autre destination est refusée.
 *
 * Un abonnement refusé est simplement ignoré (la connexion reste ouverte).
 */
@Component
public class StompSubscriptionGuard implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompSubscriptionGuard.class);

    private static final Pattern CHANNEL_TOPIC = Pattern.compile("^/topic/channels/(\\d+)$");
    private static final Pattern SERVER_TOPIC = Pattern.compile("^/topic/servers/(\\d+)$");

    private final AccessService accessService;

    public StompSubscriptionGuard(AccessService accessService) {
        this.accessService = accessService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            return message;
        }

        String destination = accessor.getDestination();
        if (destination != null && accessor.getUser() != null
                && isAllowed(destination, AuthUser.from(accessor.getUser()).id())) {
            return message;
        }

        log.debug("Abonnement refusé : {} pour {}", destination, accessor.getUser());
        return null;
    }

    boolean isAllowed(String destination, Long userId) {
        // Files personnelles : Spring les limite déjà à l'utilisateur connecté.
        // Présence : qui est en ligne, visible par tous les utilisateurs connectés.
        if (destination.startsWith("/user/queue/") || destination.equals("/topic/presence")) {
            return true;
        }

        Matcher channelMatcher = CHANNEL_TOPIC.matcher(destination);
        if (channelMatcher.matches()) {
            return accessService.canAccessChannel(Long.valueOf(channelMatcher.group(1)), userId);
        }

        Matcher serverMatcher = SERVER_TOPIC.matcher(destination);
        if (serverMatcher.matches()) {
            return accessService.isMember(Long.valueOf(serverMatcher.group(1)), userId);
        }

        return false;
    }
}
