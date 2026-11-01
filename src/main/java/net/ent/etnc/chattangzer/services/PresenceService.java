package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.models.dtos.PresenceDto;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.models.entities.UserStatus;
import net.ent.etnc.chattangzer.repositories.UserRepository;
import net.ent.etnc.chattangzer.security.AuthUser;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Qui est en ligne ? Calculé en mémoire à partir des connexions WebSocket :
 * un utilisateur peut avoir plusieurs onglets ouverts, il n'est hors ligne
 * qu'une fois le dernier fermé.
 *
 * Chaque changement visible est diffusé sur /topic/presence.
 */
@Service
public class PresenceService {

    /** Ce que l'on retient de chaque utilisateur connecté. */
    private static final class Presence {
        /** sessionId → la session est-elle inactive ? */
        final Map<String, Boolean> sessions = new ConcurrentHashMap<>();
        volatile UserStatus preference = UserStatus.ONLINE;
        volatile String customStatus;
    }

    private final Map<Long, Presence> presences = new ConcurrentHashMap<>();
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public PresenceService(UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // ---------------------------------------------------------- Règle métier

    /**
     * Statut vu par les autres, à partir du statut choisi et de l'état de chaque session.
     * Aucune session → hors ligne ; invisible → hors ligne ; « en ligne » mais toutes
     * les sessions inactives → inactif.
     */
    static UserStatus effectiveStatus(UserStatus preference, Collection<Boolean> sessionsIdle) {
        if (sessionsIdle.isEmpty() || preference == UserStatus.INVISIBLE) {
            return UserStatus.OFFLINE;
        }
        if (preference == UserStatus.ONLINE && sessionsIdle.stream().allMatch(Boolean::booleanValue)) {
            return UserStatus.IDLE;
        }
        return preference;
    }

    // ------------------------------------------------------ Connexions STOMP

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        Long userId = userIdOf(event.getUser());
        String sessionId = StompHeaderAccessor.wrap(event.getMessage()).getSessionId();
        if (userId != null && sessionId != null) {
            sessionOpened(userId, sessionId);
        }
    }

    @EventListener
    public void onDisconnected(SessionDisconnectEvent event) {
        Long userId = userIdOf(event.getUser());
        if (userId != null) {
            sessionClosed(userId, event.getSessionId());
        }
    }

    void sessionOpened(Long userId, String sessionId) {
        update(userId, presence -> presence.sessions.put(sessionId, false));
    }

    void sessionClosed(Long userId, String sessionId) {
        update(userId, presence -> presence.sessions.remove(sessionId));
    }

    /** Le navigateur signale qu'on ne touche plus à cet onglet (ou qu'on est revenu). */
    public void setIdle(Long userId, String sessionId, boolean idle) {
        update(userId, presence -> presence.sessions.computeIfPresent(sessionId, (id, previous) -> idle));
    }

    /** Statut choisi par l'utilisateur (déjà enregistré en base par UserService). */
    public void preferenceChanged(Long userId, UserStatus status, String customStatus) {
        update(userId, presence -> {
            presence.preference = status;
            presence.customStatus = customStatus;
        });
    }

    // --------------------------------------------------------------- Lecture

    public UserStatus statusOf(Long userId) {
        Presence presence = presences.get(userId);
        return presence == null ? UserStatus.OFFLINE : effectiveStatus(presence.preference, presence.sessions.values());
    }

    /** Tous les utilisateurs visibles en ligne (inactifs et « ne pas déranger » compris). */
    public List<PresenceDto> snapshot() {
        return presences.entrySet().stream()
                .map(entry -> toDto(entry.getKey(), entry.getValue()))
                .filter(dto -> dto.status() != UserStatus.OFFLINE)
                .toList();
    }

    // ---------------------------------------------------------------- Outils

    private interface Change {
        void apply(Presence presence);
    }

    /** Applique un changement et diffuse la nouvelle présence si ce que voient les autres a changé. */
    private void update(Long userId, Change change) {
        PresenceDto before;
        PresenceDto after;
        synchronized (presences) {
            Presence presence = presences.computeIfAbsent(userId, this::load);
            before = toDto(userId, presence);
            change.apply(presence);
            after = toDto(userId, presence);
        }
        if (!Objects.equals(before, after)) {
            messagingTemplate.convertAndSend("/topic/presence", after);
        }
    }

    private Presence load(Long userId) {
        Presence presence = new Presence();
        userRepository.findById(userId).ifPresent((User user) -> {
            presence.preference = user.getStatus();
            presence.customStatus = user.getCustomStatus();
        });
        return presence;
    }

    private PresenceDto toDto(Long userId, Presence presence) {
        UserStatus status = effectiveStatus(presence.preference, presence.sessions.values());
        // Un utilisateur hors ligne (ou invisible) n'affiche pas son statut personnalisé.
        return new PresenceDto(userId, status, status == UserStatus.OFFLINE ? null : presence.customStatus);
    }

    private static Long userIdOf(Principal principal) {
        try {
            return principal == null ? null : AuthUser.from(principal).id();
        } catch (IllegalStateException e) {
            return null;
        }
    }
}
